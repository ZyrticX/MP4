/**
 * Cryptographic utilities for MyJDownloader API
 * 
 * The API uses AES-128-CBC encryption and HMAC-SHA256 for signatures
 * 
 * IMPORTANT: According to MyJDownloader spec:
 * - IV = first 16 bytes of token
 * - Key = last 16 bytes of token
 */

import crypto from 'crypto';

/**
 * Create login secret from email and password
 * loginSecret = SHA256(toLowerCaseEmail + password + "server")
 */
export function createLoginSecret(email: string, password: string): Buffer {
  const data = email.toLowerCase() + password + 'server';
  return crypto.createHash('sha256').update(data, 'utf8').digest();
}

/**
 * Create device secret from email and password
 * deviceSecret = SHA256(toLowerCaseEmail + password + "device")
 */
export function createDeviceSecret(email: string, password: string): Buffer {
  const data = email.toLowerCase() + password + 'device';
  return crypto.createHash('sha256').update(data, 'utf8').digest();
}

/**
 * Update encryption token by combining current token with server response
 * newToken = SHA256(currentToken + hexToBytes(serverResponseToken))
 */
export function updateEncryptionToken(currentToken: Buffer, serverToken: string): Buffer {
  console.log('updateEncryptionToken - serverToken (string):', serverToken);
  console.log('updateEncryptionToken - serverToken length:', serverToken.length);
  
  const serverTokenBytes = Buffer.from(serverToken, 'hex');
  console.log('updateEncryptionToken - serverTokenBytes length:', serverTokenBytes.length);
  console.log('updateEncryptionToken - serverTokenBytes (hex):', serverTokenBytes.toString('hex'));
  
  const combined = Buffer.concat([currentToken, serverTokenBytes]);
  console.log('updateEncryptionToken - combined length:', combined.length);
  
  const result = crypto.createHash('sha256').update(combined).digest();
  console.log('updateEncryptionToken - result (hex):', result.toString('hex'));
  
  return result;
}

/**
 * Encrypt data using AES-128-CBC
 * IV = first 16 bytes, Key = last 16 bytes
 */
export function encrypt(data: string, token: Buffer): string {
  const iv = token.subarray(0, 16);
  const key = token.subarray(16, 32);
  
  const cipher = crypto.createCipheriv('aes-128-cbc', key, iv);
  
  let encrypted = cipher.update(data, 'utf8');
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  
  return encrypted.toString('base64');
}

/**
 * Decrypt data using AES-128-CBC
 * IV = first 16 bytes, Key = last 16 bytes
 */
export function decrypt(encryptedData: string, token: Buffer): string {
  const iv = token.subarray(0, 16);
  const key = token.subarray(16, 32);
  
  const encryptedBuffer = Buffer.from(encryptedData, 'base64');
  
  const decipher = crypto.createDecipheriv('aes-128-cbc', key, iv);
  
  let decrypted = decipher.update(encryptedBuffer);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  
  return decrypted.toString('utf8');
}

/**
 * Create HMAC-SHA256 signature for a query string
 */
export function createSignature(query: string, token: Buffer): string {
  console.log('createSignature - query:', query);
  console.log('createSignature - token (hex):', token.toString('hex'));
  
  const signature = crypto.createHmac('sha256', token).update(query, 'utf8').digest('hex');
  console.log('createSignature - signature:', signature);
  
  return signature;
}

/**
 * Generate a unique request ID (must increase with each call)
 * Using millisecond timestamp ensures uniqueness
 */
export function generateRequestId(): number {
  return Date.now();
}
