import crypto from 'crypto';

// AES Encryption configuration
const ALGORITHM = 'aes-256-cbc';
const KEY_SIZE = 32; // 256 bits / 8 = 32 bytes
const IV_SIZE = 16; // 128 bits / 8 = 16 bytes

// Generate a random encryption key (32 bytes for AES-256)
export function generateEncryptionKey(): string {
  return crypto.randomBytes(KEY_SIZE).toString('hex'); // 64 hex characters
}

// Generate a random initialization vector (16 bytes)
function generateIV(): string {
  return crypto.randomBytes(IV_SIZE).toString('hex'); // 32 hex characters
}

// Encrypt file data using AES with Node.js crypto
export function encryptFileData(
  data: Uint8Array,
  key: string
): { encryptedData: Uint8Array; iv: string } {
  try {
    // Generate random IV
    const iv = generateIV();

    // Convert hex strings to Buffer
    const keyBuffer = Buffer.from(key, 'hex');
    const ivBuffer = Buffer.from(iv, 'hex');

    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, keyBuffer, ivBuffer);

    // Encrypt the data
    const encrypted = Buffer.concat([
      cipher.update(Buffer.from(data)),
      cipher.final(),
    ]);

    console.log(
      '[Encrypt] Original size:',
      data.length,
      'Encrypted size:',
      encrypted.length
    );

    return {
      encryptedData: new Uint8Array(encrypted),
      iv,
    };
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('File encryption failed');
  }
}

// Decrypt file data using AES with Node.js crypto
export function decryptFileData(
  encryptedData: Uint8Array,
  key: string,
  iv: string
): Uint8Array {
  try {
    // Convert hex strings to Buffer
    const keyBuffer = Buffer.from(key, 'hex');
    const ivBuffer = Buffer.from(iv, 'hex');

    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, keyBuffer, ivBuffer);

    // Decrypt the data
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encryptedData)),
      decipher.final(),
    ]);

    console.log('[Decrypt] Decrypted size:', decrypted.length);
    return new Uint8Array(decrypted);
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('File decryption failed');
  }
}

// Hash password for storage (keeping CryptoJS for this since it's just strings)
import CryptoJS from 'crypto-js';

export function hashPassword(password: string): string {
  return CryptoJS.SHA256(password).toString();
}

// Verify password against hash
export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

// Encrypt text data (for storing encryption keys)
export function encryptText(
  text: string,
  key: string
): { encryptedText: string; iv: string } {
  try {
    const iv = CryptoJS.lib.WordArray.random(IV_SIZE / 8).toString();

    const encrypted = CryptoJS.AES.encrypt(text, key, {
      iv: CryptoJS.enc.Hex.parse(iv),
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });

    return {
      encryptedText: encrypted.toString(),
      iv,
    };
  } catch (error) {
    console.error('Text encryption failed:', error);
    throw new Error('Text encryption failed');
  }
}

// Decrypt text data
export function decryptText(
  encryptedText: string,
  key: string,
  iv: string
): string {
  try {
    const decrypted = CryptoJS.AES.decrypt(encryptedText, key, {
      iv: CryptoJS.enc.Hex.parse(iv),
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });

    return decrypted.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('Text decryption failed:', error);
    throw new Error('Text decryption failed');
  }
}

// Generate secure random string
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}
