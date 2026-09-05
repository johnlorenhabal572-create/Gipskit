import express from 'express';
import cors from 'cors';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { connectMongoose, getDbStatus, memoryStore, mongoose } from './server/db';
import { User, VerificationCode, Order } from './server/models';
import { sendVerificationEmail } from './server/email';
import productRoutes from './server/routes/productRoutes';
import inventoryRoutes from './server/routes/inventoryRoutes';
import orderRoutes from './server/routes/orderRoutes';
import categoryRoutes from './server/routes/categoryRoutes';

// Security Helper: Safe string extractor and sanitizer
function sanitizeString(input: unknown, maxLength = 255): string {
  if (typeof input !== 'string') return '';
  return input.trim().slice(0, maxLength);
}

// Gmail format validator: must be a valid @gmail.com address
function isGmailAddress(email: string): boolean {
  const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i;
  return gmailRegex.test(email);
}

// Password rules: Exactly 8 characters total, with at least 1 uppercase letter and 1 number
function validatePassword(password: string): { isValid: boolean; error?: string } {
  if (typeof password !== 'string') {
    return { isValid: false, error: 'Password must be provided as text.' };
  }
  if (password.length !== 8) {
    return { isValid: false, error: 'Password must be exactly 8 characters in length.' };
  }
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least 1 capital/uppercase letter.' };
  }
  if (!/[0-9]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least 1 number.' };
  }
  return { isValid: true };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Attempt initial Mongoose connection to MongoDB Atlas in background
  connectMongoose().catch(err => {
    console.warn('[MongoDB Atlas Init]', err?.message || err);
  });

  // 1. Health check & DB status
  app.get('/api/health', async (req, res) => {
    const { isConnected, dbName } = await getDbStatus();
    res.json({
      status: 'ok',
      database: isConnected ? 'mongodb_atlas_connected' : 'in_memory_fallback',
      databaseName: dbName,
      timestamp: new Date().toISOString()
    });
  });

  // 2. Send 6-Digit Verification Code to Gmail
  app.post('/api/auth/send-code', async (req, res) => {
    try {
      const email = sanitizeString(req.body.email).toLowerCase();
      const purpose = sanitizeString(req.body.purpose) || 'signup';

      if (!email) {
        return res.status(400).json({ error: 'Please enter a Gmail address.' });
      }

      if (!isGmailAddress(email)) {
        return res.status(400).json({ error: 'Sign up requires a valid Gmail account ending in @gmail.com' });
      }

      const { isConnected } = await getDbStatus();

      // Check if user already exists when signing up
      if (purpose === 'signup') {
        let existingUser = null;
        if (isConnected) {
          existingUser = await User.findOne({ email });
        } else {
          existingUser = memoryStore.users.find(u => u.email === email);
        }

        if (existingUser) {
          return res.status(400).json({ 
            error: 'An account with this Gmail address already exists. Please Sign In instead.' 
          });
        }
      }

      // Generate secure 6-digit authentication code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      if (isConnected) {
        await VerificationCode.deleteMany({ email });
        await VerificationCode.create({
          email,
          code,
          verified: false,
          expiresAt
        });
      } else {
        memoryStore.codes.set(email, {
          code,
          verified: false,
          expiresAt: expiresAt.getTime(),
          createdAt: Date.now()
        });
      }

      // Dispatch verification code via Brevo HTTPS Transactional Email API
      const result = await sendVerificationEmail(email, code);

      if (!result.sent) {
        return res.status(500).json({
          error: result.error || 'Failed to send verification email. Please check your Brevo configuration or try again later.'
        });
      }

      return res.json({
        success: true,
        message: `A 6-digit verification code has been sent to ${email}. Please check your inbox.`,
        email
      });
    } catch (error) {
      console.error('Error in send-code:', error);
      res.status(500).json({ error: 'Failed to generate verification code.' });
    }
  });

  // 3. Verify the 6-Digit Code
  app.post('/api/auth/verify-code', async (req, res) => {
    try {
      const email = sanitizeString(req.body.email).toLowerCase();
      const code = sanitizeString(req.body.code);

      if (!email || !code) {
        return res.status(400).json({ error: 'Email and verification code are required.' });
      }

      const { isConnected } = await getDbStatus();
      let isValidCode = false;

      if (isConnected) {
        const record = await VerificationCode.findOne({
          email,
          code,
          expiresAt: { $gte: new Date() }
        });

        if (record) {
          isValidCode = true;
          record.verified = true;
          await record.save();
        }
      } else {
        const record = memoryStore.codes.get(email);
        if (record && record.code === code && record.expiresAt >= Date.now()) {
          isValidCode = true;
          record.verified = true;
        }
      }

      if (!isValidCode) {
        return res.status(400).json({ error: 'Invalid or expired verification code. Please check and try again.' });
      }

      return res.json({
        success: true,
        verified: true,
        email,
        message: 'Code verified successfully! You can now create your password.'
      });
    } catch (error) {
      console.error('Error in verify-code:', error);
      res.status(500).json({ error: 'Failed to verify authentication code.' });
    }
  });

  // 4. Complete Sign Up with Password Creation
  app.post('/api/auth/signup', async (req, res) => {
    try {
      const email = sanitizeString(req.body.email).toLowerCase();
      const password = sanitizeString(req.body.password, 64);
      const name = sanitizeString(req.body.name, 100);

      if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Full Name is a required field.' });
      }

      if (!email || !isGmailAddress(email)) {
        return res.status(400).json({ error: 'A valid Gmail address (@gmail.com) is required.' });
      }

      // Strict Password Validation
      const pwdCheck = validatePassword(password);
      if (!pwdCheck.isValid) {
        return res.status(400).json({ error: pwdCheck.error });
      }

      const { isConnected } = await getDbStatus();

      // Check that code was verified
      let isVerified = false;
      if (isConnected) {
        const codeRecord = await VerificationCode.findOne({
          email,
          verified: true
        });
        if (codeRecord) {
          isVerified = true;
          await VerificationCode.deleteMany({ email });
        }
      } else {
        const record = memoryStore.codes.get(email);
        if (record && record.verified) {
          isVerified = true;
          memoryStore.codes.delete(email);
        }
      }

      if (!isVerified) {
        return res.status(400).json({ error: 'Verification code has not been verified. Please complete verification first.' });
      }

      const now = new Date();
      const newUserId = `usr_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || '127.0.0.1';
      const userAgent = req.headers['user-agent'] || 'Web Browser';

      const initialActivity = {
        timestamp: now,
        ip: clientIp,
        userAgent,
        action: 'Account Registered'
      };

      if (isConnected) {
        const existing = await User.findOne({ email });
        if (existing) {
          return res.status(400).json({ error: 'An account with this Gmail address already exists. Please Sign In.' });
        }

        await User.create({
          id: newUserId,
          email,
          name,
          password,
          role: 'customer',
          status: 'Active',
          createdAt: now,
          lastLogin: now,
          loginHistory: [initialActivity]
        });
      } else {
        const existing = memoryStore.users.find(u => u.email === email);
        if (existing) {
          return res.status(400).json({ error: 'An account with this Gmail address already exists. Please Sign In.' });
        }

        memoryStore.users.push({
          id: newUserId,
          email,
          name,
          password,
          role: 'customer',
          status: 'Active',
          createdAt: now.toISOString(),
          lastLogin: now.toISOString(),
          loginHistory: [{
            timestamp: now.toISOString(),
            ip: clientIp,
            userAgent,
            action: 'Account Registered'
          }]
        });
      }

      return res.json({
        success: true,
        message: 'Account created successfully!',
        user: {
          id: newUserId,
          email,
          name,
          role: 'customer',
          status: 'Active'
        }
      });
    } catch (error) {
      console.error('Error in signup:', error);
      res.status(500).json({ error: 'Failed to complete sign up.' });
    }
  });

  // 5. Unified Sign In for Customers and Admins
  app.post('/api/auth/login', async (req, res) => {
    try {
      const email = sanitizeString(req.body.email).toLowerCase();
      const password = sanitizeString(req.body.password, 64);

      if (!email || !password) {
        return res.status(400).json({ error: 'Please enter your Gmail and password.' });
      }

      const { isConnected } = await getDbStatus();
      let matchedUser: any = null;

      if (isConnected) {
        matchedUser = await User.findOne({ email });
      } else {
        matchedUser = memoryStore.users.find(u => u.email === email);
      }

      // Check password
      if (!matchedUser || matchedUser.password !== password) {
        return res.status(401).json({ error: 'Invalid Gmail address or password. Please try again.' });
      }

      // Check Account Status (Active / Suspended / Disabled)
      const userStatus = matchedUser.status || 'Active';
      if (userStatus === 'Suspended') {
        return res.status(403).json({ 
          error: 'Your account is currently suspended. Please contact store management.' 
        });
      }
      if (userStatus === 'Disabled') {
        return res.status(403).json({ 
          error: 'Your account has been disabled. Please contact support.' 
        });
      }

      // Record login history and update last login
      const now = new Date();
      const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || '127.0.0.1';
      const userAgent = req.headers['user-agent'] || 'Web Browser';
      const newActivity = {
        timestamp: now,
        ip: clientIp,
        userAgent,
        action: 'User Sign In'
      };

      if (isConnected && matchedUser.save) {
        matchedUser.lastLogin = now;
        if (!matchedUser.loginHistory) matchedUser.loginHistory = [];
        matchedUser.loginHistory.unshift(newActivity);
        if (matchedUser.loginHistory.length > 20) {
          matchedUser.loginHistory = matchedUser.loginHistory.slice(0, 20);
        }
        await matchedUser.save();
      } else if (matchedUser) {
        matchedUser.lastLogin = now.toISOString();
        if (!matchedUser.loginHistory) matchedUser.loginHistory = [];
        matchedUser.loginHistory.unshift({
          timestamp: now.toISOString(),
          ip: clientIp,
          userAgent,
          action: 'User Sign In'
        });
        if (matchedUser.loginHistory.length > 20) {
          matchedUser.loginHistory = matchedUser.loginHistory.slice(0, 20);
        }
      }

      return res.json({
        success: true,
        user: {
          id: matchedUser.id || matchedUser._id?.toString(),
          email: matchedUser.email,
          name: matchedUser.name,
          role: matchedUser.role || 'customer',
          status: matchedUser.status || 'Active'
        }
      });
    } catch (error) {
      console.error('Error in login:', error);
      res.status(500).json({ error: 'Failed to sign in.' });
    }
  });

  // 6. User Management (Admin only) - Fetch all registered accounts with orders count & activity history
  app.get('/api/auth/users', async (req, res) => {
    try {
      const { isConnected } = await getDbStatus();

      if (isConnected) {
        const users = await User.find({}, { password: 0 }).lean();
        
        // Count orders for each user
        const usersWithStats = await Promise.all(
          users.map(async (u: any) => {
            const orderCount = await Order.countDocuments({
              $or: [
                { 'customer.email': u.email },
                { 'customer.email': { $regex: new RegExp(`^${u.email}$`, 'i') } }
              ]
            }).catch(() => 0);

            return {
              id: u.id || u._id?.toString(),
              name: u.name,
              email: u.email,
              role: u.role || 'customer',
              status: u.status || 'Active',
              createdAt: u.createdAt || u._id?.getTimestamp?.() || new Date(),
              lastLogin: u.lastLogin || u.createdAt || new Date(),
              orderCount: orderCount || 0,
              loginHistory: u.loginHistory || []
            };
          })
        );

        return res.json(usersWithStats);
      }

      // Memory store fallback
      const safeUsers = memoryStore.users.map(({ password, ...u }) => {
        const orderCount = memoryStore.orders.filter(
          o => o.customer?.email && o.customer.email.toLowerCase() === u.email.toLowerCase()
        ).length;

        return {
          ...u,
          status: u.status || 'Active',
          orderCount,
          loginHistory: u.loginHistory || [
            {
              timestamp: u.lastLogin || u.createdAt,
              ip: '127.0.0.1',
              userAgent: 'System Session',
              action: 'Account Active'
            }
          ]
        };
      });

      return res.json(safeUsers);
    } catch (error) {
      console.error('Error in get-users:', error);
      res.status(500).json({ error: 'Failed to load user list.' });
    }
  });

  // Create Staff/Admin user account directly by Administrator
  app.post('/api/auth/users', async (req, res) => {
    try {
      const name = sanitizeString(req.body.name, 100);
      const email = sanitizeString(req.body.email).toLowerCase();
      const password = sanitizeString(req.body.password, 64);
      const role = ['admin', 'staff', 'customer'].includes(req.body.role) ? req.body.role : 'staff';
      const status = ['Active', 'Suspended', 'Disabled'].includes(req.body.status) ? req.body.status : 'Active';

      if (!name || !email || !password) {
        return res.status(400).json({ error: 'Name, email, and password are required.' });
      }

      const { isConnected } = await getDbStatus();
      const now = new Date();
      const newUserId = `usr_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      const newActivity = {
        timestamp: now,
        ip: req.ip || '127.0.0.1',
        userAgent: 'Created by Admin',
        action: 'Account Provisioned'
      };

      if (isConnected) {
        const existing = await User.findOne({ email });
        if (existing) {
          return res.status(400).json({ error: 'An account with this email already exists.' });
        }

        const created = await User.create({
          id: newUserId,
          name,
          email,
          password,
          role,
          status,
          createdAt: now,
          lastLogin: now,
          loginHistory: [newActivity]
        });

        return res.status(201).json({
          id: created.id,
          name: created.name,
          email: created.email,
          role: created.role,
          status: created.status,
          createdAt: created.createdAt,
          lastLogin: created.lastLogin,
          orderCount: 0,
          loginHistory: [newActivity]
        });
      } else {
        const existing = memoryStore.users.find(u => u.email === email);
        if (existing) {
          return res.status(400).json({ error: 'An account with this email already exists.' });
        }

        const newUser = {
          id: newUserId,
          name,
          email,
          password,
          role,
          status,
          createdAt: now.toISOString(),
          lastLogin: now.toISOString(),
          loginHistory: [{
            timestamp: now.toISOString(),
            ip: '127.0.0.1',
            userAgent: 'Created by Admin',
            action: 'Account Provisioned'
          }]
        };

        memoryStore.users.push(newUser);

        const { password: _, ...safeUser } = newUser;
        return res.status(201).json({ ...safeUser, orderCount: 0 });
      }
    } catch (error) {
      console.error('Error creating user account:', error);
      res.status(500).json({ error: 'Failed to create user account.' });
    }
  });

  // Update User Status or Role (Preserve all historical records, no permanent delete)
  app.patch('/api/auth/users/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { status, role, name } = req.body;
      const { isConnected } = await getDbStatus();

      if (status && !['Active', 'Suspended', 'Disabled'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status value.' });
      }

      if (role && !['customer', 'staff', 'admin'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role value.' });
      }

      if (isConnected) {
        const user = await User.findOne({ $or: [{ id }, { _id: id }] });
        if (!user) {
          return res.status(404).json({ error: 'User account not found.' });
        }

        if (status) user.status = status;
        if (role) user.role = role;
        if (name) user.name = sanitizeString(name, 100);

        if (!user.loginHistory) user.loginHistory = [];
        user.loginHistory.unshift({
          timestamp: new Date(),
          ip: req.ip || '127.0.0.1',
          userAgent: 'Admin Management',
          action: `Status updated to ${user.status}${role ? `, Role: ${role}` : ''}`
        });

        await user.save();

        return res.json({
          success: true,
          message: 'User account updated successfully.',
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            status: user.status,
            lastLogin: user.lastLogin,
            createdAt: user.createdAt,
            loginHistory: user.loginHistory
          }
        });
      } else {
        const user = memoryStore.users.find(u => u.id === id);
        if (!user) {
          return res.status(404).json({ error: 'User account not found.' });
        }

        if (status) user.status = status;
        if (role) user.role = role;
        if (name) user.name = sanitizeString(name, 100);

        if (!user.loginHistory) user.loginHistory = [];
        user.loginHistory.unshift({
          timestamp: new Date().toISOString(),
          ip: '127.0.0.1',
          userAgent: 'Admin Management',
          action: `Status updated to ${user.status}${role ? `, Role: ${role}` : ''}`
        });

        const { password: _, ...safeUser } = user;
        return res.json({
          success: true,
          message: 'User account updated successfully.',
          user: safeUser
        });
      }
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ error: 'Failed to update user account.' });
    }
  });

  // 7. Products REST API
  app.use('/api/products', productRoutes);

  // 8. Categories REST API
  app.use('/api/categories', categoryRoutes);

  // 9. Inventory REST API
  app.use('/api/inventory', inventoryRoutes);

  // 10. Orders & Sales REST API
  app.use('/api/orders', orderRoutes);
  app.use('/api/sales', orderRoutes);

  // Vite middleware for development vs static build in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running at:`);
    console.log(`   - Local:   http://localhost:${PORT}`);
    console.log(`   - Network: http://127.0.0.1:${PORT}`);
  });
}

startServer();
