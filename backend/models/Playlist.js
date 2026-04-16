/**
 * Playlist Model
 * A playlist belongs to a user and contains multiple songs.
 */

const mongoose = require("mongoose");

const playlistSchema = new mongoose.Schema(
  {
    // Playlist name (e.g., "My Favorites", "Workout Beats")
    name: {
      type: String,
      required: [true, "Playlist name is required"],
      trim: true,
      maxlength: [50, "Playlist name cannot exceed 50 characters"],
    },

    // Optional description
    description: {
      type: String,
      trim: true,
      maxlength: [200, "Description cannot exceed 200 characters"],
    },

    // The user who created this playlist
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Array of songs in this playlist
    songs: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Song",
      },
    ],

    // Optional cover image for the playlist
    coverImage: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Playlist", playlistSchema);
