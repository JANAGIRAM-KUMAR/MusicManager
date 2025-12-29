import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';


import { clerkMiddleware } from '@clerk/express';
import { connectDatabase } from './lib/database.js';
import fileupload from 'express-fileupload';
import path from 'path';

import userRoute from './routes/userRoute.js';
import authRoute from './routes/authRoute.js';
import adminRoute from './routes/adminRoute.js';
import songRoute from './routes/songRoute.js';
import albumRoute from './routes/albumRoute.js';
import statsRoute from './routes/statsRoute.js';
import cron from 'node-cron';
import fs from 'fs';


const app = express();
const __dirname = path.resolve();
const PORT = process.env.PORT || 6001;

app.use(express.json());

app.use(cors({
  origin: "http://localhost:3000",
  credentials: true,
}
));

app.use(clerkMiddleware()); //  This will add Clerk-related info to req object => req.auth 

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
        fs.unlinkSync(path.join(tempDir, file), (err) => {});
      }
    });
  }
});


app.use("/api/users", userRoute);
app.use("/api/auth", authRoute);
app.use("/api/admin", adminRoute);
app.use("/api/songs", songRoute);
app.use("/api/albums", albumRoute);
app.use("/api/stats", statsRoute);

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));

  // Express 5 safe SPA fallback
  app.use((req, res) => {
    res.sendFile(
      path.join(__dirname, '../frontend/dist/index.html')
    );
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
