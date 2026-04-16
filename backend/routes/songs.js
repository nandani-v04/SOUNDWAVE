/**
 * Songs Routes
 * Handles: getting songs, searching, liking, tracking play count
 *
 * Routes:
 * GET    /api/songs          - Get all songs
 * GET    /api/songs/search   - Search songs
 * GET    /api/songs/popular  - Get most played songs
 * GET    /api/songs/:id      - Get single song
 * POST   /api/songs/:id/like - Like/unlike a song
 * POST   /api/songs/:id/play - Increment play count
 */

const express = require("express");
const Song = require("../models/Song");
const User = require("../models/User");
const { protect } = require("../middleware/auth");

const router = express.Router();

// ==================== GET ALL SONGS ====================
// GET /api/songs
router.get("/", async (req, res) => {
  try {
    // Get all songs, newest first
    const songs = await Song.find()
      .sort({ createdAt: -1 })
      .select("-__v"); // Exclude version field

    res.json({
      success: true,
      count: songs.length,
      songs,
    });
  } catch (error) {
    console.error("Get songs error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ==================== SEARCH SONGS ====================
// GET /api/songs/search?q=searchterm
router.get("/search", async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim() === "") {
      return res.json({ success: true, songs: [] });
    }

    // Search in title, artist, and genre fields (case-insensitive)
    const songs = await Song.find({
      $or: [
        { title: { $regex: q, $options: "i" } },   // i = case insensitive
        { artist: { $regex: q, $options: "i" } },
        { genre: { $regex: q, $options: "i" } },
      ],
    }).limit(20); // Max 20 results

    res.json({ success: true, count: songs.length, songs });
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ==================== MOST POPULAR SONGS ====================
// GET /api/songs/popular
router.get("/popular", async (req, res) => {
  try {
    // Sort by play count descending, get top 10
    const songs = await Song.find()
      .sort({ playCount: -1 })
      .limit(10);

    res.json({ success: true, songs });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ==================== GET SINGLE SONG ====================
// GET /api/songs/:id
router.get("/:id", async (req, res) => {
  try {
    const song = await Song.findById(req.params.id);

    if (!song) {
      return res.status(404).json({ success: false, message: "Song not found" });
    }

    res.json({ success: true, song });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ==================== LIKE / UNLIKE SONG ====================
// POST /api/songs/:id/like  (requires login)
router.post("/:id/like", protect, async (req, res) => {
  try {
    const song = await Song.findById(req.params.id);
    const user = await User.findById(req.user._id);

    if (!song) {
      return res.status(404).json({ success: false, message: "Song not found" });
    }

    const userId = req.user._id;
    const isLiked = song.likes.includes(userId);

    if (isLiked) {
      // Already liked -> UNLIKE it
      song.likes = song.likes.filter((id) => !id.equals(userId));
      user.likedSongs = user.likedSongs.filter((id) => !id.equals(song._id));
    } else {
      // Not liked -> LIKE it
      song.likes.push(userId);
      user.likedSongs.push(song._id);
    }

    await song.save();
    await user.save();

    res.json({
      success: true,
      liked: !isLiked,
      likeCount: song.likes.length,
      message: isLiked ? "Song removed from liked songs" : "Song added to liked songs",
    });
  } catch (error) {
    console.error("Like error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ==================== INCREMENT PLAY COUNT ====================
// POST /api/songs/:id/play  (requires login)
router.post("/:id/play", protect, async (req, res) => {
  try {
    const song = await Song.findByIdAndUpdate(
      req.params.id,
      { $inc: { playCount: 1 } }, // Increment playCount by 1
      { new: true }
    );

    if (!song) {
      return res.status(404).json({ success: false, message: "Song not found" });
    }

    // Add to user's recently played list
    const user = await User.findById(req.user._id);

    // Remove this song if it already exists in recent history (avoid duplicates)
    user.recentlyPlayed = user.recentlyPlayed.filter(
      (item) => !item.song.equals(song._id)
    );

    // Add to beginning of recently played
    user.recentlyPlayed.unshift({
      song: song._id,
      playedAt: new Date(),
    });

    // Keep only last 20 songs in history
    user.recentlyPlayed = user.recentlyPlayed.slice(0, 20);

    await user.save();

    res.json({ success: true, playCount: song.playCount });
  } catch (error) {
    console.error("Play count error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
