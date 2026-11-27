import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";

import { passport } from "./lib/index.js";
import { errorHandler, notFoundHandler } from "./middleware/index.js";
import { authRouter, commentRouter, healthRouter, postRouter } from "./routes/index.js";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(passport.initialize());

app.use("/health", healthRouter);
app.use("/api/auth", authRouter);
app.use("/api/posts", postRouter);
app.use("/api/comments", commentRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
