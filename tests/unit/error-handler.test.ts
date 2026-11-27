import type { NextFunction, Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";

import { errorHandler } from "../../src/middleware/index.js";

describe("errorHandler", () => {
  it("uses the shared error shape for unexpected errors", () => {
    const json = vi.fn();
    const status = vi.fn().mockReturnValue({ json });
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    errorHandler(
      new Error("boom"),
      {} as Request,
      { status } as unknown as Response,
      (() => {}) as NextFunction,
    );

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({ message: "Internal server error", errors: {} });
    consoleSpy.mockRestore();
  });
});
