import { storeMetaCredentials, validateMetaToken } from "../server/metaCredentials";
import { getDb } from "../server/db";
import { users } from "../drizzle/schema";

async function main() {
  const token = "EAAMuA4Ly8N0BRESUZAGceN71FzgFprunrJz9E5iMm8LgqeU7CnBOtUFEPvYJr1ZBGxKRmat3P8X1MqqgOIe1AKOdr3SuFmKJQk4ZC3HeYLMmpfwZC0Hj1jQnOhORhKWR4Rh3v2I7O3geqkAjR9CopFQp9FMkoNTZAuwoOLvI5T7UNZChnEbalzgvLbHbaD29ibrerNmJ7TRhiIQlTp73K5EXglRN9qCPCm2ySeM70wjIZBHv5MdEp5XNJxAQ46ahl06oEAu2wFLS81D3NZAzIF7BFQHPs1CpFcUgAwZDZD";

  console.log("Validating token...");
  const validation = await validateMetaToken(token);
  
  if (!validation.valid) {
    console.error("Token invalid:", validation.error);
    return;
  }

  console.log("Token valid! Permissions:", validation.permissions);

  const db = await getDb();
  if (!db) {
    console.error("Database not available");
    return;
  }

  // Obter o primeiro usuário para teste
  const allUsers = await db.select().from(users).limit(1);
  if (allUsers.length === 0) {
    console.error("No users found in database. Please login to the app first.");
    return;
  }

  const user = allUsers[0];
  console.log(`Injecting token for user: ${user.name} (${user.email})`);

  await storeMetaCredentials(user.id, {
    accessToken: token,
    permissions: validation.permissions,
    accountName: "Manus Test Account"
  });

  console.log("Token successfully injected! You can now test the 'Minerador' and 'Busca Avançada' pages.");
}

main().catch(console.error);
