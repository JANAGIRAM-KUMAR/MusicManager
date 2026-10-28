import { Router } from 'express';
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
import { validateObjectId, uploadRateLimiter } from '../middleware/security.js';

const router = Router();

// Protect all admin routes
router.use(protectRoute, isAdminUser);

router.get('/check', checkAdmin);
router.get('/users', getAllUsersAdmin);
router.delete('/users/:id', validateObjectId('id'), deleteUser);

router.post('/songs', uploadRateLimiter, createSong);
router.put('/songs/:id', validateObjectId('id'), updateSong);
router.delete('/songs/:id', validateObjectId('id'), deleteSong);

router.post('/albums', uploadRateLimiter, createAlbum);
router.put('/albums/:id', validateObjectId('id'), updateAlbum);
router.delete('/albums/:id', validateObjectId('id'), deleteAlbum);
router.post('/albums/:id/songs', validateObjectId('id'), addSongsToAlbum);
router.delete('/albums/:id/songs/:songId', validateObjectId('id', 'songId'), removeSongFromAlbum);

router.get('/playlists', getAllPlaylistsAdmin);
router.delete('/playlists/:id', validateObjectId('id'), deletePlaylistAdmin);

export default router;