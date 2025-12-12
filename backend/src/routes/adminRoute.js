import {Router} from 'express';
import { createSong } from '../controllers/admin-controller.js';
import { protectRoute, isAdminUser } from '../middleware/auth-middleware.js';
const router = Router();

router.post('/songs', protectRoute, isAdminUser, createSong);

export default router;