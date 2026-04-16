/**
 * User Routes
 * Handles: profile, recently played, liked songs, change password, upload profile pic
 *
 * Routes:
 * GET    /api/users/profile          - Get user profile
 * PUT    /api/users/profile          - Update profile (name)
 * POST   /api/users/profile-picture  - Upload profile picture
 * PUT    /api/users/change-password  - Change password
 * GET    /api/users/recently-played  - Get recently played songs
 * GET    /api/users/liked-songs      - Get liked songs
 */

const express = require("express");
const User = require("../models/User");
const { protect } = require("../middleware/auth");
const { uploadProfile } = require("../middleware/upload");

const router = express.Router();

// All user routes require login
router.use(protect);

// ==================== GET PROFILE ====================
// GET /api/users/profile
router.get("/profile", async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select("-password")
      .populate("likedSongs"); // Get full song details, not just IDs

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ==================== UPDATE PROFILE ====================
// PUT /api/users/profile
router.put("/profile", async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || name.trim() === "") {
      return res.status(400).json({ success: false, message: "Name is required" });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name: name.trim() },
      { new: true, runValidators: true } // Return updated doc, run schema validators
    ).select("-password");

    res.json({
      success: true,
      message: "Profile updated successfully",
      user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ==================== UPLOAD PROFILE PICTURE ====================
// POST /api/users/profile-picture
router.post(
  "/profile-picture",
  uploadProfile.single("profilePicture"), // 'profilePicture' is the form field name
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: "Please upload an image" });
      }

      // Save the file path to user's profile
      const profilePicturePath = `/uploads/profiles/${req.file.filename}`;

      const user = await User.findByIdAndUpdate(
        req.user._id,
        { profilePicture: profilePicturePath },
        { new: true }
      ).select("-password");

      res.json({
        success: true,
        message: "Profile picture updated!",
        profilePicture: profilePicturePath,
        user,
      });
    } catch (error) {
      console.error("Profile pic upload error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

// ==================== CHANGE PASSWORD ====================
// PUT /api/users/change-password
router.put("/change-password", async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Please provide current and new password",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters",
      });
    }

    // Get user with password (normally excluded)
    const user = await User.findById(req.user._id).select("+password");

    // Verify current password
    const isCorrect = await user.comparePassword(currentPassword);
    if (!isCorrect) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Update password (will be hashed by the pre-save hook in User model)
    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: "Password changed successfully!" });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ==================== RECENTLY PLAYED ====================
// GET /api/users/recently-played
router.get("/recently-played", async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate({
        path: "recentlyPlayed.song", // Populate the song details
        select: "title artist thumbnail filePath duration playCount",
      });

    // Filter out any null songs (deleted songs)
    const recentSongs = user.recentlyPlayed
      .filter((item) => item.song !== null)
      .slice(0, 20); // Return last 20

    res.json({ success: true, recentlyPlayed: recentSongs });
  } catch (error) {
    console.error("Recently played error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ==================== LIKED SONGS ====================
// GET /api/users/liked-songs
router.get("/liked-songs", async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate("likedSongs");

    // Filter out deleted songs
    const likedSongs = user.likedSongs.filter((song) => song !== null);

    res.json({ success: true, likedSongs });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
