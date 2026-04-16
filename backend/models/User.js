/**
 * User Model
 * Defines what a "User" looks like in our database.
 * Each user has: name, email, password, profile pic, playlists, liked songs, etc.
 */

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// Define the shape of our User document
const userSchema = new mongoose.Schema(
  {
    // Basic info
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true, // Remove extra spaces
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [50, "Name cannot exceed 50 characters"],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true, // No two users can have the same email
      lowercase: true, // Always store email in lowercase
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
    },

    // Profile picture path (stored in uploads/profiles/)
    profilePicture: {
      type: String,
      default: null,
    },

    // Role: 'user' or 'admin'
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    // Songs this user has liked (array of Song IDs)
    likedSongs: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Song", // Reference to Song model
      },
    ],

    // Recently played songs (we store song ID + timestamp)
    recentlyPlayed: [
      {
        song: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Song",
        },
        playedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    // Automatically add createdAt and updatedAt timestamps
    timestamps: true,
  }
);

/**
 * MIDDLEWARE: Hash password before saving
 * This runs automatically every time we save a user.
 * We never store plain text passwords!
 */
userSchema.pre("save", async function (next) {
  // Only hash if password was changed (or is new)
  if (!this.isModified("password")) return next();

  // Hash the password with "salt rounds" of 12 (more = more secure but slower)
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

/**
 * METHOD: Compare password
 * Used during login to check if entered password matches stored hash
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Create and export the User model
module.exports = mongoose.model("User", userSchema);
