import rateLimit, { type RateLimitRequestHandler } from "express-rate-limit";

import env from "./env.js";

const FIFTEEN_MINUTES = 15 * 60 * 1000;

type RateLimitConfig = { limit: number; message: string };

export const createRateLimiter = ({ limit, message }: RateLimitConfig): RateLimitRequestHandler =>
  rateLimit({
    limit,
    windowMs: FIFTEEN_MINUTES,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message, errors: {} },
  });

export const apiLimiter = createRateLimiter({
  limit: Number(env("RATE_LIMIT_MAX", "100")),
  message: "Too many requests, please try again later",
});

export const authLimiter = createRateLimiter({
  limit: Number(env("AUTH_RATE_LIMIT_MAX", "10")),
  message: "Too many login attempts, please try again later",
});
