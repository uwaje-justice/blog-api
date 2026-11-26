import { Router } from "express";

import { authController } from "../controllers/index.js";
import { requireAuth, validate } from "../middleware/index.js";
import { loginValidator, registerValidator } from "../validators/index.js";

const router = Router();

router.post("/register", registerValidator, validate, authController.register);
router.post("/login", loginValidator, validate, authController.login);
router.post("/logout", authController.logout);
router.get("/me", requireAuth, authController.getMe);

export default router;
