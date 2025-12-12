import {Router} from 'express';
import { createSong, deleteSong, createAlbum, deleteAlbum, checkAdmin } from '../controllers/admin-controller.js';
import { protectRoute, isAdminUser } from '../middleware/auth-middleware.js';
const router = Router();

// optimized code for middleware
router.use(protectRoute, isAdminUser);

router.get('/check', checkAdmin);

router.post('/songs', createSong);
router.delete('/songs/:id', deleteSong);

router.post('/albums', createAlbum);
router.delete('/albums/:id', deleteAlbum);

export default router;