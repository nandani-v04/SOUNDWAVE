/**
 * Authentication Routes
 * Handles: Sign Up, Login, and creating admin accounts
 *
 * Routes:
 * POST /api/auth/signup  - Create new user account
 * POST /api/auth/login   - Login and get JWT token
 * POST /api/auth/admin   - Create admin account (needs admin secret)
 */

const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { protect } = require("../middleware/auth");

const router = express.Router();

/**
 * Helper function to generate JWT token
 * The token contains the user's ID and expires in 7 days
 */
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId }, // Payload: what we store in the token
    process.env.JWT_SECRET, // Secret key to sign the token
    { expiresIn: "7d" } // Token expires in 7 days
  );
};

// ==================== SIGN UP ====================
// POST /api/auth/signup
router.post("/signup", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    console.log("REQ BODY:", req.body);

    // Basic validation
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide username, email, and password",
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    // Create new user (password gets hashed automatically by User model)
   const user = await User.create({ name: username,email, password });

    // Generate JWT token for the new user
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: "Account created successfully! Welcome to SoundWave!",
      token,
      user: {
        id: user._id,
        name: user.username,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture,
      },
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ success: false, message: "Server error during signup" });
  }
});

// ==================== LOGIN ====================
// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
    }

    // Find user by email (include password for comparison)
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Check if password matches
    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: `Welcome back, ${user.username}!`,
      token,
      user: {
        id: user._id,
        name: user.username || user.name,
        username: user.username,  
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, message: "Server error during login" });
  }
});

// ==================== CREATE ADMIN ====================
// POST /api/auth/create-admin
// Requires the admin secret key
router.post("/create-admin", async (req, res) => {
  try {
    const { username, email, password, adminSecret } = req.body;

    // Verify the admin secret
    if (adminSecret !== process.env.ADMIN_SECRET) {
      return res.status(403).json({
        success: false,
        message: "Invalid admin secret key",
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    // Create admin user
    const admin = await User.create({
      username,
      email,
      password,
      role: "admin",
    });

    const token = generateToken(admin._id);

    res.status(201).json({
      success: true,
      message: "Admin account created successfully!",
      token,
      user: {
        id: admin._id,
        name: admin.username,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error("Admin creation error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ==================== GET CURRENT USER ====================
// GET /api/auth/me  (requires login)
router.get("/me", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate("likedSongs")
      .select("-password");

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
