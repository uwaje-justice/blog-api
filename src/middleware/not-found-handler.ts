import type { NextFunction, Request, Response } from "express";

import { AppError } from "../errors/index.js";

export const notFoundHandler = (_req: Request, _res: Response, next: NextFunction) => {
  next(new AppError(404, "Not found"));
};
