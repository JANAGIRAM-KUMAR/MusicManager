import mongoose from 'mongoose';

const connectDatabase = async () => {
  try {
    const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!uri) {
      console.error("Error connecting to MongoDB: MONGO_URI not configured");
      return;
    }
    const con = await mongoose.connect(uri);
    console.log(`MongoDB connected: ${con.connection.host}`);
  }
  catch (err) {
    console.error("Error connecting to MongoDB:", err.message || err);
    // Don't exit in dev - allow server to run without DB for auth/UI testing
  }
};

export { connectDatabase };
    