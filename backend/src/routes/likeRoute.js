import { Router } from "express";
import { protectRoute } from "../middleware/auth-middleware.js";
import {
  getLikedSongs,
  getLikedSongIds,
  toggleLike,
} from "../controllers/like-controller.js";

const router = Router();

router.get("/", protectRoute, getLikedSongs);
router.get("/ids", protectRoute, getLikedSongIds);
router.post("/:songId", protectRoute, toggleLike);

export default router;
