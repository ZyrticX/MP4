/**
 * Cryptographic utilities for MyJDownloader API
 * 
 * The API uses AES-128-CBC encryption and HMAC-SHA256 for signatures
 */

import CryptoJS from 'crypto-js';

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
 * Encrypt data using AES-128-CBC
 * Key is first 16 bytes of token, IV is last 16 bytes
 */
export function encrypt(data: string, token: Buffer): string {
  const key = CryptoJS.lib.WordArray.create(token.subarray(0, 16) as unknown as number[]);
  const iv = CryptoJS.lib.WordArray.create(token.subarray(16, 32) as unknown as number[]);
  
  const encrypted = CryptoJS.AES.encrypt(data, key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  });
  
  return encrypted.ciphertext.toString(CryptoJS.enc.Base64);
}

/**
 * Decrypt data using AES-128-CBC
 */
export function decrypt(encryptedData: string, token: Buffer): string {
  const key = CryptoJS.lib.WordArray.create(token.subarray(0, 16) as unknown as number[]);
  const iv = CryptoJS.lib.WordArray.create(token.subarray(16, 32) as unknown as number[]);
  
  const decrypted = CryptoJS.AES.decrypt(encryptedData, key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  });
  
  return decrypted.toString(CryptoJS.enc.Utf8);
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




