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
import { securityHeaders, apiRateLimiter } from './middleware/security.js';


const app = express();
const __dirname = path.resolve();
const PORT = process.env.PORT || 6001;

app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(securityHeaders);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  process.env.FRONTEND_URL,
  process.env.CLIENT_URL,
  "https://sound-wave-oe1z.onrender.com",
  "https://musicmanager-0zsf.onrender.com",
].filter(Boolean).flatMap((o) => o.split(",").map((x) => x.trim()).filter(Boolean));

const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;
  if (process.env.NODE_ENV !== "production") {
    if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return true;
  }
  return false;
};

app.use(
  cors({
    origin(origin, callback) {
      if (isAllowedOrigin(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie", "X-Requested-With"],
  })
);

app.use(fileupload({ // Middleware to handle file uploads
    useTempFiles: true,
    tempFileDir: path.join(__dirname,"tmp"),
    createParentPath: true,
    limits:{ fileSize: 50 * 1024 * 1024} // 50 MB total limit, per-file limits enforced in controller
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

// Rate limit all API routes (health check excluded for uptime monitors)
app.use("/api", apiRateLimiter);

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
  const clientPath = path.resolve(__dirname, '../frontend/dist');
  app.use('/assets', express.static(path.join(clientPath, 'assets')));
  app.use(express.static(clientPath));

  app.use((req, res) => {
    if (req.path.startsWith('/api/')) {
      res.status(404).json({ success: false, message: 'Not Found' });
      return;
    }
    res.sendFile(path.join(clientPath, 'index.html'));
  });
} else {
  app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Not Found' });
  });
}

app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  // Handle Mongoose CastError (invalid ObjectId)
  if (err.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: `Invalid format for resource identifier '${err.path || "id"}'.`,
    });
  }

  // Handle Mongoose validation errors
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors || {}).map((e) => e.message);
    return res.status(400).json({
      success: false,
      message: messages.join(", ") || "Validation error",
    });
  }

  // Handle duplicate key error (MongoDB 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || "field";
    return res.status(409).json({
      success: false,
      message: `A record with this ${field} already exists.`,
    });
  }

  const statusCode = err.status || err.statusCode || 500;
  if (statusCode >= 500) {
    console.error("Unhandled error:", err);
  }

  if (req.path.startsWith('/api/')) {
    const isDev = process.env.NODE_ENV === 'development';
    return res.status(statusCode).json({
      success: false,
      message: isDev || statusCode < 500 ? err.message : 'Internal Server Error',
    });
  }

  res.status(statusCode).send('Internal Server Error');
});

app.listen(PORT, () => {
  console.log(`Server is live at http://localhost:${PORT}`);
  connectDatabase();
});
