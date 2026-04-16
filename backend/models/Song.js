/**
 * Song Model
 * Defines what a "Song" looks like in our database.
 * Each song has: title, artist, genre, file path, thumbnail, likes, play count, etc.
 */

const mongoose = require("mongoose");

const songSchema = new mongoose.Schema(
  {
    // Song title (e.g., "Blinding Lights")
    title: {
      type: String,
      required: [true, "Song title is required"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },

    // Artist name (e.g., "The Weeknd")
    artist: {
      type: String,
      required: [true, "Artist name is required"],
      trim: true,
      maxlength: [100, "Artist name cannot exceed 100 characters"],
    },

    // Genre (e.g., "Pop", "Rock", "Hip-Hop")
    genre: {
      type: String,
      required: [true, "Genre is required"],
      trim: true,
    },

    // Duration in seconds (e.g., 215 = 3:35)
    duration: {
      type: Number,
      default: 0,
    },

    // Path to the MP3 file (stored in uploads/songs/)
    filePath: {
      type: String,
      required: [true, "Song file is required"],
    },

    // Path to the cover image (stored in uploads/thumbnails/)
    thumbnail: {
      type: String,
      default: null,
    },

    // How many times the song has been played
    playCount: {
      type: Number,
      default: 0,
    },

    // Array of User IDs who liked this song
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // Which admin uploaded this song
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    // Automatically add createdAt and updatedAt
    timestamps: true,
  }
);

// Virtual field: count of likes (so we don't have to count array manually)
songSchema.virtual("likeCount").get(function () {
 return (this.likes || []).length;

});

// Make sure virtual fields appear in JSON output
songSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("Song", songSchema);
