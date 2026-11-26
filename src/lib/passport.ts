import { compare } from "bcryptjs";
import passport from "passport";
import { ExtractJwt, Strategy as JwtStrategy } from "passport-jwt";
import LocalStrategyModule from "passport-local";
import type { Strategy as PassportStrategy } from "passport-strategy";

import prisma from "./db.js";
import env from "./env.js";

type VerifyDone = (
  error: unknown,
  user?: Express.User | false,
  options?: { message: string },
) => void;

type LocalStrategyConstructor = new (
  options: {
    usernameField?: string;
    passwordField?: string;
    session?: boolean;
  },
  verify: (username: string, password: string, done: VerifyDone) => void,
) => PassportStrategy;

const LocalStrategy = LocalStrategyModule as unknown as LocalStrategyConstructor;

const localStrategy = new LocalStrategy(
  {
    usernameField: "email",
    passwordField: "password",
    session: false,
  },
  async (email, password, done) => {
    try {
      const user = await prisma.user.findUnique({ where: { email } });

      if (!user || !(await compare(password, user.passwordHash))) {
        done(null, false, { message: "Invalid email or password" });
        return;
      }

      done(null, user);
    } catch (error) {
      done(error as Error);
    }
  },
);

const jwtStrategy = new JwtStrategy(
  {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: env("JWT_SECRET"),
  },
  async (payload, done) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: String(payload.sub) },
      });

      if (!user) {
        done(null, false, { message: "Unauthorized" });
        return;
      }

      done(null, user);
    } catch (error) {
      done(error as Error);
    }
  },
);

passport.use(localStrategy);
passport.use(jwtStrategy);

export { passport };
