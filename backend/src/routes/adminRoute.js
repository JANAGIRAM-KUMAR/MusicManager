import {Router} from 'express';
import {
  createSong,
  deleteSong,
  updateSong,
  createAlbum,
  updateAlbum,
  deleteAlbum,
  addSongsToAlbum,
  removeSongFromAlbum,
  getAllPlaylistsAdmin,
  deletePlaylistAdmin,
  checkAdmin,
} from '../controllers/admin-controller.js';
import { getAllUsersAdmin, deleteUser } from '../controllers/admin-users-controller.js';
import { protectRoute, isAdminUser } from '../middleware/auth-middleware.js';
const router = Router();

// optimized code for middleware
router.use(protectRoute, isAdminUser);

router.get('/check', checkAdmin);
router.get('/users', getAllUsersAdmin);
router.delete('/users/:id', deleteUser);

router.post('/songs', createSong);
router.put('/songs/:id', updateSong);
router.delete('/songs/:id', deleteSong);

router.post('/albums', createAlbum);
router.put('/albums/:id', updateAlbum);
router.delete('/albums/:id', deleteAlbum);
router.post('/albums/:id/songs', addSongsToAlbum);
router.delete('/albums/:id/songs/:songId', removeSongFromAlbum);

router.get('/playlists', getAllPlaylistsAdmin);
router.delete('/playlists/:id', deletePlaylistAdmin);

export default router;