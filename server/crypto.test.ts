import { describe, it, expect } from 'vitest';
import { encryptToken, decryptToken } from './crypto';

describe('Crypto - AES-256-GCM', () => {
  it('should encrypt and decrypt a token correctly', () => {
    const originalToken = 'test-meta-access-token-12345';
    
    const encrypted = encryptToken(originalToken);
    expect(encrypted).toBeDefined();
    expect(encrypted).not.toBe(originalToken);
    
    const decrypted = decryptToken(encrypted);
    expect(decrypted).toBe(originalToken);
  });

  it('should produce different ciphertexts for the same token (due to random IV)', () => {
    const token = 'test-meta-access-token-12345';
    
    const encrypted1 = encryptToken(token);
    const encrypted2 = encryptToken(token);
    
    expect(encrypted1).not.toBe(encrypted2);
    
    // But both should decrypt to the same value
    expect(decryptToken(encrypted1)).toBe(token);
    expect(decryptToken(encrypted2)).toBe(token);
  });

  it('should handle special characters in tokens', () => {
    const specialToken = 'token-with-special-chars-!@#$%^&*()_+-=[]{}|;:,.<>?/~`';
    
    const encrypted = encryptToken(specialToken);
    const decrypted = decryptToken(encrypted);
    
    expect(decrypted).toBe(specialToken);
  });

  it('should handle long tokens', () => {
    const longToken = 'a'.repeat(1000);
    
    const encrypted = encryptToken(longToken);
    const decrypted = decryptToken(encrypted);
    
    expect(decrypted).toBe(longToken);
  });

  it('should throw error on invalid ciphertext', () => {
    expect(() => {
      decryptToken('invalid-ciphertext');
    }).toThrow();
  });

  it('should throw error on corrupted ciphertext', () => {
    const token = 'test-token';
    const encrypted = encryptToken(token);
    
    // Corrupt the ciphertext
    const corrupted = encrypted.slice(0, -10) + 'corrupted!';
    
    expect(() => {
      decryptToken(corrupted);
    }).toThrow();
  });
});
