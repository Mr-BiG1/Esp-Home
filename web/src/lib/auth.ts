import { cookies } from 'next/headers';

const DEFAULT_ADMIN_PASSPHRASE = process.env.ADMIN_PASSPHRASE || 'Admin@SmartHome2026!';
const SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || 'smart-home-admin-super-secret-2026-key-v1';
export const ADMIN_COOKIE_NAME = 'admin_session';

/**
 * Validates the user-entered passphrase against configured admin passphrase.
 */
export function verifyAdminPassphrase(passphrase: string): boolean {
  if (!passphrase) return false;
  return passphrase.trim() === DEFAULT_ADMIN_PASSPHRASE.trim();
}

/**
 * Creates a signed session token: timestamp.signature
 */
export async function createSessionToken(): Promise<string> {
  const timestamp = Date.now().toString();
  const signature = await generateHmac(timestamp, SESSION_SECRET);
  return `${timestamp}.${signature}`;
}

/**
 * Verifies a session token string.
 */
export async function verifySessionToken(token: string | null | undefined): Promise<boolean> {
  if (!token) return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;

  const [timestampStr, signature] = parts;
  const timestamp = parseInt(timestampStr, 10);
  if (isNaN(timestamp)) return false;

  // Check 7-day expiration
  const maxAgeMs = 7 * 24 * 60 * 60 * 1000;
  if (Date.now() - timestamp > maxAgeMs) return false;

  const expectedSignature = await generateHmac(timestampStr, SESSION_SECRET);
  return signature === expectedSignature;
}

/**
 * Helper to compute HMAC SHA-256 using standard Web Crypto API (Middleware compatible)
 */
async function generateHmac(data: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(data));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Helper to check current admin session from Next.js cookies (Server Components / API Routes)
 */
export async function isAuthorizedAdmin(): Promise<boolean> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
    return await verifySessionToken(token);
  } catch (err) {
    return false;
  }
}

/**
 * Helper returning the authenticated admin user profile
 */
export function getCurrentUser(req?: Request) {
  return {
    id: 'admin_sys_01',
    userId: 'admin_sys_01',
    name: 'Master Admin',
    role: 'ADMIN',
  };
}

/**
 * Helper checking RBAC permissions
 */
export function hasPermission(role?: string, permission?: string): boolean {
  if (!role) return false;
  return role === 'ADMIN' || role === 'SUPERADMIN' || permission === 'VIEWER';
}

