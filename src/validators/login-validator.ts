import { body } from "express-validator";

const loginValidator = [
  body("email").trim().toLowerCase().isEmail().withMessage("Must be a valid email address"),

  body("password")
    .isString()
    .withMessage("Password must be a string")
    .bail()
    .notEmpty()
    .withMessage("Password is required"),
];

export default loginValidator;
