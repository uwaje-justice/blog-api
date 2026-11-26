import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { AppError } from "../errors/index.js";
import { db } from "../lib/index.js";

const SALT_ROUNDS = 12;
// used to equalise timing when the email doesn't exist
const DUMMY_HASH = bcrypt.hashSync("dummy-password", SALT_ROUNDS);

const isUniqueViolation = (err: unknown) =>
  typeof err === "object" &&
  err !== null &&
  "code" in err &&
  (err as { code: string }).code === "P2002";

export const signToken = (userId: string | number) =>
  jwt.sign({ sub: String(userId) }, process.env.JWT_SECRET!, {
    expiresIn: "1h",
  });

export const registerUser = async (email: string, password: string) => {
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  try {
    return await db.user.create({
      data: { email, passwordHash },
      select: { id: true, email: true },
    });
  } catch (err) {
    if (isUniqueViolation(err)) {
      throw new AppError(409, "Email already in use", {
        email: "This email is already registered",
      });
    }
    throw err;
  }
};

// Used by the passport local strategy. Returns the user or null.
export const verifyCredentials = async (email: string, password: string) => {
  const user = await db.user.findUnique({ where: { email } });

  const match = await bcrypt.compare(password, user ? user.passwordHash : DUMMY_HASH);

  if (!user || !match) return null;

  return { id: user.id, email: user.email };
};

export const getUserById = (id: string | number) =>
  db.user.findUnique({
    where: { id: id as never }, // remove the cast if your id type matches
    select: { id: true, email: true },
  });
