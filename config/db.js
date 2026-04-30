const mongoose = require("mongoose");

const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri || uri === "your_mongodb_url") {
    console.warn("[db] MONGO_URI is not set — DB-backed routes will fail until you add a real URI to .env");
    return;
  }

  try {
    mongoose.set("strictQuery", true);
    await mongoose.connect(uri);
    console.log(`[db] MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
  } catch (err) {
    console.error("[db] MongoDB connection error:", err.message);
  }
};

module.exports = connectDB;
