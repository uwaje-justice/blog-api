import { body, param } from "express-validator";

export const commentPostIdValidator = [
  param("postId").isString().trim().notEmpty().withMessage("Invalid post id"),
];

export const commentIdValidator = [
  param("id").isString().trim().notEmpty().withMessage("Invalid comment id"),
];

export const createCommentValidator = [
  ...commentPostIdValidator,
  body("email")
    .optional()
    .isEmail()
    .withMessage("Must be a valid email address")
    .bail()
    .isLength({ max: 255 })
    .withMessage("Email is too long"),
  body("text")
    .isString()
    .withMessage("Text must be a string")
    .bail()
    .trim()
    .isLength({ min: 1, max: 5000 })
    .withMessage("Text must be 1 to 5000 characters"),
];

export const updateCommentValidator = [
  ...commentIdValidator,
  body("text")
    .isString()
    .withMessage("Text must be a string")
    .bail()
    .trim()
    .isLength({ min: 1, max: 5000 })
    .withMessage("Text must be 1 to 5000 characters"),
];
