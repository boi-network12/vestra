const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDb = require("./config/db");
const { errorHandler } = require("./middleware/errorMiddleware");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const compression = require("compression");
const { createServer } = require("http");
const initializeSocket = require("./socket/socket");
const mongoose = require('mongoose'); 
const apiRoutes = require("./routes/routes");
const { schedulePermanentDelete } = require("./jobs/permanentDelete");

dotenv.config();

const app = express();
const httpServer = createServer(app);

require("./jobs/cleanupNotifications")

// Security Middleware
app.use(helmet());
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// // Rate Limiting
// const limiter = rateLimit({
//   windowMs: process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000, 
//   max: process.env.RATE_LIMIT_MAX || 10000,
// });
// app.use(limiter);


// compression
app.use(compression());


// Request Logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// Body Parsers
app.use(express.json({ limit: "50kb" }));
app.use(express.urlencoded({ extended: true, limit: "50kb" }));

// Initialize Socket.IO
initializeSocket(httpServer);


// Health Check Endpoint
app.get("/", (req, res) => {
  res.json({
    status: "running",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
  });
});

// API Routes (Add your routes here)
app.use("/api", apiRoutes);

// 404 Handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Not Found - ${req.method} ${req.originalUrl}`,
  });
});


// Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Start server only after MongoDB connection is established
const startServer = async () => {
  try {
    await connectDb(); // Wait for MongoDB connection
    if (process.env.ENABLE_PERMANENT_DELETE === 'true') {
      schedulePermanentDelete(); // Schedule cron job for permanent deletion
    } else {
      console.log('Permanent deletion cron job is disabled.');
    }
    httpServer.listen(PORT, () => {
      console.log(
        `🚗 Server running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`
      );
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
};

startServer();

// Handle Unhandled Promise Rejections
process.on("unhandledRejection", (err) => {
  console.error(`Unhandled Rejection: ${err.message}`);
  console.error(err.stack);
  httpServer.close(() => process.exit(1));
});

// Handle Uncaught Exceptions
process.on("uncaughtException", (err) => {
  console.error(`Uncaught Exception: ${err.message}`);
  console.error(err.stack);
  process.exit(1);
});

// Graceful Shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down gracefully...");
  httpServer.close(() => {
    console.log("Process terminated");
    mongoose.connection.close(false, () => {
      console.log("MongoDB connection closed");
      process.exit(0);
    });
  });
});

// Heartbeat for Debugging
setInterval(() => {
  console.log(`[${new Date().toString()}] Backend still alive`);
}, 60000); // Every 60 seconds