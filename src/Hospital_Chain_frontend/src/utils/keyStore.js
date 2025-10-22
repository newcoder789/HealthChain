// Secure key storage using IndexedDB + WebCrypto
// - wrapKey(rawPrivateKeyBytes, passphrase) -> ciphertext stored in IndexedDB
// - unwrapKey(passphrase) -> rawPrivateKeyBytes

const DB_NAME = 'hc-keystore';
const STORE_NAME = 'private_keys';
const DB_VERSION = 1;

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function deriveKeyFromPassphrase(passphrase, salt) {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey('raw', enc.encode(passphrase), { name: 'PBKDF2' }, false, ['deriveKey']);
  return await window.crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 200_000, hash: 'SHA-256' }, keyMaterial, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}

export async function storePrivateKey(id, pemString, passphrase) {
  const db = await openDB();
  // Convert PEM string to Uint8Array
  const enc = new TextEncoder();
  const data = enc.encode(pemString);
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const aesKey = await deriveKeyFromPassphrase(passphrase, salt);
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await window.crypto.subtle.encrypt({ name: 'AES-GCM', iv }, aesKey, data);
  const record = { id, salt: Array.from(salt), iv: Array.from(iv), ciphertext: Array.from(new Uint8Array(ciphertext)) };
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(record);
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  });
}

export async function getPrivateKey(id, passphrase) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(id);
    req.onsuccess = async () => {
      const rec = req.result;
      if (!rec) return resolve(null);
      try {
        const salt = new Uint8Array(rec.salt);
        const iv = new Uint8Array(rec.iv);
        const ciphertext = new Uint8Array(rec.ciphertext).buffer;
        const aesKey = await deriveKeyFromPassphrase(passphrase, salt);
        const plain = await window.crypto.subtle.decrypt({ name: 'AES-GCM', iv }, aesKey, ciphertext);
        const dec = new TextDecoder();
        resolve(dec.decode(plain));
      } catch (e) {
        reject(e);
      }
    };
    req.onerror = () => reject(req.error);
  });
}

export async function deletePrivateKey(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(id);
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  });
}
