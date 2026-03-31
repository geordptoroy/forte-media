import crypto from "crypto";

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "default-key-change-in-production-32chars";
const ALGORITHM = "aes-256-gcm";

/**
 * Validar que a chave de criptografia tem o tamanho correto (32 bytes para AES-256)
 */
function getEncryptionKey(): Buffer {
  const key = ENCRYPTION_KEY.padEnd(32, "0").slice(0, 32);
  return Buffer.from(key);
}

/**
 * Criptografar um token de acesso Meta
 * Retorna um objeto com iv, encryptedData e authTag
 */
export function encryptToken(token: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, getEncryptionKey(), iv);

  let encrypted = cipher.update(token, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  // Combinar iv + authTag + encrypted em um único string
  const combined = iv.toString("hex") + authTag.toString("hex") + encrypted;
  return combined;
}

/**
 * Descriptografar um token de acesso Meta
 */
export function decryptToken(encryptedData: string): string {
  try {
    // Extrair iv (32 chars = 16 bytes), authTag (32 chars = 16 bytes), e dados criptografados
    const iv = Buffer.from(encryptedData.slice(0, 32), "hex");
    const authTag = Buffer.from(encryptedData.slice(32, 64), "hex");
    const encrypted = encryptedData.slice(64);

    const decipher = crypto.createDecipheriv(ALGORITHM, getEncryptionKey(), iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    console.error("[Crypto] Failed to decrypt token:", error);
    throw new Error("Failed to decrypt token");
  }
}

/**
 * Gerar hash SHA-256 de um token para validação
 */
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Validar que um token corresponde ao seu hash
 */
export function validateTokenHash(token: string, hash: string): boolean {
  return hashToken(token) === hash;
}
