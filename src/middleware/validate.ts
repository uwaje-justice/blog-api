import { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";

import AppError from "../errors/app-error.js";

const validate = (req: Request, _res: Response, next: NextFunction) => {
  const result = validationResult(req);

  if (result.isEmpty()) {
    return next();
  }

  const errors: Record<string, string> = {};

  for (const err of result.array()) {
    if (err.type === "field" && !errors[err.path]) {
      errors[err.path] = err.msg;
    }
  }

  return next(new AppError(400, "Validation failed", errors));
};

export default validate;
