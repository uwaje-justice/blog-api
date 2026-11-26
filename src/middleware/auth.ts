import type { NextFunction, Request, Response } from "express";

import { AppError } from "../errors/index.js";
import { passport } from "../lib/passport.js";

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate("jwt", { session: false }, (err: unknown, user: Express.User | false) => {
    if (err) {
      next(err);
      return;
    }

    if (!user) {
      next(new AppError(401, "Unauthorized"));
      return;
    }

    req.user = user;
    next();
  })(req, res, next);
};
