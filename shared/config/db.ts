import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || "mongodb://root:example@localhost:27017/iwf?authSource=admin";
    await mongoose.connect(mongoURI);
    console.log(`✅ MongoDB Connected successfully`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error:`, error);
    process.exit(1);
  }
};
