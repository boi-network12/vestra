require("dotenv").config(); // Load environment variables from .env file
const mongoose = require("mongoose");

const connectDb = async () => {
  try {
    // Set Mongoose options (optional, as some are deprecated in newer versions)
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // Remove deprecated options
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn; // Return the connection object
  } catch (err) {
    console.error("❌ MongoDB Connection Error:", err);
    process.exit(1); // Exit process on failure
  }
};

// Listen for connection events to handle disconnections
mongoose.connection.on("disconnected", () => {
  console.log("⚠️ MongoDB Disconnected");
});

mongoose.connection.on("error", (err) => {
  console.error("⚠️ MongoDB Error:", err);
});

module.exports = connectDb;