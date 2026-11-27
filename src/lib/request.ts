import type { Request } from "express";
import { matchedData } from "express-validator";

import { AppError } from "../errors/index.js";

export const getUserId = (req: Request) => {
  if (!req.user) throw new AppError(401, "Unauthorized");
  return req.user.id;
};

export const getPagination = (req: Request) => {
  const { page = 1, pageSize = 20 } = matchedData<{ page?: number; pageSize?: number }>(req, {
    locations: ["query"],
  });
  return { page, pageSize };
};
