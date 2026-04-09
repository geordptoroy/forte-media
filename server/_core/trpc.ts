import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";
import { RATE_LIMIT_PRESETS } from "./rate-limit";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.role !== 'admin') {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);

/**
 * Middleware de rate limiting para procedimentos públicos
 */
const publicRateLimit = t.middleware(async opts => {
  const { ctx, next } = opts;
  const ip = ctx.req.ip || ctx.req.socket.remoteAddress || "unknown";
  const { maxRequests, windowMs } = RATE_LIMIT_PRESETS.PUBLIC;

  if (!ctx.rateLimiter.isAllowed(`public:${ip}`, maxRequests, windowMs)) {
    const info = ctx.rateLimiter.getInfo(`public:${ip}`, maxRequests, windowMs);
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: `Rate limit exceeded. Retry after ${info.retryAfter} seconds`,
    });
  }

  return next();
});

/**
 * Middleware de rate limiting para procedimentos autenticados
 */
const protectedRateLimit = t.middleware(async opts => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  const { maxRequests, windowMs } = RATE_LIMIT_PRESETS.API;

  if (!ctx.rateLimiter.isAllowed(`api:${ctx.user.id}`, maxRequests, windowMs)) {
    const info = ctx.rateLimiter.getInfo(`api:${ctx.user.id}`, maxRequests, windowMs);
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: `Rate limit exceeded. Retry after ${info.retryAfter} seconds`,
    });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const publicProcedureWithRateLimit = t.procedure.use(publicRateLimit);
export const protectedProcedureWithRateLimit = t.procedure.use(protectedRateLimit);
