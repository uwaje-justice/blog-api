import { Router } from "express";

import { postController } from "../controllers/index.js";
import { requireAuth, validate } from "../middleware/index.js";
import {
  createPostValidator,
  paginationValidator,
  postIdValidator,
  updatePostValidator,
} from "../validators/index.js";

const router = Router();

router.get("/", paginationValidator, validate, postController.getPublishedPosts);
router.get("/mine", requireAuth, paginationValidator, validate, postController.getMyPosts);
router.get("/:id", postIdValidator, validate, postController.getPost);

router.post("/", requireAuth, createPostValidator, validate, postController.createPost);
router.patch(
  "/:id",
  requireAuth,
  postIdValidator,
  updatePostValidator,
  validate,
  postController.updatePost,
);
router.delete("/:id", requireAuth, postIdValidator, validate, postController.deletePost);

export default router;
