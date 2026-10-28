import { Router } from "express";
import {
  getSession,
  googleLogin,
  login,
  logout,
  oauthCallback,
  register,
} from "../controllers/auth-controller.js";
import { optionalAuth } from "../middleware/auth-middleware.js";
import { authRateLimiter } from "../middleware/security.js";

const router = Router();

router.post("/register", authRateLimiter, register);
router.post("/login", authRateLimiter, login);
router.post("/google", authRateLimiter, googleLogin);
router.get("/callback", oauthCallback);
router.get("/me", optionalAuth, getSession);
router.post("/logout", logout);

export default router;
