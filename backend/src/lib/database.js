import mongoose from 'mongoose';

const connectDatabase = async () => {
  try {
    const con = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected: ${con.connection.host}`);
  }
  catch (err) {
    console.error("Error connecting to MongoDB:", err);
    process.exit(1);
  }
};

export { connectDatabase };
    