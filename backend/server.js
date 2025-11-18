// server.js
import express from "express";
import dotenv from "dotenv";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import morgan from "morgan";
import { clerkMiddleware } from "@clerk/express";

import connectDB from "./config/db.js";
import userRoutes from "./routes/userRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";
import regNumGenRoutes from "./routes/regNumGenRoutes.js";
import subjectAllocationRoutes from "./routes/subjectAllocationRoutes.js";

import subjectRoutes from "./routes/subjectRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// ------------------------------
// 🌐 Global Middleware
// ------------------------------
app.use(helmet());

// Enable CORS (Allow frontend domain or "*" for development)
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "*",
    credentials: true,
  })
);

app.use(compression());
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(morgan("dev"));

// Clerk authentication middleware
app.use(clerkMiddleware());

// ------------------------------
// 🚀 Health Check
// ------------------------------
app.get("/", (req, res) => {
  res.send("🚀 API server is running");
});

// ------------------------------
// 📌 Routes
// ------------------------------
app.use("/api/users", userRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/regnum", regNumGenRoutes);
app.use("/api/subject-allocations", subjectAllocationRoutes);

// ------------------------------
// ❌ Error Handler (MUST be last)
// ------------------------------
app.use((err, req, res, next) => {
  console.error("🔥 Error:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// ------------------------------
// 🛢️ Start Server
// ------------------------------
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
  });
});
