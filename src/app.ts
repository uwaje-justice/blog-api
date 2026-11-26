import cors from "cors";
import express from "express";
import helmet from "helmet";

import { passport } from "./lib/passport.js";
import { errorHandler, notFoundHandler } from "./middleware/index.js";
import healthRouter from "./routes/health-router.js";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

app.use(healthRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
