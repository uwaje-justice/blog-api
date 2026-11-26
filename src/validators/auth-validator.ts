import { body } from "express-validator";

export const loginValidator = [
  body("email").trim().toLowerCase().isEmail().withMessage("Must be a valid email address"),

  body("password")
    .isString()
    .withMessage("Password must be a string")
    .bail()
    .notEmpty()
    .withMessage("Password is required"),
];

export const registerValidator = [
  body("email")
    .trim()
    .toLowerCase()
    .isEmail()
    .withMessage("Must be a valid email address")
    .bail()
    .isLength({ max: 255 })
    .withMessage("Email is too long"),

  body("password")
    .isString()
    .withMessage("Password must be a string")
    .bail()
    .isLength({ min: 8, max: 72 })
    .withMessage("Password must be 8 to 72 characters")
    .bail()
    .matches(/[a-zA-Z]/)
    .withMessage("Password must contain a letter")
    .bail()
    .matches(/\d/)
    .withMessage("Password must contain a number"),
];
