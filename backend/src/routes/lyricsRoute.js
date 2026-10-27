import { Router } from "express";
import { getLyrics } from "../controllers/lyrics-controller.js";

const router = Router();

router.get("/", getLyrics);

export default router;
