import express from "express";
import mongoose from "mongoose";
import { configDotenv } from "dotenv";
import { authRoutes } from "./routes/auth-routes";
import cors from "cors";
import http from "http";
import { userRoutes } from "./routes/user-routes";
import passport from "./auth/passport-config";
import { MONGO_URL } from "./constants/mongo-url";
import { sessionRoutes } from "./routes/session-routes";
import { initSocket } from "./config/socket";

const PORT = 4000;
configDotenv();
const app = express();
const server = http.createServer(app);

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);
app.use(express.json());
app.use(passport.initialize());
initSocket(server);

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/session", sessionRoutes);

mongoose.connect(MONGO_URL).then(() => {
  server.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
  });

  console.log("Connected to MongoDB");
});
