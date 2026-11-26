import type { Request } from "express";
import passport from "passport";
import { Strategy as JwtStrategy } from "passport-jwt";
import { Strategy as LocalStrategy } from "passport-local";

import { authService } from "../services/index.js";
import env from "./env.js";

const cookieExtractor = (req: Request): string | null => req?.cookies?.token ?? null;

passport.use(
  new LocalStrategy(
    { usernameField: "email", passwordField: "password" },
    async (email, password, done) => {
      try {
        const user = await authService.verifyCredentials(email, password);
        if (!user) {
          return done(null, false, { message: "Invalid email or password" });
        }
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    },
  ),
);

passport.use(
  new JwtStrategy(
    {
      jwtFromRequest: cookieExtractor,
      secretOrKey: env("JWT_SECRET"),
      algorithms: ["HS256"],
    },
    async (payload, done) => {
      try {
        const user = await authService.getUserById(String(payload.sub));
        return done(null, user ?? false);
      } catch (error) {
        return done(error, false);
      }
    },
  ),
);

export default passport;
