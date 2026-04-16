/**
 * Playlist Routes
 * Handles: creating, reading, updating, deleting playlists
 *
 * Routes:
 * GET    /api/playlists          - Get user's playlists
 * POST   /api/playlists          - Create new playlist
 * GET    /api/playlists/:id      - Get single playlist with songs
 * DELETE /api/playlists/:id      - Delete playlist
 * POST   /api/playlists/:id/songs - Add song to playlist
 * DELETE /api/playlists/:id/songs/:songId - Remove song from playlist
 */

const express = require("express");
const Playlist = require("../models/Playlist");
const Song = require("../models/Song");
const { protect } = require("../middleware/auth");

const router = express.Router();

// All playlist routes require login
router.use(protect);

// ==================== GET ALL USER PLAYLISTS ====================
// GET /api/playlists
router.get("/", async (req, res) => {
  try {
    const playlists = await Playlist.find({ owner: req.user._id })
      .populate("songs", "title artist thumbnail duration") // Get basic song info
      .sort({ createdAt: -1 });

    res.json({ success: true, playlists });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ==================== CREATE PLAYLIST ====================
// POST /api/playlists
router.post("/", async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name || name.trim() === "") {
      return res.status(400).json({ success: false, message: "Playlist name is required" });
    }

    const playlist = await Playlist.create({
      name: name.trim(),
      description: description?.trim(),
      owner: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: `Playlist "${name}" created!`,
      playlist,
    });
  } catch (error) {
    console.error("Create playlist error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ==================== GET SINGLE PLAYLIST ====================
// GET /api/playlists/:id
router.get("/:id", async (req, res) => {
  try {
    const playlist = await Playlist.findById(req.params.id)
      .populate("songs") // Get full song details
      .populate("owner", "name"); // Get owner's name

    if (!playlist) {
      return res.status(404).json({ success: false, message: "Playlist not found" });
    }

    // Check if user owns this playlist
    if (!playlist.owner._id.equals(req.user._id)) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    res.json({ success: true, playlist });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ==================== DELETE PLAYLIST ====================
// DELETE /api/playlists/:id
router.delete("/:id", async (req, res) => {
  try {
    const playlist = await Playlist.findById(req.params.id);

    if (!playlist) {
      return res.status(404).json({ success: false, message: "Playlist not found" });
    }

    // Only owner can delete their playlist
    if (!playlist.owner.equals(req.user._id)) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    await Playlist.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: "Playlist deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ==================== ADD SONG TO PLAYLIST ====================
// POST /api/playlists/:id/songs
router.post("/:id/songs", async (req, res) => {
  try {
    const { songId } = req.body;

    if (!songId) {
      return res.status(400).json({ success: false, message: "Song ID is required" });
    }

    const playlist = await Playlist.findById(req.params.id);

    if (!playlist) {
      return res.status(404).json({ success: false, message: "Playlist not found" });
    }

    if (!playlist.owner.equals(req.user._id)) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    // Check if song exists
    const song = await Song.findById(songId);
    if (!song) {
      return res.status(404).json({ success: false, message: "Song not found" });
    }

    // Check if song is already in playlist
    if (playlist.songs.includes(songId)) {
      return res.status(400).json({
        success: false,
        message: "Song is already in this playlist",
      });
    }

    playlist.songs.push(songId);
    await playlist.save();

    res.json({
      success: true,
      message: `"${song.title}" added to playlist!`,
      playlist,
    });
  } catch (error) {
    console.error("Add song to playlist error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ==================== REMOVE SONG FROM PLAYLIST ====================
// DELETE /api/playlists/:id/songs/:songId
router.delete("/:id/songs/:songId", async (req, res) => {
  try {
    const playlist = await Playlist.findById(req.params.id);

    if (!playlist) {
      return res.status(404).json({ success: false, message: "Playlist not found" });
    }

    if (!playlist.owner.equals(req.user._id)) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    playlist.songs = playlist.songs.filter(
      (id) => !id.equals(req.params.songId)
    );

    await playlist.save();

    res.json({ success: true, message: "Song removed from playlist" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
