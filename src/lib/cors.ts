import type { CorsOptions } from "cors";

import { AppError } from "../errors/index.js";
import env from "./env.js";

const allowedOrigins = [
  env("AUTHOR_CLIENT", "http://localhost:5173"),
  env("PUBLIC_CLIENT", "http://localhost:5174"),
].filter(Boolean);

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new AppError(403, "Origin not allowed"));
  },
  credentials: true,
};

export default corsOptions;
