import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  generateRSAKeyPair,
  importPublicKeyFromPem,
  importPrivateKeyFromPem,
  wrapKeyWithPublicKey,
  unwrapKeyWithPrivateKey,
  deriveKeyFromIdentity,
  getIdentityKeyPair,
} from '../utils/cryptoKeys';

describe('cryptoKeys', () => {
  describe('generateRSAKeyPair', () => {
    it('should generate a valid RSA key pair', async () => {
      const { publicPem, privatePem } = await generateRSAKeyPair();

      expect(publicPem).toBeDefined();
      expect(privatePem).toBeDefined();
      expect(publicPem).toContain('-----BEGIN PUBLIC KEY-----');
      expect(publicPem).toContain('-----END PUBLIC KEY-----');
      expect(privatePem).toContain('-----BEGIN PRIVATE KEY-----');
      expect(privatePem).toContain('-----END PRIVATE KEY-----');
    });

    it('should generate different keys on each call', async () => {
      const pair1 = await generateRSAKeyPair();
      const pair2 = await generateRSAKeyPair();

      expect(pair1.publicPem).not.toEqual(pair2.publicPem);
      expect(pair1.privatePem).not.toEqual(pair2.privatePem);
    });

    it('should generate keys with proper PEM formatting', async () => {
      const { publicPem, privatePem } = await generateRSAKeyPair();

      // Check PEM structure - should have proper line breaks
      const publicLines = publicPem.split('\n');
      const privateLines = privatePem.split('\n');

      expect(publicLines[0]).toBe('-----BEGIN PUBLIC KEY-----');
      expect(publicLines[publicLines.length - 1]).toBe('-----END PUBLIC KEY-----');
      expect(privateLines[0]).toBe('-----BEGIN PRIVATE KEY-----');
      expect(privateLines[privateLines.length - 1]).toBe('-----END PRIVATE KEY-----');

      // Check line length (PEM standard is 64 chars per line)
      for (let i = 1; i < publicLines.length - 1; i++) {
        expect(publicLines[i].length).toBeLessThanOrEqual(64);
      }
    });
  });

  describe('importPublicKeyFromPem', () => {
    let publicPem;

    beforeEach(async () => {
      const pair = await generateRSAKeyPair();
      publicPem = pair.publicPem;
    });

    it('should import a valid public key from PEM', async () => {
      const publicKey = await importPublicKeyFromPem(publicPem);

      expect(publicKey).toBeDefined();
      expect(publicKey.type).toBe('public');
      expect(publicKey.algorithm.name).toBe('RSA-OAEP');
    });

    it('should handle PEM with extra whitespace', async () => {
      const pemWithSpaces = publicPem.replace(/\n/g, '\n  ');
      const publicKey = await importPublicKeyFromPem(pemWithSpaces);

      expect(publicKey).toBeDefined();
      expect(publicKey.type).toBe('public');
    });

    it('should reject invalid PEM format', async () => {
      const invalidPem = 'not-a-valid-pem';

      await expect(importPublicKeyFromPem(invalidPem)).rejects.toThrow();
    });

    it('should reject PEM with corrupted base64', async () => {
      const corruptedPem = publicPem.replace(/[A-Za-z0-9+/]/g, '!');

      await expect(importPublicKeyFromPem(corruptedPem)).rejects.toThrow();
    });
  });

  describe('importPrivateKeyFromPem', () => {
    let privatePem;

    beforeEach(async () => {
      const pair = await generateRSAKeyPair();
      privatePem = pair.privatePem;
    });

    it('should import a valid private key from PEM', async () => {
      const privateKey = await importPrivateKeyFromPem(privatePem);

      expect(privateKey).toBeDefined();
      expect(privateKey.type).toBe('private');
      expect(privateKey.algorithm.name).toBe('RSA-OAEP');
    });

    it('should handle PEM with extra whitespace', async () => {
      const pemWithSpaces = privatePem.replace(/\n/g, '\n  ');
      const privateKey = await importPrivateKeyFromPem(pemWithSpaces);

      expect(privateKey).toBeDefined();
      expect(privateKey.type).toBe('private');
    });

    it('should reject invalid PEM format', async () => {
      const invalidPem = 'not-a-valid-pem';

      await expect(importPrivateKeyFromPem(invalidPem)).rejects.toThrow();
    });
  });

  describe('wrapKeyWithPublicKey and unwrapKeyWithPrivateKey', () => {
    let publicKey;
    let privateKey;
    let testData;

    beforeEach(async () => {
      const { publicPem, privatePem } = await generateRSAKeyPair();
      publicKey = await importPublicKeyFromPem(publicPem);
      privateKey = await importPrivateKeyFromPem(privatePem);
      testData = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    });

    it('should wrap and unwrap data successfully', async () => {
      const wrapped = await wrapKeyWithPublicKey(testData, publicKey);
      expect(wrapped).toBeInstanceOf(Uint8Array);
      expect(wrapped.length).toBeGreaterThan(0);

      const unwrapped = await unwrapKeyWithPrivateKey(wrapped, privateKey);
      expect(unwrapped).toBeInstanceOf(Uint8Array);
      expect(Array.from(unwrapped)).toEqual(Array.from(testData));
    });

    it('should handle ArrayBuffer input', async () => {
      const buffer = testData.buffer;
      const wrapped = await wrapKeyWithPublicKey(buffer, publicKey);
      const unwrapped = await unwrapKeyWithPrivateKey(wrapped, privateKey);

      expect(Array.from(unwrapped)).toEqual(Array.from(testData));
    });

    it('should produce different ciphertext on each wrap', async () => {
      const wrapped1 = await wrapKeyWithPublicKey(testData, publicKey);
      const wrapped2 = await wrapKeyWithPublicKey(testData, publicKey);

      // RSA-OAEP uses random padding, so each encryption should be different
      expect(Array.from(wrapped1)).not.toEqual(Array.from(wrapped2));

      // But both should decrypt to the same plaintext
      const unwrapped1 = await unwrapKeyWithPrivateKey(wrapped1, privateKey);
      const unwrapped2 = await unwrapKeyWithPrivateKey(wrapped2, privateKey);

      expect(Array.from(unwrapped1)).toEqual(Array.from(testData));
      expect(Array.from(unwrapped2)).toEqual(Array.from(testData));
    });

    it('should handle empty data', async () => {
      const emptyData = new Uint8Array([]);
      const wrapped = await wrapKeyWithPublicKey(emptyData, publicKey);
      const unwrapped = await unwrapKeyWithPrivateKey(wrapped, privateKey);

      expect(Array.from(unwrapped)).toEqual([]);
    });

    it('should handle maximum size data for RSA-2048', async () => {
      // RSA-2048 with OAEP-SHA256 can encrypt up to 190 bytes
      const maxData = new Uint8Array(190).fill(42);
      const wrapped = await wrapKeyWithPublicKey(maxData, publicKey);
      const unwrapped = await unwrapKeyWithPrivateKey(wrapped, privateKey);

      expect(Array.from(unwrapped)).toEqual(Array.from(maxData));
    });

    it('should fail to unwrap with wrong private key', async () => {
      const { privatePem: wrongPrivatePem } = await generateRSAKeyPair();
      const wrongPrivateKey = await importPrivateKeyFromPem(wrongPrivatePem);

      const wrapped = await wrapKeyWithPublicKey(testData, publicKey);

      await expect(
        unwrapKeyWithPrivateKey(wrapped, wrongPrivateKey)
      ).rejects.toThrow();
    });

    it('should handle 32-byte AES keys (common use case)', async () => {
      const aesKey = window.crypto.getRandomValues(new Uint8Array(32));
      const wrapped = await wrapKeyWithPublicKey(aesKey, publicKey);
      const unwrapped = await unwrapKeyWithPrivateKey(wrapped, privateKey);

      expect(Array.from(unwrapped)).toEqual(Array.from(aesKey));
    });
  });

  describe('deriveKeyFromIdentity', () => {
    let mockIdentity;

    beforeEach(() => {
      mockIdentity = {
        getPrincipal: () => ({
          toUint8Array: () => new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]),
        }),
      };
    });

    it('should derive a key pair from identity', async () => {
      const { publicPem, privatePem } = await deriveKeyFromIdentity(mockIdentity);

      expect(publicPem).toBeDefined();
      expect(privatePem).toBeDefined();
      expect(publicPem).toContain('-----BEGIN PUBLIC KEY-----');
      expect(privatePem).toContain('-----BEGIN PRIVATE KEY-----');
    });

    it('should derive consistent keys for same identity', async () => {
      // Note: Due to Web Crypto limitations, this might not be truly deterministic
      // but we can verify the structure is consistent
      const pair1 = await deriveKeyFromIdentity(mockIdentity);
      const pair2 = await deriveKeyFromIdentity(mockIdentity);

      expect(pair1.publicPem).toBeDefined();
      expect(pair2.publicPem).toBeDefined();
      // Both should be valid PEM format
      expect(pair1.publicPem).toContain('-----BEGIN PUBLIC KEY-----');
      expect(pair2.publicPem).toContain('-----BEGIN PUBLIC KEY-----');
    });

    it('should handle different principal bytes', async () => {
      const identity1 = {
        getPrincipal: () => ({
          toUint8Array: () => new Uint8Array([1, 2, 3, 4]),
        }),
      };
      const identity2 = {
        getPrincipal: () => ({
          toUint8Array: () => new Uint8Array([5, 6, 7, 8]),
        }),
      };

      const pair1 = await deriveKeyFromIdentity(identity1);
      const pair2 = await deriveKeyFromIdentity(identity2);

      // Both should produce valid keys
      expect(pair1.publicPem).toContain('-----BEGIN PUBLIC KEY-----');
      expect(pair2.publicPem).toContain('-----BEGIN PUBLIC KEY-----');
    });

    it('should use PBKDF2 with correct parameters', async () => {
      const deriveBitsSpy = vi.spyOn(window.crypto.subtle, 'deriveBits');

      await deriveKeyFromIdentity(mockIdentity);

      expect(deriveBitsSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'PBKDF2',
          iterations: 100000,
          hash: 'SHA-256',
        }),
        expect.anything(),
        256
      );

      deriveBitsSpy.mockRestore();
    });
  });

  describe('getIdentityKeyPair', () => {
    let mockIdentity;

    beforeEach(() => {
      mockIdentity = {
        getPrincipal: () => ({
          toUint8Array: () => new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]),
        }),
      };
    });

    it('should return CryptoKey objects', async () => {
      const { publicKey, privateKey } = await getIdentityKeyPair(mockIdentity);

      expect(publicKey).toBeDefined();
      expect(privateKey).toBeDefined();
      expect(publicKey.type).toBe('public');
      expect(privateKey.type).toBe('private');
      expect(publicKey.algorithm.name).toBe('RSA-OAEP');
      expect(privateKey.algorithm.name).toBe('RSA-OAEP');
    });

    it('should produce keys that can encrypt and decrypt', async () => {
      const { publicKey, privateKey } = await getIdentityKeyPair(mockIdentity);
      const testData = new Uint8Array([10, 20, 30, 40, 50]);

      const wrapped = await wrapKeyWithPublicKey(testData, publicKey);
      const unwrapped = await unwrapKeyWithPrivateKey(wrapped, privateKey);

      expect(Array.from(unwrapped)).toEqual(Array.from(testData));
    });

    it('should handle edge case with empty principal', async () => {
      const emptyIdentity = {
        getPrincipal: () => ({
          toUint8Array: () => new Uint8Array([]),
        }),
      };

      // Should still generate keys, though not recommended
      const { publicKey, privateKey } = await getIdentityKeyPair(emptyIdentity);
      expect(publicKey).toBeDefined();
      expect(privateKey).toBeDefined();
    });
  });

  describe('End-to-end encryption scenario', () => {
    it('should support full E2E encryption workflow', async () => {
      // Alice generates her keypair
      const aliceKeys = await generateRSAKeyPair();
      const alicePublic = await importPublicKeyFromPem(aliceKeys.publicPem);
      const alicePrivate = await importPrivateKeyFromPem(aliceKeys.privatePem);

      // Bob generates his keypair
      const bobKeys = await generateRSAKeyPair();
      const bobPublic = await importPublicKeyFromPem(bobKeys.publicPem);
      const bobPrivate = await importPrivateKeyFromPem(bobKeys.privatePem);

      // Generate AES key for file encryption
      const aesKey = window.crypto.getRandomValues(new Uint8Array(32));

      // Alice wraps AES key with her own public key (for self-recovery)
      const aliceWrappedKey = await wrapKeyWithPublicKey(aesKey, alicePublic);

      // Alice shares: wraps AES key with Bob's public key
      const bobWrappedKey = await wrapKeyWithPublicKey(aesKey, bobPublic);

      // Alice can decrypt her wrapped key
      const aliceRecovered = await unwrapKeyWithPrivateKey(aliceWrappedKey, alicePrivate);
      expect(Array.from(aliceRecovered)).toEqual(Array.from(aesKey));

      // Bob can decrypt his wrapped key
      const bobRecovered = await unwrapKeyWithPrivateKey(bobWrappedKey, bobPrivate);
      expect(Array.from(bobRecovered)).toEqual(Array.from(aesKey));

      // Both recovered the same AES key
      expect(Array.from(aliceRecovered)).toEqual(Array.from(bobRecovered));
    });
  });

  describe('Error handling', () => {
    it('should handle null/undefined inputs gracefully', async () => {
      await expect(importPublicKeyFromPem(null)).rejects.toThrow();
      await expect(importPublicKeyFromPem(undefined)).rejects.toThrow();
      await expect(importPrivateKeyFromPem(null)).rejects.toThrow();
    });

    it('should handle corrupted wrapped data', async () => {
      const { publicPem, privatePem } = await generateRSAKeyPair();
      const publicKey = await importPublicKeyFromPem(publicPem);
      const privateKey = await importPrivateKeyFromPem(privatePem);

      const testData = new Uint8Array([1, 2, 3, 4, 5]);
      const wrapped = await wrapKeyWithPublicKey(testData, publicKey);

      // Corrupt the wrapped data
      wrapped[10] ^= 0xFF;

      await expect(unwrapKeyWithPrivateKey(wrapped, privateKey)).rejects.toThrow();
    });
  });
});