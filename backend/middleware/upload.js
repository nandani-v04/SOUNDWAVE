/**
 * File Upload Middleware (Multer)
 * Handles file uploads for songs (MP3), thumbnails (images), and profile pictures.
 * Files are saved to the /uploads/ directory.
 */

const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Make sure upload directories exist
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

ensureDir(path.join(__dirname, "../../uploads/songs"));
ensureDir(path.join(__dirname, "../../uploads/thumbnails"));
ensureDir(path.join(__dirname, "../../uploads/profiles"));

/**
 * Storage configuration for SONGS (MP3 files)
 */
const songStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../../uploads/songs"));
  },
  filename: (req, file, cb) => {
    // Create unique filename: timestamp + original name (spaces replaced)
    const uniqueName =
      Date.now() + "-" + file.originalname.replace(/\s+/g, "_");
    cb(null, uniqueName);
  },
});

/**
 * Storage configuration for THUMBNAILS (cover images)
 */
const thumbnailStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../../uploads/thumbnails"));
  },
  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() + "-" + file.originalname.replace(/\s+/g, "_");
    cb(null, uniqueName);
  },
});

/**
 * Storage configuration for PROFILE PICTURES
 */
const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../../uploads/profiles"));
  },
  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() + "-" + file.originalname.replace(/\s+/g, "_");
    cb(null, uniqueName);
  },
});

// Filter: Only allow MP3 files for songs
const songFilter = (req, file, cb) => {
  if (file.mimetype === "audio/mpeg" || file.mimetype === "audio/mp3" || file.originalname.endsWith('.mp3')) {
    cb(null, true); // Accept file
  } else {
    cb(new Error("Only MP3 files are allowed for songs!"), false); // Reject
  }
};

// Filter: Only allow image files for thumbnails and profile pics
const imageFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"), false);
  }
};

// Create multer upload handlers
const uploadSong = multer({
  storage: songStorage,
  fileFilter: songFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // Max 50MB for songs
});

const uploadThumbnail = multer({
  storage: thumbnailStorage,
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // Max 5MB for images
});

const uploadProfile = multer({
  storage: profileStorage,
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

// Combined upload for song + thumbnail at once
const uploadSongWithThumbnail = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      if (file.fieldname === "song") {
        cb(null, path.join(__dirname, "../../uploads/songs"));
      } else {
        cb(null, path.join(__dirname, "../../uploads/thumbnails"));
      }
    },
    filename: (req, file, cb) => {
      const uniqueName =
        Date.now() + "-" + file.originalname.replace(/\s+/g, "_");
      cb(null, uniqueName);
    },
  }),
  limits: { fileSize: 50 * 1024 * 1024 },
});

module.exports = {
  uploadSong,
  uploadThumbnail,
  uploadProfile,
  uploadSongWithThumbnail,
};
