import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";

import app from "../../src/app.js";
import { authCookie, prisma, resetDb } from "../helpers.js";

beforeEach(resetDb);
afterAll(() => prisma.$disconnect());

describe("POST /api/auth/register", () => {
  it("creates a user and returns a token cookie", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send({ email: "a@b.com", password: "Password1" });

    expect(response.status).toBe(201);
    expect(response.body.user.email).toBe("a@b.com");
    expect(response.headers["set-cookie"][0]).toContain("token=");
    expect(await prisma.user.findUnique({ where: { email: "a@b.com" } })).not.toBeNull();
  });

  it("returns a 409 error with the shared error shape for a duplicate email", async () => {
    await request(app).post("/api/auth/register").send({ email: "a@b.com", password: "Password1" });

    const response = await request(app)
      .post("/api/auth/register")
      .send({ email: "a@b.com", password: "Password1" });

    expect(response.status).toBe(409);
    expect(response.body).toEqual({
      message: "Email already in use",
      errors: { email: "This email is already registered" },
    });
  });

  it("returns a 400 error with field messages for invalid input", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send({ email: "not-an-email", password: "short" });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Validation failed");
    expect(response.body.errors.email).toBe("Must be a valid email address");
    expect(response.body.errors.password).toBe("Password must be 8 to 72 characters");
  });
});

describe("POST /api/auth/login", () => {
  it("returns a user and cookie for correct credentials", async () => {
    await request(app).post("/api/auth/register").send({ email: "a@b.com", password: "Password1" });

    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: "a@b.com", password: "Password1" });

    expect(response.status).toBe(200);
    expect(response.body.user.email).toBe("a@b.com");
    expect(response.headers["set-cookie"][0]).toContain("token=");
  });

  it("returns 401 for a wrong password", async () => {
    await request(app).post("/api/auth/register").send({ email: "a@b.com", password: "Password1" });

    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: "a@b.com", password: "wrong" });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ message: "Invalid credentials", errors: {} });
  });
});

describe("GET /api/auth/me", () => {
  it("returns the signed-in user", async () => {
    const user = await prisma.user.create({
      data: { email: "a@b.com", passwordHash: "unused" },
      select: { id: true },
    });

    const response = await request(app).get("/api/auth/me").set("Cookie", authCookie(user.id));

    expect(response.status).toBe(200);
    expect(response.body.user).toEqual({ id: user.id, email: "a@b.com" });
  });

  it("returns 401 without a cookie", async () => {
    const response = await request(app).get("/api/auth/me");

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ message: "Unauthorized", errors: {} });
  });
});

describe("POST /api/auth/logout", () => {
  it("clears the token cookie", async () => {
    const response = await request(app).post("/api/auth/logout");

    expect(response.status).toBe(200);
    expect(response.headers["set-cookie"][0]).toContain("token=;");
  });
});
