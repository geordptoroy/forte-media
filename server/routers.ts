import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { sdk } from "./_core/sdk";
import { adsRouter } from "./adsRouter";

export const appRouter = router({
  system: systemRouter,
  ads: adsRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    register: publicProcedure
      .input(
        z.object({
          name: z.string().min(2, "Name is too short"),
          email: z.string().email("Invalid email"),
          password: z.string().min(6, "Password must be at least 6 characters"),
        })
      )
      .mutation(async ({ ctx, input }) => {
        try {
          const user = await sdk.register(input.name, input.email, input.password);
          const sessionToken = await sdk.createSessionToken(user);
          const cookieOptions = getSessionCookieOptions(ctx.req);
          ctx.res.cookie(COOKIE_NAME, sessionToken, cookieOptions);
          return { success: true, user };
        } catch (error) {
          throw new Error(error instanceof Error ? error.message : "Registration failed");
        }
      }),
    login: publicProcedure
      .input(
        z.object({
          email: z.string().email("Invalid email"),
          password: z.string().min(1, "Password is required"),
        })
      )
      .mutation(async ({ ctx, input }) => {
        try {
          const user = await sdk.login(input.email, input.password);
          const sessionToken = await sdk.createSessionToken(user);
          const cookieOptions = getSessionCookieOptions(ctx.req);
          ctx.res.cookie(COOKIE_NAME, sessionToken, cookieOptions);
          return { success: true, user };
        } catch (error) {
          throw new Error(error instanceof Error ? error.message : "Login failed");
        }
      }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
});

export type AppRouter = typeof appRouter;
