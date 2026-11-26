import jwt from "jsonwebtoken";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AppError } from "../errors/index.js";

const { prismaMock, bcryptMock } = vi.hoisted(() => ({
  prismaMock: {
    user: { create: vi.fn(), findUnique: vi.fn() },
  },
  bcryptMock: {
    hash: vi.fn(),
    compare: vi.fn(),
    hashSync: vi.fn(() => "dummy-hash"),
  },
}));

vi.mock("../lib/db.js", () => ({ default: prismaMock }));
vi.mock("bcryptjs", () => ({ default: bcryptMock }));

import * as authService from "./auth-service.js";

const SECRET = "test-secret-test-secret-test-secret";

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("JWT_SECRET", SECRET);
});

describe("registerUser", () => {
  it("hashes the password and creates the user", async () => {
    bcryptMock.hash.mockResolvedValue("hashed-pw");
    prismaMock.user.create.mockResolvedValue({ id: "u1", email: "a@b.com" });

    const user = await authService.registerUser("a@b.com", "Password1");

    expect(bcryptMock.hash).toHaveBeenCalledWith("Password1", 12);
    expect(prismaMock.user.create).toHaveBeenCalledWith({
      data: { email: "a@b.com", passwordHash: "hashed-pw" },
      select: { id: true, email: true },
    });
    expect(user).toEqual({ id: "u1", email: "a@b.com" });
  });

  it("throws a 409 AppError when the email already exists", async () => {
    bcryptMock.hash.mockResolvedValue("hashed-pw");
    prismaMock.user.create.mockRejectedValue({ code: "P2002" });

    const promise = authService.registerUser("a@b.com", "Password1");

    await expect(promise).rejects.toBeInstanceOf(AppError);
    await expect(promise).rejects.toMatchObject({
      statusCode: 409,
      errors: { email: "This email is already registered" },
    });
  });

  it("rethrows unknown errors unchanged", async () => {
    const dbError = new Error("db down");
    bcryptMock.hash.mockResolvedValue("hashed-pw");
    prismaMock.user.create.mockRejectedValue(dbError);

    await expect(authService.registerUser("a@b.com", "Password1")).rejects.toBe(dbError);
  });
});

describe("verifyCredentials", () => {
  const dbUser = { id: "u1", email: "a@b.com", passwordHash: "stored-hash" };

  it("returns the user without the password hash on a correct password", async () => {
    prismaMock.user.findUnique.mockResolvedValue(dbUser);
    bcryptMock.compare.mockResolvedValue(true);

    const result = await authService.verifyCredentials("a@b.com", "Password1");

    expect(bcryptMock.compare).toHaveBeenCalledWith("Password1", "stored-hash");
    expect(result).toEqual({ id: "u1", email: "a@b.com" });
    expect(result).not.toHaveProperty("passwordHash");
  });

  it("returns null on a wrong password", async () => {
    prismaMock.user.findUnique.mockResolvedValue(dbUser);
    bcryptMock.compare.mockResolvedValue(false);

    expect(await authService.verifyCredentials("a@b.com", "wrong")).toBeNull();
  });

  it("returns null for an unknown email, and still runs a compare", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    bcryptMock.compare.mockResolvedValue(false);

    const result = await authService.verifyCredentials("nobody@b.com", "Password1");

    expect(result).toBeNull();
    expect(bcryptMock.compare).toHaveBeenCalledWith("Password1", "dummy-hash");
  });
});

describe("getUserById", () => {
  it("returns only id and email", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: "u1", email: "a@b.com" });

    const user = await authService.getUserById("u1");

    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: { id: "u1" },
      select: { id: true, email: true },
    });
    expect(user).toEqual({ id: "u1", email: "a@b.com" });
  });

  it("returns null when the user does not exist", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    expect(await authService.getUserById("missing")).toBeNull();
  });
});

describe("signToken", () => {
  it("signs a token with the user id as a string subject", () => {
    const token = authService.signToken(42);
    const payload = jwt.verify(token, SECRET) as jwt.JwtPayload;

    expect(payload.sub).toBe("42");
  });

  it("expires after one hour", () => {
    const payload = jwt.decode(authService.signToken("u1")) as jwt.JwtPayload;

    expect(payload.exp! - payload.iat!).toBe(60 * 60);
  });

  it("cannot be verified with a different secret", () => {
    const token = authService.signToken("u1");

    expect(() => jwt.verify(token, "another-secret")).toThrow();
  });
});
