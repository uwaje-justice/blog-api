import type { NextFunction, Request, Response } from "express";

import { AppError } from "../errors/index.js";

const errorHandler = (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof AppError) {
    res
      .status(err.statusCode)
      .json({ message: err.message, errors: Object.keys(err.errors).length > 0 ? err.errors : {} });
    return;
  }

  console.error(err);
  res.status(500).json({ error: "Internal server error" });
};

export default errorHandler;
