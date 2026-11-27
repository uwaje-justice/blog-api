import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { authService } from "../../src/services/index.js";
import { prisma, resetDb } from "../helpers.js";

const SECRET = process.env.JWT_SECRET!;

beforeEach(resetDb);
afterAll(() => prisma.$disconnect());

describe("registerUser", () => {
  it("stores a hashed password and returns only id and email", async () => {
    const user = await authService.registerUser("a@b.com", "Password1");

    const stored = await prisma.user.findUniqueOrThrow({ where: { email: "a@b.com" } });
    expect(user).toEqual({ id: stored.id, email: "a@b.com" });
    expect(stored.passwordHash).not.toBe("Password1");
    expect(await bcrypt.compare("Password1", stored.passwordHash)).toBe(true);
  });

  it("throws a 409 AppError when the email already exists", async () => {
    await authService.registerUser("a@b.com", "Password1");

    await expect(authService.registerUser("a@b.com", "Password1")).rejects.toMatchObject({
      statusCode: 409,
      errors: { email: "This email is already registered" },
    });
  });
});

describe("verifyCredentials", () => {
  it("returns the user without the password hash on a correct password", async () => {
    await authService.registerUser("a@b.com", "Password1");

    const result = await authService.verifyCredentials("a@b.com", "Password1");

    expect(result).toMatchObject({ email: "a@b.com" });
    expect(result).not.toHaveProperty("passwordHash");
  });

  it("returns null on a wrong password", async () => {
    await authService.registerUser("a@b.com", "Password1");

    expect(await authService.verifyCredentials("a@b.com", "wrong")).toBeNull();
  });

  it("returns null for an unknown email", async () => {
    expect(await authService.verifyCredentials("nobody@b.com", "Password1")).toBeNull();
  });
});

describe("getUserById", () => {
  it("returns only id and email", async () => {
    const user = await authService.registerUser("a@b.com", "Password1");

    expect(await authService.getUserById(user.id)).toEqual({ id: user.id, email: "a@b.com" });
  });

  it("returns null when the user does not exist", async () => {
    expect(await authService.getUserById("missing")).toBeNull();
  });
});

describe("signToken", () => {
  it("signs a token with the user id as a string subject", () => {
    const payload = jwt.verify(authService.signToken(42), SECRET) as jwt.JwtPayload;

    expect(payload.sub).toBe("42");
  });

  it("expires after one hour", () => {
    const payload = jwt.decode(authService.signToken("u1")) as jwt.JwtPayload;

    expect(payload.exp! - payload.iat!).toBe(60 * 60);
  });

  it("cannot be verified with a different secret", () => {
    expect(() => jwt.verify(authService.signToken("u1"), "another-secret")).toThrow();
  });
});
