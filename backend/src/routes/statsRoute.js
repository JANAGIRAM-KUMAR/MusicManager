import {Router} from 'express';
import { getStats } from '../controllers/stats-controller.js';
import { isAdminUser, protectRoute } from '../middleware/auth-middleware.js';
const router = Router();

router.get('/',protectRoute, isAdminUser, getStats);

export default router;