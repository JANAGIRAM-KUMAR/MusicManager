import { Router } from "express";
import { protectRoute } from "../middleware/auth-middleware.js";
import {
  getLikedSongs,
  getLikedSongIds,
  toggleLike,
} from "../controllers/like-controller.js";
import { validateObjectId } from "../middleware/security.js";

const router = Router();

router.get("/", protectRoute, getLikedSongs);
router.get("/ids", protectRoute, getLikedSongIds);
router.post("/:songId", protectRoute, validateObjectId("songId"), toggleLike);

export default router;
