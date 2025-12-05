/**
 * Cryptographic utilities for MyJDownloader API
 * 
 * The API uses AES-128-CBC encryption and HMAC-SHA256 for signatures
 */

import CryptoJS from 'crypto-js';
import crypto from 'crypto';

/**
 * Create login secret from email and password
 * loginSecret = SHA256(toLowerCaseEmail + password + "server")
 */
export function createLoginSecret(email: string, password: string): Buffer {
  const data = email.toLowerCase() + password + 'server';
  const hash = CryptoJS.SHA256(data);
  return Buffer.from(hash.toString(CryptoJS.enc.Hex), 'hex');
}

/**
 * Create device secret from email and password
 * deviceSecret = SHA256(toLowerCaseEmail + password + "device")
 */
export function createDeviceSecret(email: string, password: string): Buffer {
  const data = email.toLowerCase() + password + 'device';
  const hash = CryptoJS.SHA256(data);
  return Buffer.from(hash.toString(CryptoJS.enc.Hex), 'hex');
}

/**
 * Update encryption token by combining current token with server response
 * newToken = SHA256(currentToken + hexToBytes(serverResponseToken))
 */
export function updateEncryptionToken(currentToken: Buffer, serverToken: string): Buffer {
  const serverTokenBytes = Buffer.from(serverToken, 'hex');
  const combined = Buffer.concat([currentToken, serverTokenBytes]);
  const hash = CryptoJS.SHA256(CryptoJS.lib.WordArray.create(combined as unknown as number[]));
  return Buffer.from(hash.toString(CryptoJS.enc.Hex), 'hex');
}

/**
 * Encrypt data using AES-128-CBC (using Node.js crypto)
 * According to MyJDownloader API: IV = first 16 bytes, Key = last 16 bytes
 */
export function encrypt(data: string, token: Buffer): string {
  // IMPORTANT: IV is first half, Key is second half
  const iv = token.subarray(0, 16);
  const key = token.subarray(16, 32);
  
  const cipher = crypto.createCipheriv('aes-128-cbc', key, iv);
  
  let encrypted = cipher.update(data, 'utf8');
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  
  return encrypted.toString('base64');
}

/**
 * Decrypt data using AES-128-CBC (using Node.js crypto)
 * According to MyJDownloader API: IV = first 16 bytes, Key = last 16 bytes
 */
export function decrypt(encryptedData: string, token: Buffer): string {
  try {
    // IMPORTANT: IV is first half, Key is second half (opposite of what you might expect!)
    const iv = token.subarray(0, 16);
    const key = token.subarray(16, 32);
    
    const encryptedBuffer = Buffer.from(encryptedData, 'base64');
    
    const decipher = crypto.createDecipheriv('aes-128-cbc', key, iv);
    
    let decrypted = decipher.update(encryptedBuffer);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return decrypted.toString('utf8');
  } catch (error) {
    console.error('Decrypt error:', error);
    throw error;
  }
}

/**
 * Create HMAC-SHA256 signature for a query string
 */
export function createSignature(query: string, token: Buffer): string {
  const hmac = CryptoJS.HmacSHA256(
    query,
    CryptoJS.lib.WordArray.create(token as unknown as number[])
  );
  return hmac.toString(CryptoJS.enc.Hex);
}

/**
 * Generate a unique request ID (must increase with each call)
 * Using millisecond timestamp ensures uniqueness
 */
export function generateRequestId(): number {
  return Date.now();
}




