import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';


import cookieParser from 'cookie-parser';
import { connectDatabase } from './lib/database.js';
import fileupload from 'express-fileupload';
import path from 'path';

import userRoute from './routes/userRoute.js';
import authRoute from './routes/authRoute.js';
import adminRoute from './routes/adminRoute.js';
import songRoute from './routes/songRoute.js';
import albumRoute from './routes/albumRoute.js';
import statsRoute from './routes/statsRoute.js';
import playlistRoute from './routes/playlistRoute.js';
import likeRoute from './routes/likeRoute.js';
import browseRoute from './routes/browseRoute.js';
import historyRoute from './routes/historyRoute.js';
import lyricsRoute from './routes/lyricsRoute.js';
import cron from 'node-cron';
import fs from 'fs';


const app = express();
const __dirname = path.resolve();
const PORT = process.env.PORT || 6001;

app.set("trust proxy", 1);
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error("Origin not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(fileupload({ // Middleware to handle file uploads
    useTempFiles: true,
    tempFileDir: path.join(__dirname,"tmp"),
    createParentPath: true,
    limits:{ fileSize: 5 * 1024 * 1024} // 5 MB file size limit
})); 

//cron jobs

const tempDir = path.join(process.cwd(), 'tmp');
cron.schedule("0 * * * *", () => {
  if(fs.existsSync(tempDir)){
    fs.readdir(tempDir, (err, files) => {
      if(err){
        console.error(err);
        return;
      }
      for (const file of files) {
        try {
          fs.unlinkSync(path.join(tempDir, file));
        } catch (e) {
          // ignore
        }
      }
    });
  }
});

// Keep-alive for Render free tier
if (process.env.RENDER_EXTERNAL_URL || process.env.APP_URL) {
  const keepAliveUrl = process.env.RENDER_EXTERNAL_URL || process.env.APP_URL;
  cron.schedule("*/14 * * * *", async () => {
    try {
      const url = new URL(keepAliveUrl);
      const http = await import(url.protocol === "https:" ? "https" : "http");
      http.default.get(url, (res) => {
        res.resume();
      }).on("error", () => {});
    } catch (e) {
      // ignore
    }
  });
} else {
  cron.schedule("*/14 * * * *", () => {
    // Self-ping disabled if no external URL configured
  });
}


app.get("/api/health", (_req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.status(200).json({ status: "ok", uptime: process.uptime() });
});

app.use("/api/users", userRoute);
app.use("/api/auth", authRoute);
app.use("/api/admin", adminRoute);
app.use("/api/songs", songRoute);
app.use("/api/albums", albumRoute);
app.use("/api/stats", statsRoute);
app.use("/api/playlists", playlistRoute);
app.use("/api/likes", likeRoute);
app.use("/api/browse", browseRoute);
app.use("/api/history", historyRoute);
app.use("/api/lyrics", lyricsRoute);

if (process.env.NODE_ENV === 'production') {
  const clientPath = path.resolve(process.cwd(), 'frontend/dist');
  app.use(express.static(clientPath));

  app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) {
      return next();
    }
    res.sendFile(path.join(clientPath, 'index.html'));
  });
}

app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({success: false, message: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error'});
});

app.listen(PORT, () => {
  console.log(`Server is live at http://localhost:${PORT}`);
  connectDatabase();
});
