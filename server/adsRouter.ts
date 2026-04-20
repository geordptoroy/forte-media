import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { searchAds } from "./services/metaAdsService";
import { StealthExtractorService } from "./services/stealthExtractorService";

export const adsRouter = router({
  search: protectedProcedure
    .input(
      z.object({
        searchTerms: z.string().optional().default(""),
        country: z.string().default("BR"),
        adType: z.enum(["ALL", "POLITICAL_AND_ISSUE_ADS"]).default("ALL"),
        limit: z.number().min(1).max(500).default(50),
        // Filtros avançados (Server-side)
        scaleMin: z.number().min(1).default(1).optional(),
        scaleMax: z.number().max(1000).default(50).optional(),
        durationMin: z.number().min(1).default(1).optional(),
        durationMax: z.number().max(365).default(300).optional(),
        productTypes: z.array(z.string()).optional(),
        funnelTypes: z.array(z.string()).optional(),
        excludePolitical: z.boolean().default(true).optional(),
        currency: z.string().optional(),
        minSpend: z.number().optional(),
        after: z.string().optional(), // Suporte a paginação
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
