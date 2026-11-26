import type { NextFunction, Request, Response } from "express";
import passport from "passport";

import { AppError } from "../errors/index.js";
import { env } from "../lib/index.js";
import { authService } from "../services/index.js";

const COOKIE_NAME = "token";

const cookieOptions = {
  httpOnly: true,
  secure: env("NODE_ENV", "development") === "production",
  sameSite: "lax" as const,
};

const setAuthCookie = (res: Response, userId: string | number) =>
  res.cookie(COOKIE_NAME, authService.signToken(userId), {
    ...cookieOptions,
    maxAge: 60 * 60 * 1000, // match the JWT expiry
  });

export const register = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = await authService.registerUser(email, password);

  setAuthCookie(res, user.id);
  return res.status(201).json({ user });
};

export const login = (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate("local", { session: false }, (err: unknown, user: Express.User | false) => {
    if (err) return next(err);
    if (!user) return next(new AppError(401, "Invalid credentials"));

    setAuthCookie(res, user.id);
    return res.status(200).json({ user: { id: user.id, email: user.email } });
  })(req, res, next);
};

export const logout = (_req: Request, res: Response) => {
  res.clearCookie(COOKIE_NAME, cookieOptions);
  return res.status(200).json({ message: "Logged out" });
};

export const getMe = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) return next(new AppError(401, "Not authenticated"));
  return res.status(200).json({ user: { id: req.user.id, email: req.user.email } });
};
