import request from "supertest";
import { describe, expect, it } from "vitest";

import app from "../../src/app.js";

describe("CORS", () => {
  it("allows the author client with credentials", async () => {
    const response = await request(app).get("/health").set("Origin", "http://localhost:5173");

    expect(response.status).toBe(200);
    expect(response.headers["access-control-allow-origin"]).toBe("http://localhost:5173");
    expect(response.headers["access-control-allow-credentials"]).toBe("true");
  });

  it("allows the public client with credentials", async () => {
    const response = await request(app)
      .options("/health")
      .set("Origin", "http://localhost:5174")
      .set("Access-Control-Request-Method", "GET");

    expect(response.status).toBe(204);
    expect(response.headers["access-control-allow-origin"]).toBe("http://localhost:5174");
    expect(response.headers["access-control-allow-credentials"]).toBe("true");
  });

  it("blocks other origins", async () => {
    const response = await request(app).get("/health").set("Origin", "https://evil.example");

    expect(response.status).toBe(403);
  });
});
