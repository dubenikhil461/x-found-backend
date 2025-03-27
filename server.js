import express from "express";
import dotenv from "dotenv";
import http from "http";
import cors from "cors";
import setupSocket from "./socket.js";

// Config imports
import connectDB from "./src/config/config.db.js";
import authRoutes from "./src/routes/authRoutes.js";
import itemRoutes from "./src/routes/itemRoutes.js";
import chatRoutes from "./src/routes/chatRoutes.js";

// Configure environment variables
dotenv.config();

// Connect to database
connectDB();

// Create Express app
const app = express();

// CORS configuration

app.use(
  cors({
    origin: [
      "http://localhost:3000",  // Local frontend (for development)
      "https://x-found.netlify.app"  // Deployed frontend
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Middleware
app.use(express.json());
app.use("/uploads", express.static("uploads"));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/items", itemRoutes);

//socket
const server = http.createServer(app);

// Initialize WebSocket
const io = setupSocket(server);
app.use("/api/chats", chatRoutes);

// Basic health check route
app.get("/", (req, res) => {
  res.send("API is running...");
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, "0.0.0.0", () =>
  console.log(`🚀 Server running on port ${PORT}`)
);

export { server, io };
