const keyCache = new Map<string, CryptoKey>();

export const generateKey = async (password: string) => {
  if (keyCache.has(password)) return keyCache.get(password)!;

  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );
  
  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: enc.encode("nhanz-e2ee-salt-v1"), // TODO: Use per-conversation salt from DB
      iterations: 10000, // Reduced from 100000 for web performance
      hash: "SHA-256"
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );

  keyCache.set(password, key);
  return key;
};

export const encryptMessage = async (text: string, conversationId: string) => {
  try {
    const key = await generateKey(conversationId);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const enc = new TextEncoder();
    const ciphertext = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      enc.encode(text)
    );
    
    const packed = new Uint8Array(iv.length + ciphertext.byteLength);
    packed.set(iv, 0);
    packed.set(new Uint8Array(ciphertext), iv.length);
    
    // Prefix to identify encrypted messages
    return "E2EE::" + btoa(String.fromCharCode(...packed));
  } catch (e) {
      console.error("Encryption failed", e);
      return text;
  }
};

export const decryptMessage = async (cipherTextBase64: string, conversationId: string) => {
  if (!cipherTextBase64.startsWith("E2EE::")) return cipherTextBase64;
  
  try {
      const actualBase64 = cipherTextBase64.replace("E2EE::", "");
      const key = await generateKey(conversationId);
      const packedStr = atob(actualBase64);
      const packed = new Uint8Array(packedStr.length);
      for (let i = 0; i < packedStr.length; i++) {
          packed[i] = packedStr.charCodeAt(i);
      }
      
      const iv = packed.slice(0, 12);
      const ciphertext = packed.slice(12);
      
      const decrypted = await crypto.subtle.decrypt(
          { name: "AES-GCM", iv },
          key,
          ciphertext
      );
      const dec = new TextDecoder();
      return dec.decode(decrypted);
  } catch(e) {
      console.error("Decryption failed", e);
      return cipherTextBase64; // Return original if decryption fails
  }
};
