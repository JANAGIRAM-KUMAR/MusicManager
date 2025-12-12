import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

import userRoute from './routes/userRoute.js';
import authRoute from './routes/authRoute.js';
import adminRoute from './routes/adminROute.js';
import songRoute from './routes/songRoute.js';
import albumRoute from './routes/albumRoute.js';
import statsRoute from './routes/statsRoute.js';

import { connectDatabase } from './lib/database.js';


const app = express();
const PORT = process.env.PORT || 6001;

app.use(express.json());
app.use(cors());

app.use("/api/users", userRoute);
app.use("/api/auth", authRoute);
app.use("/api/admin", adminRoute);
app.use("/api/songs", songRoute);
app.use("/api/albums", albumRoute);
app.use("/api/stats", statsRoute);

app.listen(PORT, () => {
  console.log(`Server is live at http://localhost:${PORT}`);
  connectDatabase();
});
