/**
 * Encryption utilities for securely storing OAuth tokens
 * Uses AES-256-CBC encryption
 */

const ALGORITHM = 'AES-CBC';
const KEY_LENGTH = 256;
const IV_LENGTH = 16; // 16 bytes for AES

/**
 * Convert hex string to Uint8Array
 */
function hexToUint8Array(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

/**
 * Convert Uint8Array to hex string
 */
function uint8ArrayToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Get encryption key from environment
 */
async function getEncryptionKey(): Promise<CryptoKey> {
  const encryptionKey = Deno.env.get('ENCRYPTION_KEY');
  if (!encryptionKey) {
    throw new Error('ENCRYPTION_KEY environment variable is not set');
  }

  // Convert hex key to raw bytes
  const keyData = hexToUint8Array(encryptionKey);

  // Import the key for AES-CBC
  return await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt a string value
 * Returns: IV (16 bytes) + ciphertext as hex string
 */
export async function encrypt(plaintext: string): Promise<string> {
  const key = await getEncryptionKey();

  // Generate random IV
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  // Encode plaintext
  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);

  // Encrypt
  const ciphertext = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    data
  );

  // Combine IV + ciphertext
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.length);

  // Convert to hex
  return uint8ArrayToHex(combined);
}

/**
 * Decrypt an encrypted string
 * Input format: IV (16 bytes) + ciphertext as hex string
 */
export async function decrypt(encryptedHex: string): Promise<string> {
  const key = await getEncryptionKey();

  // Convert hex to bytes
  const combined = hexToUint8Array(encryptedHex);

  // Extract IV and ciphertext
  const iv = combined.slice(0, IV_LENGTH);
  const ciphertext = combined.slice(IV_LENGTH);

  // Decrypt
  const decrypted = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv },
    key,
    ciphertext
  );

  // Decode to string
  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}
