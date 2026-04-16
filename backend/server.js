/**
 * SoundWave - Main Server File
 * This is the entry point of our backend application.
 * It sets up Express, connects to MongoDB, and loads all routes.
 */

// Load environment variables from .env file
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const authRoutes = require("./routes/auth");
const songRoutes = require("./routes/songs");
const userRoutes = require("./routes/users");
const playlistRoutes = require("./routes/playlists");
const adminRoutes = require("./routes/admin");

const app = express();

process.env.JWT_SECRET = process.env.JWT_SECRET || "soundwave_jwt_secret_2024";
process.env.ADMIN_SECRET = process.env.ADMIN_SECRET || "soundwave_admin_secret_2024";
process.env.MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/soundwave";

app.use(cors());
app.options("*", cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
app.use(express.static(path.join(__dirname, "../frontend")));

app.use("/api/auth", authRoutes);
app.use("/api/songs", songRoutes);
app.use("/api/users", userRoutes);
app.use("/api/playlists", playlistRoutes);
app.use("/api/admin", adminRoutes);

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB!"))
  .catch((err) => console.error("❌ MongoDB error:", err.message));

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`✅ SOUNDWAVE running at http://localhost:${PORT}`);
  console.log(`👉 Open: http://localhost:${PORT}/signup.html`);
});