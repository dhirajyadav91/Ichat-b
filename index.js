import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/database.js";
import userRoute from "./routes/userRoute.js";
import messageRoute from "./routes/messageRoute.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import { app, server } from "./socket/socket.js";

dotenv.config();
const PORT = process.env.PORT || 8080;

// ✅ CORS before all routes
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:3000"],
    credentials: true, // ✅ allows cookies
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

// ✅ Now middleware
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Debug log
console.log("🌐 CORS Enabled for: http://localhost:5173 & 3000");

// ✅ Routes
app.use("/api/v1/user", userRoute);
app.use("/api/v1/message", messageRoute);

app.get("/", (req, res) => res.send("✅ API is running successfully..."));

server.listen(PORT, async () => {
  await connectDB();
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
