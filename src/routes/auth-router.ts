import { Router } from "express";

import { authController } from "../controllers/index.js";
import { authLimiter } from "../lib/index.js";
import { requireAuth, validate } from "../middleware/index.js";
import { loginValidator, registerValidator } from "../validators/index.js";

const router = Router();

router.post("/register", authLimiter, registerValidator, validate, authController.register);
router.post("/login", authLimiter, loginValidator, validate, authController.login);
router.post("/logout", authController.logout);
router.get("/me", requireAuth, authController.getMe);

export default router;
