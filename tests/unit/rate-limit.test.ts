import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";

import { createRateLimiter } from "../../src/lib/index.js";

describe("createRateLimiter", () => {
  it("blocks a request after the limit is reached", async () => {
    const app = express();
    app.use(createRateLimiter({ limit: 2, message: "Slow down" }));
    app.get("/", (_req, res) => res.status(200).json({ ok: true }));

    const first = await request(app).get("/");
    const second = await request(app).get("/");
    const third = await request(app).get("/");

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(third.status).toBe(429);
    expect(third.body).toEqual({ message: "Slow down", errors: {} });
  });
});
