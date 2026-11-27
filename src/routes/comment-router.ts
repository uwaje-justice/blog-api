import { Router } from "express";

import { commentController } from "../controllers/index.js";
import { requireAuth, validate } from "../middleware/index.js";
import { commentIdValidator, updateCommentValidator } from "../validators/index.js";

const router = Router();

router.patch(
  "/:id",
  requireAuth,
  updateCommentValidator,
  validate,
  commentController.updateComment,
);
router.delete("/:id", requireAuth, commentIdValidator, validate, commentController.deleteComment);

export default router;
