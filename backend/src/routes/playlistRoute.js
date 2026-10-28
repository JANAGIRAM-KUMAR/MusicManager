import { Router } from "express";
import { protectRoute } from "../middleware/auth-middleware.js";
import {
  getMyPlaylists,
  getPlaylistById,
  createPlaylist,
  updatePlaylist,
  deletePlaylist,
  addSongToPlaylist,
  removeSongFromPlaylist,
  reorderPlaylist,
} from "../controllers/playlist-controller.js";
import { validateObjectId } from "../middleware/security.js";

const router = Router();

router.get("/", protectRoute, getMyPlaylists);
router.post("/", protectRoute, createPlaylist);

router.get("/:playlistId", protectRoute, validateObjectId("playlistId"), getPlaylistById);
router.patch("/:playlistId", protectRoute, validateObjectId("playlistId"), updatePlaylist);
router.delete("/:playlistId", protectRoute, validateObjectId("playlistId"), deletePlaylist);

router.post("/:playlistId/songs", protectRoute, validateObjectId("playlistId"), addSongToPlaylist);
router.delete(
  "/:playlistId/songs/:songId",
  protectRoute,
  validateObjectId("playlistId", "songId"),
  removeSongFromPlaylist
);
router.put("/:playlistId/reorder", protectRoute, validateObjectId("playlistId"), reorderPlaylist);

export default router;
