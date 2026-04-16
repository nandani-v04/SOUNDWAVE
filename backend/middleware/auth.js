/**
 * Authentication Middleware
 * These functions protect routes so only logged-in users can access them.
 * They check for a valid JWT token in the request header.
 */

const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * protect - Middleware to verify JWT token
 * Add this to any route that requires login
 *
 * Usage: router.get('/profile', protect, (req, res) => { ... })
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // Check if Authorization header exists and starts with "Bearer"
    // Header format: "Authorization: Bearer <token>"
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1]; // Get the token part
    }

    // If no token found, reject the request
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. Please log in first.",
      });
    }

    // Verify the token is valid and not expired
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find the user from the token's user ID
    const user = await User.findById(decoded.id).select("-password"); // Exclude password

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found. Please log in again.",
      });
    }

    // Attach user to request object so routes can use it
    req.user = user;
    next(); // Continue to the actual route
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token. Please log in again.",
      });
    }
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired. Please log in again.",
      });
    }
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * adminOnly - Middleware to check if user is an admin
 * Must be used AFTER protect middleware
 *
 * Usage: router.post('/upload', protect, adminOnly, (req, res) => { ... })
 */
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next(); // User is admin, continue
  } else {
    res.status(403).json({
      success: false,
      message: "Access denied. Admin privileges required.",
    });
  }
};

module.exports = { protect, adminOnly };
