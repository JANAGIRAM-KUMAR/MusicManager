import { Router } from 'express';
import { isAdminUser, protectRoute } from '../middleware/auth-middleware.js';
import { getAllSongs, getFeaturedSongs, getMadeForYouSongs, getTrendingSongs, getSongById } from '../controllers/song-controller.js';
import { validateObjectId } from '../middleware/security.js';

const router = Router();

router.get('/', protectRoute, isAdminUser, getAllSongs);
router.get('/featured', getFeaturedSongs);
router.get('/made-for-you', getMadeForYouSongs);
router.get('/trending', getTrendingSongs);
router.get('/:songId', validateObjectId('songId'), getSongById);

export default router;