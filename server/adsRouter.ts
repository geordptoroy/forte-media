import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { searchAds } from "./services/metaAdsService";
import { StealthExtractorService } from "./services/stealthExtractorService";

export const adsRouter = router({
  search: protectedProcedure
    .input(
      z.object({
        searchTerms: z.string().min(1),
        country: z.string().default("BR"),
        adType: z.enum(["ALL", "POLITICAL_AND_ISSUE_ADS"]).default("ALL"),
        limit: z.number().min(1).max(500).default(50), // Aumentado para 50 por padrão, max 500
      })
    )
    .query(async ({ input }) => {
      return await searchAds(input);
    }),

  extractMedia: protectedProcedure
    .input(
      z.object({
        snapshotUrl: z.string().url(),
      })
    )
    .mutation(async ({ input }) => {
      const result = await StealthExtractorService.extractMedia(input.snapshotUrl);
      return { result };
    }),
});
