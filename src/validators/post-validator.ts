import { body, param, query } from "express-validator";

export const postIdValidator = [
  param("id").isString().trim().notEmpty().withMessage("Invalid post id"),
];

export const paginationValidator = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer")
    .bail()
    .toInt(),

  query("pageSize")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Page size must be between 1 and 100")
    .bail()
    .toInt(),
];

export const createPostValidator = [
  body("title")
    .isString()
    .withMessage("Title must be a string")
    .bail()
    .trim()
    .isLength({ min: 1, max: 150 })
    .withMessage("Title must be 1 to 150 characters"),

  body("content")
    .isString()
    .withMessage("Content must be a string")
    .bail()
    .trim()
    .isLength({ min: 1, max: 50000 })
    .withMessage("Content must be 1 to 50000 characters"),

  body("published")
    .optional()
    .isBoolean({ strict: true })
    .withMessage("Published must be true or false"),
];

export const updatePostValidator = [
  body("title")
    .optional()
    .isString()
    .withMessage("Title must be a string")
    .bail()
    .trim()
    .isLength({ min: 1, max: 150 })
    .withMessage("Title must be 1 to 150 characters"),

  body("content")
    .optional()
    .isString()
    .withMessage("Content must be a string")
    .bail()
    .trim()
    .isLength({ min: 1, max: 50000 })
    .withMessage("Content must be 1 to 50000 characters"),

  body("published")
    .optional()
    .isBoolean({ strict: true })
    .withMessage("Published must be true or false"),

  body().custom((value) => {
    const hasField = ["title", "content", "published"].some((key) => key in value);
    if (!hasField) throw new Error("Provide at least one field to update");
    return true;
  }),
];
