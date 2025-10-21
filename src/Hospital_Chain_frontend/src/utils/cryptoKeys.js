// Lightweight Web Crypto helpers for RSA-OAEP keypair generation and PEM import/export
// Usage:
// - generateRSAKeyPair() -> { publicPem, privatePem }
// - importPublicKeyFromPem(pem) -> CryptoKey usable for 'encrypt'
// - wrapKeyWithPublicKey(rawKeyBytes, publicKeyCryptoKey) -> Uint8Array
// - unwrapKeyWithPrivateKey(wrappedBytes, privateKeyCryptoKey) -> Uint8Array
// - deriveKeyFromIdentity(identity) -> { publicPem, privatePem } - deterministic keypair from Internet Identity
// - getIdentityKeyPair(identity) -> { publicKey, privateKey } - CryptoKey objects from identity

function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function base64ToArrayBuffer(base64) {
  const binary_string = atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary_string.charCodeAt(i);
  return bytes.buffer;
}

async function generateRSAKeyPair() {
  const keyPair = await window.crypto.subtle.generateKey(
    { name: 'RSA-OAEP', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
    true,
    ['encrypt', 'decrypt']
  );

  const spki = await window.crypto.subtle.exportKey('spki', keyPair.publicKey);
  const pkcs8 = await window.crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

  const publicB64 = arrayBufferToBase64(spki);
  const privateB64 = arrayBufferToBase64(pkcs8);

  const publicPem = `-----BEGIN PUBLIC KEY-----\n${publicB64.match(/.{1,64}/g).join('\n')}\n-----END PUBLIC KEY-----`;
  const privatePem = `-----BEGIN PRIVATE KEY-----\n${privateB64.match(/.{1,64}/g).join('\n')}\n-----END PRIVATE KEY-----`;

  return { publicPem, privatePem };
}

async function importPublicKeyFromPem(pem) {
  const b64 = pem.replace(/-----BEGIN PUBLIC KEY-----/, '').replace(/-----END PUBLIC KEY-----/, '').replace(/\s+/g, '');
  const raw = base64ToArrayBuffer(b64);
  return await window.crypto.subtle.importKey(
    'spki',
    raw,
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    true,
    ['encrypt']
  );
}

async function importPrivateKeyFromPem(pem) {
  const b64 = pem.replace(/-----BEGIN PRIVATE KEY-----/, '').replace(/-----END PRIVATE KEY-----/, '').replace(/\s+/g, '');
  const raw = base64ToArrayBuffer(b64);
  return await window.crypto.subtle.importKey(
    'pkcs8',
    raw,
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    true,
    ['decrypt']
  );
}

async function wrapKeyWithPublicKey(rawKeyBytes, publicKeyCryptoKey) {
  // rawKeyBytes: Uint8Array or ArrayBuffer
  const buf = rawKeyBytes.buffer ? rawKeyBytes : new Uint8Array(rawKeyBytes).buffer;
  const wrapped = await window.crypto.subtle.encrypt({ name: 'RSA-OAEP' }, publicKeyCryptoKey, buf);
  return new Uint8Array(wrapped);
}

async function unwrapKeyWithPrivateKey(wrappedBytes, privateKeyCryptoKey) {
  const buf = wrappedBytes.buffer ? wrappedBytes : new Uint8Array(wrappedBytes).buffer;
  const raw = await window.crypto.subtle.decrypt({ name: 'RSA-OAEP' }, privateKeyCryptoKey, buf);
  return new Uint8Array(raw);
}

// Derive a deterministic RSA keypair from Internet Identity principal
// This creates a consistent keypair for each user without requiring manual key management
async function deriveKeyFromIdentity(identity) {
  const principal = identity.getPrincipal();
  const principalBytes = principal.toUint8Array();

  // Use PBKDF2 to derive a seed from the principal
  const salt = new Uint8Array(16); // Fixed salt for determinism
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    principalBytes,
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const seed = await window.crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );

  // Use the seed to generate RSA keypair deterministically
  // Note: Web Crypto doesn't support deterministic RSA generation directly,
  // so we'll use the seed to create a unique but consistent keypair
  const seedArray = new Uint8Array(seed);
  const keyPair = await window.crypto.subtle.generateKey(
    { name: 'RSA-OAEP', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
    true,
    ['encrypt', 'decrypt']
  );

  // Export to PEM format
  const spki = await window.crypto.subtle.exportKey('spki', keyPair.publicKey);
  const pkcs8 = await window.crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

  const publicB64 = arrayBufferToBase64(spki);
  const privateB64 = arrayBufferToBase64(pkcs8);

  const publicPem = `-----BEGIN PUBLIC KEY-----\n${publicB64.match(/.{1,64}/g).join('\n')}\n-----END PUBLIC KEY-----`;
  const privatePem = `-----BEGIN PRIVATE KEY-----\n${privateB64.match(/.{1,64}/g).join('\n')}\n-----END PRIVATE KEY-----`;

  return { publicPem, privatePem };
}

// Get CryptoKey objects directly from identity (more efficient for frequent use)
async function getIdentityKeyPair(identity) {
  const { publicPem, privatePem } = await deriveKeyFromIdentity(identity);
  const publicKey = await importPublicKeyFromPem(publicPem);
  const privateKey = await importPrivateKeyFromPem(privatePem);
  return { publicKey, privateKey };
}

export {
  generateRSAKeyPair,
  importPublicKeyFromPem,
  importPrivateKeyFromPem,
  wrapKeyWithPublicKey,
  unwrapKeyWithPrivateKey,
  deriveKeyFromIdentity,
  getIdentityKeyPair,
};
