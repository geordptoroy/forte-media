// Script simples em JS para injetar o token
import { drizzle } from "drizzle-orm/mysql2";
import { users, userMetaCredentials } from "../drizzle/schema.js";
import { eq } from "drizzle-orm";
import crypto from "crypto";

const DATABASE_URL = process.env.DATABASE_URL || "mysql://root:root@localhost:3306/forte";
const TOKEN = "EAAMuA4Ly8N0BRESUZAGceN71FzgFprunrJz9E5iMm8LgqeU7CnBOtUFEPvYJr1ZBGxKRmat3P8X1MqqgOIe1AKOdr3SuFmKJQk4ZC3HeYLMmpfwZC0Hj1jQnOhORhKWR4Rh3v2I7O3geqkAjR9CopFQp9FMkoNTZAuwoOLvI5T7UNZChnEbalzgvLbHbaD29ibrerNmJ7TRhiIQlTp73K5EXglRN9qCPCm2ySeM70wjIZBHv5MdEp5XNJxAQ46ahl06oEAu2wFLS81D3NZAzIF7BFQHPs1CpFcUgAwZDZD";

// Funções de criptografia simplificadas para o script
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "0123456789abcdef0123456789abcdef"; // 32 chars
const IV_LENGTH = 16;

function encrypt(text) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function hash(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

async function main() {
  console.log("Connecting to database...");
  const db = drizzle(DATABASE_URL);

  const allUsers = await db.select().from(users).limit(1);
  if (allUsers.length === 0) {
    console.log("No users found. Creating a test user...");
    await db.insert(users).values({
      name: "Manus Tester",
      email: "test@manus.im",
      password: "password123"
    });
  }

  const user = (await db.select().from(users).limit(1))[0];
  console.log(`Injecting token for user: ${user.name} (${user.email})`);

  const encryptedToken = encrypt(TOKEN);
  const tokenHash = hash(TOKEN);

  const existing = await db.select().from(userMetaCredentials).where(eq(userMetaCredentials.userId, user.id)).limit(1);

  if (existing.length > 0) {
    await db.update(userMetaCredentials).set({
      encryptedAccessToken: encryptedToken,
      tokenHash: tokenHash,
      isValid: true,
      lastValidatedAt: new Date(),
      updatedAt: new Date()
    }).where(eq(userMetaCredentials.userId, user.id));
  } else {
    await db.insert(userMetaCredentials).values({
      userId: user.id,
      encryptedAccessToken: encryptedToken,
      tokenHash: tokenHash,
      isValid: true,
      lastValidatedAt: new Date(),
      permissions: ["ads_read", "ads_management"]
    });
  }

  console.log("DONE! Token injected successfully.");
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
