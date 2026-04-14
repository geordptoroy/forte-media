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
        limit: z.number().min(1).max(100).default(25),
      })
    )
    .query(async ({ input }) => {
      return await searchAds(input);
    }),

  extractVideo: protectedProcedure
    .input(
      z.object({
        snapshotUrl: z.string().url(),
      })
    )
    .mutation(async ({ input }) => {
      const videoUrl = await StealthExtractorService.extractVideoUrl(input.snapshotUrl);
      return { videoUrl };
    }),
});
