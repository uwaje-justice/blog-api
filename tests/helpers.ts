import jwt from "jsonwebtoken";

import prisma from "../src/lib/db.js";

export const resetDb = async () => {
  await prisma.comment.deleteMany();
  await prisma.post.deleteMany();
  await prisma.user.deleteMany();
};

export const createUser = (email = "user@example.com") =>
  prisma.user.create({
    data: { email, passwordHash: "unused-hash" },
    select: { id: true, email: true },
  });

export const createComment = (postId: string, overrides: Record<string, unknown> = {}) =>
  prisma.comment.create({
    data: { text: "A comment", postId, ...overrides },
  });

export const authCookie = (userId: string) =>
  `token=${jwt.sign({ sub: userId }, process.env.JWT_SECRET!, { expiresIn: "1h" })}`;

export { prisma };
