import express from 'express';
import cors from 'cors';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { connectMongoose, getDbStatus, memoryStore, mongoose } from './server/db';
import { User, VerificationCode } from './server/models';
import { sendVerificationEmail } from './server/email';
import productRoutes from './server/routes/productRoutes';
import inventoryRoutes from './server/routes/inventoryRoutes';

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

      // Dispatch verification code via email transporter
      const { sent, previewCode } = await sendVerificationEmail(email, code);

      return res.json({
        success: true,
        message: sent 
          ? `A 6-digit verification code has been sent to ${email}` 
          : `Verification code generated for ${email}`,
        email,
        previewCode: process.env.NODE_ENV !== 'production' || !sent ? previewCode : undefined
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
      const name = sanitizeString(req.body.name, 100) || email.split('@')[0];

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
          createdAt: now,
          lastLogin: now
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
          createdAt: now.toISOString(),
          lastLogin: now.toISOString()
        });
      }

      return res.json({
        success: true,
        message: 'Account created successfully!',
        user: {
          id: newUserId,
          email,
          name,
          role: 'customer'
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

      // Update last login
      const now = new Date();
      if (isConnected && matchedUser.save) {
        matchedUser.lastLogin = now;
        await matchedUser.save();
      } else if (matchedUser) {
        matchedUser.lastLogin = now.toISOString();
      }

      return res.json({
        success: true,
        user: {
          id: matchedUser.id || matchedUser._id?.toString(),
          email: matchedUser.email,
          name: matchedUser.name,
          role: matchedUser.role || 'customer'
        }
      });
    } catch (error) {
      console.error('Error in login:', error);
      res.status(500).json({ error: 'Failed to sign in.' });
    }
  });

  // 6. User Management (Admin only)
  app.get('/api/auth/users', async (req, res) => {
    try {
      const { isConnected } = await getDbStatus();
      if (isConnected) {
        const users = await User.find({}, { password: 0 }).lean();
        return res.json(users);
      }
      const safeUsers = memoryStore.users.map(({ password, ...rest }) => rest);
      return res.json(safeUsers);
    } catch (error) {
      console.error('Error in get-users:', error);
      res.status(500).json({ error: 'Failed to load user list.' });
    }
  });

  // 7. Products REST API
  app.use('/api/products', productRoutes);

  // 8. Inventory REST API
  app.use('/api/inventory', inventoryRoutes);

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
    console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
