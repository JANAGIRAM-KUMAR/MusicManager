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

const router = Router();

router.get("/", protectRoute, getMyPlaylists);
router.post("/", protectRoute, createPlaylist);

router.get("/:playlistId", protectRoute, getPlaylistById);
router.patch("/:playlistId", protectRoute, updatePlaylist);
router.delete("/:playlistId", protectRoute, deletePlaylist);

router.post("/:playlistId/songs", protectRoute, addSongToPlaylist);
router.delete("/:playlistId/songs/:songId", protectRoute, removeSongFromPlaylist);
router.put("/:playlistId/reorder", protectRoute, reorderPlaylist);

export default router;
