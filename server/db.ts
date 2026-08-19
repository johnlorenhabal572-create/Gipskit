import mongoose from 'mongoose';
import { User } from './models/User';

let isConnected = false;
let lastConnectionAttempt = 0;
let connectionFailed = false;
const RETRY_COOLDOWN_MS = 30000; // 30s cooldown after failed attempt to prevent connection thrashing

// In-memory fallback if MONGODB_URI is not configured or temporarily unreachable
export const memoryStore = {
  users: [
    {
      id: 'admin-1',
      name: 'Store Admin',
      email: (process.env.ADMIN_EMAIL || 'admin@store.com').toLowerCase(),
      password: process.env.ADMIN_PASSWORD || 'Admin123',
      role: 'admin',
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    }
  ],
  codes: new Map<string, { code: string; verified: boolean; expiresAt: number; createdAt: number }>(),
  products: [] as any[],
  inventory: [] as any[],
  inventoryLogs: [] as any[]
};

export async function connectMongoose(): Promise<{ isConnected: boolean; error?: string }> {
  const uri = process.env.MONGODB_URI?.trim();

  if (!uri || (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://'))) {
    return { isConnected: false, error: 'MONGODB_URI environment variable not provided' };
  }

  // ReadyState 1 means connected
  if (mongoose.connection.readyState === 1) {
    isConnected = true;
    return { isConnected: true };
  }

  // Prevent connection thrashing
  const now = Date.now();
  if (connectionFailed && now - lastConnectionAttempt < RETRY_COOLDOWN_MS) {
    return { isConnected: false, error: 'Connection in retry cooldown' };
  }

  lastConnectionAttempt = now;

  try {
    const dbName = uri.split('/').pop()?.split('?')[0] || 'ecommerce_db';

    await mongoose.connect(uri, {
      dbName: dbName.includes('?') ? 'ecommerce_db' : dbName,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
      socketTimeoutMS: 15000,
      family: 4, // IPv4 preference to avoid container IPv6 TLS handshake issues
      tls: uri.includes('mongodb+srv://') || uri.includes('ssl=true') || uri.includes('tls=true'),
      tlsAllowInvalidCertificates: true
    });

    isConnected = true;
    connectionFailed = false;
    console.log(`[Mongoose / MongoDB Atlas] Connected successfully to database: ${mongoose.connection.name}`);

    // Ensure default admin user exists in MongoDB Atlas via Mongoose
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@store.com').toLowerCase();
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (!existingAdmin) {
      await User.create({
        id: 'admin-1',
        name: 'Store Admin',
        email: adminEmail,
        password: process.env.ADMIN_PASSWORD || 'Admin123',
        role: 'admin',
        createdAt: new Date(),
        lastLogin: new Date()
      });
      console.log(`[Mongoose / MongoDB Atlas] Default admin account seeded: ${adminEmail}`);
    }

    return { isConnected: true };
  } catch (error) {
    connectionFailed = true;
    isConnected = false;
    const errMsg = (error as Error).message?.split('\n')[0];
    console.warn(`[Mongoose / MongoDB Atlas] Connection notice (${errMsg}). In-memory fallback available.`);
    return { isConnected: false, error: errMsg };
  }
}

// Utility to get current DB connection status
export async function getDbStatus(): Promise<{ isConnected: boolean; dbName?: string }> {
  const result = await connectMongoose();
  return {
    isConnected: result.isConnected && mongoose.connection.readyState === 1,
    dbName: mongoose.connection.name || undefined
  };
}

export { mongoose };
