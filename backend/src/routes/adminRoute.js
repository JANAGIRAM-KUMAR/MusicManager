import {Router} from 'express';
import { createSong, deleteSong, createAlbum, deleteAlbum, checkAdmin } from '../controllers/admin-controller.js';
import { protectRoute, isAdminUser } from '../middleware/auth-middleware.js';
const router = Router();

router.get('/check', protectRoute, isAdminUser, checkAdmin);

router.post('/songs', protectRoute, isAdminUser, createSong);
router.delete('/songs/:id', protectRoute, isAdminUser, deleteSong);

router.post('/albums', protectRoute, isAdminUser, createAlbum);
router.delete('/albums/:id', protectRoute, isAdminUser, deleteAlbum);

export default router;