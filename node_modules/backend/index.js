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

const allowedOrigins = [
  process.env.FRONTEND_BASE_URL,
  "http://localhost:5173",
  "http://localhost:3000",
].filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);


// ✅ Middlewares
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

console.log("🌐 CORS Enabled for:", allowedOrigins);

// ✅ Routes
app.use("/api/v1/user", userRoute);
app.use("/api/v1/message", messageRoute);

// ✅ Root endpoint
app.get("/", (req, res) => res.send("✅ API is running successfully..."));

// ✅ Start server
server.listen(PORT, async () => {
  await connectDB();
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
