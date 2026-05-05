// src/lib/encryption.ts

// The key must be a 32-byte (256-bit) base64 string provided via env
const getEncryptionKey = async (): Promise<CryptoKey> => {
  const envKey = import.meta.env.VITE_ENCRYPTION_KEY || 'U29tZVNlY3VyZUtleVRoYXRJczMyQnl0ZXNMb25nISE='; 
  const keyBytes = Uint8Array.from(atob(envKey), c => c.charCodeAt(0));
  
  return await window.crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
};

export const encryptData = async (text: string): Promise<string> => {
  try {
    const key = await getEncryptionKey();
    const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for AES-GCM
    const encodedText = new TextEncoder().encode(text);

    const encryptedContent = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encodedText
    );

    // Combine IV and encrypted content
    const encryptedBytes = new Uint8Array(encryptedContent);
    const combined = new Uint8Array(iv.length + encryptedBytes.length);
    combined.set(iv);
    combined.set(encryptedBytes, iv.length);

    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.error('Encryption failed', error);
    return text; // Fallback or handle error appropriately in production
  }
};

export const decryptData = async (encryptedBase64: string): Promise<string> => {
  try {
    const key = await getEncryptionKey();
    const combined = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));
    
    const iv = combined.slice(0, 12);
    const encryptedBytes = combined.slice(12);

    const decryptedContent = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encryptedBytes
    );

    return new TextDecoder().decode(decryptedContent);
  } catch (error) {
    console.error('Decryption failed', error);
    return encryptedBase64; // Return original if decryption fails (e.g. legacy unencrypted data)
  }
};
