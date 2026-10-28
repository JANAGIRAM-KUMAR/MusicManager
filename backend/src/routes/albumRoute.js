import { Router } from 'express';
import { getAlbums, getAlbumById } from '../controllers/album-controller.js';
import { validateObjectId } from '../middleware/security.js';

const router = Router();

router.get("/", getAlbums);
router.get("/:albumId", validateObjectId('albumId'), getAlbumById);

export default router;