import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { userMetaCredentials } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { logger } from "./_core/logger";
import crypto from "crypto";

/**
 * Credentials Router — Gestão de Tokens Meta e Pixel
 */

export const credentialsRouter = router({
  /**
   * Obter credenciais atuais do usuário
   */
  getCredentials: protectedProcedure.query(async ({ ctx }) => {
    try {
      const db = await getDb();
      if (!db) throw new Error("Banco de dados indisponível");

      const credentials = await db.query.userMetaCredentials.findFirst({
        where: eq(userMetaCredentials.userId, ctx.user.id),
      });

      if (!credentials) return null;

      return {
        metaAccessToken: credentials.encryptedAccessToken ? "********" : null,
        pixelId: credentials.pixelId,
        pixelAccessToken: credentials.pixelAccessToken ? "********" : null,
        isValid: credentials.isValid,
      };
    } catch (error: any) {
      logger.error("[Credentials] Erro ao buscar credenciais:", error);
      throw new Error("Falha ao buscar credenciais.");
    }
  }),

  /**
   * Salvar ou atualizar credenciais (Meta e Pixel)
   */
  saveCredentials: protectedProcedure
    .input(
      z.object({
        metaAccessToken: z.string().optional(),
        pixelId: z.string().optional(),
        pixelAccessToken: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Banco de dados indisponível");
        const userId = ctx.user.id;

        const existing = await db.query.userMetaCredentials.findFirst({
          where: eq(userMetaCredentials.userId, userId),
        });

        const dataToSave: any = {
          userId,
          updatedAt: new Date(),
        };

        if (input.metaAccessToken) {
          dataToSave.encryptedAccessToken = input.metaAccessToken;
          // Gerar um hash simples para comparação se necessário
          dataToSave.tokenHash = crypto.createHash("sha256").update(input.metaAccessToken).digest("hex");
        }

        if (input.pixelId !== undefined) dataToSave.pixelId = input.pixelId;
        if (input.pixelAccessToken !== undefined) dataToSave.pixelAccessToken = input.pixelAccessToken;

        if (existing) {
          await db
            .update(userMetaCredentials)
            .set(dataToSave)
            .where(eq(userMetaCredentials.userId, userId));
        } else {
          // Se for novo, o token da Meta é obrigatório no schema original
          if (!dataToSave.encryptedAccessToken) {
             // Fallback para não quebrar o NOT NULL do schema se o usuário só quiser salvar o pixel primeiro
             dataToSave.encryptedAccessToken = "PENDING";
             dataToSave.tokenHash = "PENDING";
          }
          await db.insert(userMetaCredentials).values({
            ...dataToSave,
            permissions: [],
            isValid: true,
          });
        }

        return { success: true };
      } catch (error: any) {
        logger.error("[Credentials] Erro ao salvar credenciais:", error);
        throw new Error(error.message || "Falha ao salvar credenciais.");
      }
    }),
});
