import { Router } from "express";
import { protectRoute } from "../middleware/auth-middleware.js";
import { recordPlay, getRecentlyPlayed } from "../controllers/history-controller.js";

const router = Router();

router.get("/", protectRoute, getRecentlyPlayed);
router.post("/", protectRoute, recordPlay);

export default router;
