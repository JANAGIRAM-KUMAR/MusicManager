import { Router } from "express";
import { search, getArtists, getArtistByName } from "../controllers/browse-controller.js";

const router = Router();

router.get("/", search);
router.get("/artists", getArtists);
router.get("/artists/:artistName", getArtistByName);

export default router;
