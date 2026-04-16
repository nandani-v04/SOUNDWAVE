/**
 * Admin Routes
 * Only accessible by users with role='admin'
 *
 * Routes:
 * GET    /api/admin/stats       - Dashboard stats (user count, song count)
 * POST   /api/admin/songs       - Upload new song
 * PUT    /api/admin/songs/:id   - Edit song details
 * DELETE /api/admin/songs/:id   - Delete song
 * GET    /api/admin/users       - List all users
 */

const express = require("express");
const fs = require("fs");
const path = require("path");
const Song = require("../models/Song");
const User = require("../models/User");
const { protect, adminOnly } = require("../middleware/auth");
const { uploadSongWithThumbnail } = require("../middleware/upload");

const router = express.Router();

// All admin routes require: login + admin role
router.use(protect, adminOnly);

// ==================== DASHBOARD STATS ====================
// GET /api/admin/stats
router.get("/stats", async (req, res) => {
  try {
    // Count users and songs in parallel (faster than sequential)
    const [totalUsers, totalSongs, totalPlays, recentSongs] = await Promise.all([
      User.countDocuments({ role: "user" }),
      Song.countDocuments(),
      Song.aggregate([{ $group: { _id: null, total: { $sum: "$playCount" } } }]),
      Song.find().sort({ createdAt: -1 }).limit(5), // 5 most recent songs
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalSongs,
        totalPlays: totalPlays[0]?.total || 0,
        recentSongs,
      },
    });
  } catch (error) {
    console.error("Stats error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ==================== UPLOAD SONG ====================
// POST /api/admin/songs
// Accepts: song (MP3) + thumbnail (image) + title + artist + genre
router.post(
  "/songs",
  uploadSongWithThumbnail.fields([
    { name: "song", maxCount: 1 },        // The MP3 file
    { name: "thumbnail", maxCount: 1 },   // The cover image
  ]),
  async (req, res) => {
    try {
      const { title, artist, genre, duration } = req.body;

      // Validate required fields
      if (!title || !artist || !genre) {
        return res.status(400).json({
          success: false,
          message: "Title, artist, and genre are required",
        });
      }

      // Check if song file was uploaded
      if (!req.files || !req.files.song) {
        return res.status(400).json({
          success: false,
          message: "Please upload an MP3 song file",
        });
      }

      // Build file paths
      const songPath = `/uploads/songs/${req.files.song[0].filename}`;
      const thumbnailPath = req.files.thumbnail
        ? `/uploads/thumbnails/${req.files.thumbnail[0].filename}`
        : null;

      // Create song in database
      const song = await Song.create({
        title: title.trim(),
        artist: artist.trim(),
        genre: genre.trim(),
        duration: duration ? parseInt(duration) : 0,
        filePath: songPath,
        thumbnail: thumbnailPath,
        uploadedBy: req.user._id,
      });

      res.status(201).json({
        success: true,
        message: `"${title}" uploaded successfully!`,
        song,
      });
    } catch (error) {
      console.error("Upload song error:", error);
      res.status(500).json({ success: false, message: "Server error during upload" });
    }
  }
);

// ==================== EDIT SONG ====================
// PUT /api/admin/songs/:id
router.put("/songs/:id", async (req, res) => {
  try {
    const { title, artist, genre } = req.body;
    const updateData = {};

    // Only update fields that were provided
    if (title) updateData.title = title.trim();
    if (artist) updateData.artist = artist.trim();
    if (genre) updateData.genre = genre.trim();

    const song = await Song.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!song) {
      return res.status(404).json({ success: false, message: "Song not found" });
    }

    res.json({
      success: true,
      message: "Song updated successfully",
      song,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ==================== DELETE SONG ====================
// DELETE /api/admin/songs/:id
router.delete("/songs/:id", async (req, res) => {
  try {
    const song = await Song.findById(req.params.id);

    if (!song) {
      return res.status(404).json({ success: false, message: "Song not found" });
    }

    // Delete the actual files from disk
    const songFilePath = path.join(__dirname, "../../", song.filePath);
    if (fs.existsSync(songFilePath)) {
      fs.unlinkSync(songFilePath); // Delete MP3
    }

    if (song.thumbnail) {
      const thumbFilePath = path.join(__dirname, "../../", song.thumbnail);
      if (fs.existsSync(thumbFilePath)) {
        fs.unlinkSync(thumbFilePath); // Delete thumbnail
      }
    }

    // Delete from database
    await Song.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: `"${song.title}" deleted successfully` });
  } catch (error) {
    console.error("Delete song error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ==================== GET ALL USERS ====================
// GET /api/admin/users
router.get("/users", async (req, res) => {
  try {
    const users = await User.find({ role: "user" })
      .select("-password")
      .sort({ createdAt: -1 });

    res.json({ success: true, count: users.length, users });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ==================== GET ALL SONGS (Admin view) ====================
// GET /api/admin/songs
router.get("/songs", async (req, res) => {
  try {
    const songs = await Song.find()
      .populate("uploadedBy", "name email")
      .sort({ createdAt: -1 });

    res.json({ success: true, count: songs.length, songs });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
