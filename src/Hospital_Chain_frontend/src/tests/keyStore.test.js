import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { storePrivateKey, getPrivateKey, deletePrivateKey } from '../utils/keyStore';

// Mock IndexedDB for testing
class MockIDBDatabase {
  constructor() {
    this.objectStoreNames = { contains: () => false };
    this.stores = {};
  }

  createObjectStore(name, options) {
    this.stores[name] = {};
    return {
      data: this.stores[name],
    };
  }

  transaction(storeName, mode) {
    return new MockIDBTransaction(this.stores[storeName]);
  }
}

class MockIDBTransaction {
  constructor(store) {
    this.store = store;
  }

  objectStore() {
    return new MockIDBObjectStore(this.store);
  }
}

class MockIDBObjectStore {
  constructor(store) {
    this.store = store;
  }

  put(record) {
    this.store[record.id] = record;
    return {
      onsuccess: null,
      onerror: null,
      result: record,
    };
  }

  get(id) {
    const result = this.store[id];
    return {
      onsuccess: null,
      onerror: null,
      result,
    };
  }

  delete(id) {
    delete this.store[id];
    return {
      onsuccess: null,
      onerror: null,
    };
  }
}

describe('keyStore', () => {
  let mockDB;
  let originalIndexedDB;

  beforeEach(() => {
    mockDB = new MockIDBDatabase();
    originalIndexedDB = global.indexedDB;

    // Mock indexedDB.open
    global.indexedDB = {
      open: (name, version) => {
        const request = {
          onupgradeneeded: null,
          onsuccess: null,
          onerror: null,
          result: mockDB,
        };

        // Simulate async opening
        setTimeout(() => {
          if (request.onupgradeneeded) {
            request.result = mockDB;
            request.onupgradeneeded();
          }
          if (request.onsuccess) {
            request.result = mockDB;
            request.onsuccess();
          }
        }, 0);

        return request;
      },
    };
  });

  afterEach(() => {
    global.indexedDB = originalIndexedDB;
  });

  describe('storePrivateKey', () => {
    it('should store a private key with encryption', async () => {
      const id = 'test-key-1';
      const pemString = 'test-key-placeholder-1';
      const passphrase = 'secure-passphrase-123';

      const result = await storePrivateKey(id, pemString, passphrase);

      expect(result).toBe(true);
      expect(mockDB.stores['private_keys'][id]).toBeDefined();
      expect(mockDB.stores['private_keys'][id].salt).toBeDefined();
      expect(mockDB.stores['private_keys'][id].iv).toBeDefined();
      expect(mockDB.stores['private_keys'][id].ciphertext).toBeDefined();
    });

    it('should use different salt and IV for each storage', async () => {
      const pemString = 'test-key-placeholder';
      const passphrase = 'pass123';

      await storePrivateKey('key1', pemString, passphrase);
      await storePrivateKey('key2', pemString, passphrase);

      const stored1 = mockDB.stores['private_keys']['key1'];
      const stored2 = mockDB.stores['private_keys']['key2'];

      expect(stored1.salt).not.toEqual(stored2.salt);
      expect(stored1.iv).not.toEqual(stored2.iv);
    });

    it('should overwrite existing key with same ID', async () => {
      const id = 'duplicate-key';
      const pem1 = 'test-key-placeholder-first';
      const pem2 = 'test-key-placeholder-second';
      const passphrase = 'pass123';

      await storePrivateKey(id, pem1, passphrase);
      const first = mockDB.stores['private_keys'][id];

      await storePrivateKey(id, pem2, passphrase);
      const second = mockDB.stores['private_keys'][id];

      expect(first).not.toEqual(second);
    });

    it('should handle empty passphrase', async () => {
      const id = 'empty-pass-key';
      const pemString = 'test-key-placeholder';

      const result = await storePrivateKey(id, pemString, '');

      expect(result).toBe(true);
    });

    it('should handle long PEM strings', async () => {
      const id = 'long-key';
      const longPem = 'test-key-placeholder-' + 'A'.repeat(5000);
      const passphrase = 'pass123';

      const result = await storePrivateKey(id, longPem, passphrase);

      expect(result).toBe(true);
      expect(mockDB.stores['private_keys'][id].ciphertext.length).toBeGreaterThan(0);
    });

    it('should use PBKDF2 with 200,000 iterations', async () => {
      const deriveKeySpy = vi.spyOn(window.crypto.subtle, 'deriveKey');
      
      const id = 'pbkdf2-test';
      const pemString = 'test-key-placeholder';
      const passphrase = 'test-pass';

      await storePrivateKey(id, pemString, passphrase);

      expect(deriveKeySpy).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'PBKDF2',
          iterations: 200_000,
          hash: 'SHA-256',
        }),
        expect.anything(),
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      );

      deriveKeySpy.mockRestore();
    });

    it('should use AES-GCM for encryption', async () => {
      const encryptSpy = vi.spyOn(window.crypto.subtle, 'encrypt');

      const id = 'aes-test';
      const pemString = 'test-key-placeholder';
      const passphrase = 'test-pass';

      await storePrivateKey(id, pemString, passphrase);

      expect(encryptSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'AES-GCM',
        }),
        expect.anything(),
        expect.anything()
      );

      encryptSpy.mockRestore();
    });
  });

  describe('getPrivateKey', () => {
    it('should retrieve and decrypt stored key', async () => {
      const id = 'retrieve-test';
      const pemString = 'test-key-placeholder-1';
      const passphrase = 'secure-passphrase-123';

      await storePrivateKey(id, pemString, passphrase);
      const retrieved = await getPrivateKey(id, passphrase);

      expect(retrieved).toBe(pemString);
    });

    it('should return null for non-existent key', async () => {
      const result = await getPrivateKey('non-existent-key', 'any-passphrase');

      expect(result).toBeNull();
    });

    it('should fail with wrong passphrase', async () => {
      const id = 'wrong-pass-test';
      const pemString = 'test-key-placeholder';
      const correctPass = 'correct-pass';
      const wrongPass = 'wrong-pass';

      await storePrivateKey(id, pemString, correctPass);

      await expect(getPrivateKey(id, wrongPass)).rejects.toThrow();
    });

    it('should handle multiple keys with different passphrases', async () => {
      const pem1 = 'test-key-placeholder-key1';
      const pem2 = 'test-key-placeholder-key2';
      const pass1 = 'password1';
      const pass2 = 'password2';

      await storePrivateKey('key1', pem1, pass1);
      await storePrivateKey('key2', pem2, pass2);

      const retrieved1 = await getPrivateKey('key1', pass1);
      const retrieved2 = await getPrivateKey('key2', pass2);

      expect(retrieved1).toBe(pem1);
      expect(retrieved2).toBe(pem2);
    });

    it('should handle unicode characters in PEM and passphrase', async () => {
      const id = 'unicode-test';
      const pemString = 'test-key-placeholder-日本語テスト';
      const passphrase = 'пароль-密码-🔐';

      await storePrivateKey(id, pemString, passphrase);
      const retrieved = await getPrivateKey(id, passphrase);

      expect(retrieved).toBe(pemString);
    });

    it('should use correct salt and IV for decryption', async () => {
      const id = 'salt-iv-test';
      const pemString = 'test-key-placeholder';
      const passphrase = 'test-pass';

      await storePrivateKey(id, pemString, passphrase);

      const decryptSpy = vi.spyOn(window.crypto.subtle, 'decrypt');

      await getPrivateKey(id, passphrase);

      expect(decryptSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'AES-GCM',
        }),
        expect.anything(),
        expect.anything()
      );

      decryptSpy.mockRestore();
    });
  });

  describe('deletePrivateKey', () => {
    it('should delete an existing key', async () => {
      const id = 'delete-test';
      const pemString = 'test-key-placeholder';
      const passphrase = 'pass123';

      await storePrivateKey(id, pemString, passphrase);
      expect(mockDB.stores['private_keys'][id]).toBeDefined();

      const result = await deletePrivateKey(id);

      expect(result).toBe(true);
      expect(mockDB.stores['private_keys'][id]).toBeUndefined();
    });

    it('should handle deletion of non-existent key', async () => {
      const result = await deletePrivateKey('non-existent-key');

      expect(result).toBe(true);
    });

    it('should allow re-storing after deletion', async () => {
      const id = 'delete-restore-test';
      const pem1 = 'test-key-placeholder-first';
      const pem2 = 'test-key-placeholder-second';
      const passphrase = 'pass123';

      await storePrivateKey(id, pem1, passphrase);
      await deletePrivateKey(id);
      await storePrivateKey(id, pem2, passphrase);

      const retrieved = await getPrivateKey(id, passphrase);
      expect(retrieved).toBe(pem2);
    });

    it('should not affect other stored keys', async () => {
      const pem1 = 'test-key-placeholder-key1';
      const pem2 = 'test-key-placeholder-key2';
      const passphrase = 'pass123';

      await storePrivateKey('key1', pem1, passphrase);
      await storePrivateKey('key2', pem2, passphrase);

      await deletePrivateKey('key1');

      const retrieved2 = await getPrivateKey('key2', passphrase);
      expect(retrieved2).toBe(pem2);

      const retrieved1 = await getPrivateKey('key1', passphrase);
      expect(retrieved1).toBeNull();
    });
  });

  describe('Security properties', () => {
    it('should use unique salt for each stored key', async () => {
      const pemString = 'test-key-placeholder';
      const passphrase = 'same-pass';

      await storePrivateKey('key1', pemString, passphrase);
      await storePrivateKey('key2', pemString, passphrase);
      await storePrivateKey('key3', pemString, passphrase);

      const salt1 = mockDB.stores['private_keys']['key1'].salt;
      const salt2 = mockDB.stores['private_keys']['key2'].salt;
      const salt3 = mockDB.stores['private_keys']['key3'].salt;

      expect(salt1).not.toEqual(salt2);
      expect(salt2).not.toEqual(salt3);
      expect(salt1).not.toEqual(salt3);
    });

    it('should use unique IV for each stored key', async () => {
      const pemString = 'test-key-placeholder';
      const passphrase = 'same-pass';

      await storePrivateKey('key1', pemString, passphrase);
      await storePrivateKey('key2', pemString, passphrase);

      const iv1 = mockDB.stores['private_keys']['key1'].iv;
      const iv2 = mockDB.stores['private_keys']['key2'].iv;

      expect(iv1).not.toEqual(iv2);
    });

    it('should produce different ciphertext for same input with different salts', async () => {
      const pemString = 'test-key-placeholder-identical-content';
      const passphrase = 'same-passphrase';

      await storePrivateKey('key1', pemString, passphrase);
      await storePrivateKey('key2', pemString, passphrase);

      const cipher1 = mockDB.stores['private_keys']['key1'].ciphertext;
      const cipher2 = mockDB.stores['private_keys']['key2'].ciphertext;

      expect(cipher1).not.toEqual(cipher2);
    });

    it('should have sufficient salt length (16 bytes)', async () => {
      const id = 'salt-length-test';
      const pemString = 'test-key-placeholder';
      const passphrase = 'pass123';

      await storePrivateKey(id, pemString, passphrase);

      const salt = mockDB.stores['private_keys'][id].salt;
      expect(salt.length).toBe(16);
    });

    it('should have sufficient IV length (12 bytes for AES-GCM)', async () => {
      const id = 'iv-length-test';
      const pemString = 'test-key-placeholder';
      const passphrase = 'pass123';

      await storePrivateKey(id, pemString, passphrase);

      const iv = mockDB.stores['private_keys'][id].iv;
      expect(iv.length).toBe(12);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty PEM string', async () => {
      const id = 'empty-pem';
      const pemString = '';
      const passphrase = 'pass123';

      const result = await storePrivateKey(id, pemString, passphrase);
      expect(result).toBe(true);

      const retrieved = await getPrivateKey(id, passphrase);
      expect(retrieved).toBe('');
    });

    it('should handle very long passphrase', async () => {
      const id = 'long-pass';
      const pemString = 'test-key-placeholder';
      const longPassphrase = 'a'.repeat(10000);

      await storePrivateKey(id, pemString, longPassphrase);
      const retrieved = await getPrivateKey(id, longPassphrase);

      expect(retrieved).toBe(pemString);
    });

    it('should handle special characters in key ID', async () => {
      const id = 'key-with-special-chars-!@#$%^&*()';
      const pemString = 'test-key-placeholder';
      const passphrase = 'pass123';

      await storePrivateKey(id, pemString, passphrase);
      const retrieved = await getPrivateKey(id, passphrase);

      expect(retrieved).toBe(pemString);
    });

    it('should handle concurrent operations on different keys', async () => {
      const operations = [];

      for (let i = 0; i < 5; i++) {
        const id = `concurrent-key-${i}`;
        const pem = `test-key-placeholder-${i}`;
        const pass = `pass${i}`;
        operations.push(storePrivateKey(id, pem, pass));
      }

      await Promise.all(operations);

      // Verify all keys were stored correctly
      for (let i = 0; i < 5; i++) {
        const retrieved = await getPrivateKey(`concurrent-key-${i}`, `pass${i}`);
        expect(retrieved).toBe(`test-key-placeholder-${i}`);
      }
    });
  });

  describe('Error handling', () => {
    it('should handle storage errors gracefully', async () => {
      // Override put to simulate error
      const originalPut = MockIDBObjectStore.prototype.put;
      MockIDBObjectStore.prototype.put = function() {
        return {
          onsuccess: null,
          onerror: null,
          error: new Error('Storage full'),
        };
      };

      const id = 'error-test';
      const pemString = 'test-key-placeholder';
      const passphrase = 'pass123';

      try {
        await storePrivateKey(id, pemString, passphrase);
      } catch (error) {
        expect(error).toBeDefined();
      }

      // Restore original
      MockIDBObjectStore.prototype.put = originalPut;
    });

    it('should handle retrieval errors gracefully', async () => {
      const originalGet = MockIDBObjectStore.prototype.get;
      MockIDBObjectStore.prototype.get = function() {
        return {
          onsuccess: null,
          onerror: null,
          error: new Error('Database locked'),
        };
      };

      try {
        await getPrivateKey('any-key', 'any-pass');
      } catch (error) {
        expect(error).toBeDefined();
      }

      MockIDBObjectStore.prototype.get = originalGet;
    });
  });

  describe('Integration scenarios', () => {
    it('should support typical user workflow', async () => {
      // User generates and stores their key
      const userId = 'user-123';
      const userPem = 'test-key-placeholder-UserPrivateKey';
      const userPass = 'MySecurePassword123!';

      await storePrivateKey(userId, userPem, userPass);

      // User retrieves key later to decrypt data
      const retrieved = await getPrivateKey(userId, userPass);
      expect(retrieved).toBe(userPem);

      // User changes their key (stores new one)
      const newPem = 'test-key-placeholder-NewPrivateKey';
      await storePrivateKey(userId, newPem, userPass);

      const retrievedNew = await getPrivateKey(userId, userPass);
      expect(retrievedNew).toBe(newPem);

      // User decides to remove their key
      await deletePrivateKey(userId);

      const afterDelete = await getPrivateKey(userId, userPass);
      expect(afterDelete).toBeNull();
    });

    it('should support multiple user profiles', async () => {
      const users = [
        { id: 'doctor-1', pem: 'test-key-placeholder-doc1', pass: 'doc1pass' },
        { id: 'patient-1', pem: 'test-key-placeholder-pat1', pass: 'pat1pass' },
        { id: 'researcher-1', pem: 'test-key-placeholder-res1', pass: 'res1pass' },
      ];

      // Store all user keys
      for (const user of users) {
        await storePrivateKey(user.id, user.pem, user.pass);
      }

      // Verify each user can retrieve their own key
      for (const user of users) {
        const retrieved = await getPrivateKey(user.id, user.pass);
        expect(retrieved).toBe(user.pem);
      }

      // Verify users cannot access each other's keys with wrong passphrase
      await expect(
        getPrivateKey('doctor-1', 'pat1pass')
      ).rejects.toThrow();
    });
  });
});