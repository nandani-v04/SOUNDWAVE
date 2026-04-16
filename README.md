# ⚡ SOUNDWAVE - Full Stack Music Player

A beautiful, full-featured online music streaming application with a user-facing frontend and a complete admin panel. Built for beginners and students!

---

## ✨ Features

### 👤 User Features
- 🔐 Sign Up & Login with JWT authentication
- 🎵 Browse and play songs with a beautiful player bar
- 🔍 Search songs by title, artist, or genre
- ❤️ Like / Unlike songs
- 📋 Create playlists and add songs to them
- ⏱ Recently played history
- 👤 User profile with profile picture upload
- 🔑 Change password

### 🔐 Admin Features
- 🛡️ Separate admin login
- ⬆️ Upload songs (MP3) with cover art
- ✏️ Edit song details (title, artist, genre)
- 🗑️ Delete songs (removes from disk too!)
- 📊 Dashboard with stats (users, songs, total plays)
- 👥 View all registered users

### 🎵 Music Player
- ▶️ Play / Pause
- ⏭ Next / Previous
- 🔀 Shuffle mode
- 🔁 Repeat (none / all / one)
- 📊 Progress bar with seek
- 🔊 Volume control
- 📱 Responsive design (works on mobile!)
- 🌙 Beautiful dark theme

---

## 📁 Folder Structure

```
soundwave/
├── backend/                  # Node.js + Express server
│   ├── models/
│   │   ├── User.js           # User database schema
│   │   ├── Song.js           # Song database schema
│   │   └── Playlist.js       # Playlist database schema
│   ├── routes/
│   │   ├── auth.js           # Login, signup routes
│   │   ├── songs.js          # Song CRUD + like + play
│   │   ├── users.js          # User profile routes
│   │   ├── playlists.js      # Playlist routes
│   │   └── admin.js          # Admin-only routes
│   ├── middleware/
│   │   ├── auth.js           # JWT verification middleware
│   │   └── upload.js         # Multer file upload config
│   ├── server.js             # Main entry point
│   ├── package.json
│   └── .env.example          # Copy this to .env
│
├── frontend/                 # HTML, CSS, JS pages
│   ├── index.html            # Home page
│   ├── login.html            # Login page
│   ├── signup.html           # Signup page
│   ├── player.html           # Now Playing page
│   ├── search.html           # Search page
│   ├── playlists.html        # Playlists page
│   ├── profile.html          # User profile
│   ├── liked.html            # Liked songs
│   ├── recent.html           # Recently played
│   ├── css/
│   │   └── style.css         # All styles (dark theme)
│   ├── js/
│   │   ├── api.js            # API helper functions
│   │   └── player.js         # Music player logic
│   └── admin/                # Admin panel pages
│       ├── index.html        # Admin dashboard
│       ├── login.html        # Admin login
│       ├── upload.html       # Upload songs
│       ├── songs.html        # Manage songs
│       └── users.html        # View users
│
└── uploads/                  # Uploaded files (auto-created)
    ├── songs/                # MP3 files
    ├── thumbnails/           # Cover images
    └── profiles/             # Profile pictures
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Backend | Node.js + Express.js |
| Database | MongoDB + Mongoose |
| Auth | JSON Web Tokens (JWT) |
| File Upload | Multer |
| Password Security | bcryptjs |

---

## 🚀 How to Run (Step by Step)

### Step 1: Install Prerequisites

You need these installed on your computer:
- **Node.js** (v16 or higher) → https://nodejs.org
- **MongoDB** → https://www.mongodb.com/try/download/community
- **Git** (optional) → https://git-scm.com

### Step 2: Install MongoDB

**On Windows:**
1. Download MongoDB from the link above
2. Run the installer
3. Start MongoDB: search "Services" → start "MongoDB"

**On Mac:**
```bash
brew install mongodb-community
brew services start mongodb-community
```

**On Linux (Ubuntu):**
```bash
sudo apt install mongodb
sudo systemctl start mongodb
```

### Step 3: Set Up the Project

```bash
# 1. Go to the backend folder
cd soundwave/backend

# 2. Install all dependencies
npm install

# 3. Copy the example .env file
cp .env.example .env
```

### Step 4: Configure Environment Variables

Open `backend/.env` in a text editor and update:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/soundwave
JWT_SECRET=your_own_long_random_secret_here_make_it_complex
ADMIN_SECRET=your_admin_creation_secret_here
```

> **💡 Tip:** Change `JWT_SECRET` and `ADMIN_SECRET` to something only you know!

### Step 5: Start the Backend Server

```bash
# From the backend/ folder:
npm run dev     # Development mode (auto-restarts on changes)
# OR
npm start       # Production mode
```

You should see:
```
✅ Connected to MongoDB successfully!
🎵 SOUNDWAVE Server Started!
   Port: 5000
   URL:  http://localhost:5000
```

### Step 6: Open the Frontend

You can open the frontend two ways:

**Option A: Directly open the file**
- Open `frontend/index.html` in your browser

**Option B: Use a local server (recommended)**
```bash
# Install live-server globally (one time only)
npm install -g live-server

# From the frontend/ folder:
cd soundwave/frontend
live-server --port=3000
```

Then go to: `http://localhost:3000`

### Step 7: Create Your First Admin Account

1. Open `http://localhost:3000/admin/login.html`
2. Scroll down to **"First Time Setup"**
3. Fill in your admin name, email, password
4. Enter your `ADMIN_SECRET` from the `.env` file
5. Click "Create Admin Account"
6. You'll be redirected to the admin dashboard!

---

## 🔑 API Routes Reference

### Authentication
```
POST /api/auth/signup           - Create user account
POST /api/auth/login            - Login (returns JWT token)
POST /api/auth/create-admin     - Create admin (needs adminSecret)
GET  /api/auth/me               - Get current user (requires login)
```

### Songs
```
GET  /api/songs                 - Get all songs
GET  /api/songs/search?q=query  - Search songs
GET  /api/songs/popular         - Get most played songs
GET  /api/songs/:id             - Get single song
POST /api/songs/:id/like        - Like/unlike song (requires login)
POST /api/songs/:id/play        - Increment play count (requires login)
```

### Users
```
GET  /api/users/profile         - Get user profile
PUT  /api/users/profile         - Update display name
POST /api/users/profile-picture - Upload profile picture
PUT  /api/users/change-password - Change password
GET  /api/users/recently-played - Get recently played songs
GET  /api/users/liked-songs     - Get liked songs
```

### Playlists
```
GET    /api/playlists               - Get user's playlists
POST   /api/playlists               - Create playlist
GET    /api/playlists/:id           - Get playlist with songs
DELETE /api/playlists/:id           - Delete playlist
POST   /api/playlists/:id/songs     - Add song to playlist
DELETE /api/playlists/:id/songs/:songId - Remove song
```

### Admin (Admin only)
```
GET    /api/admin/stats         - Dashboard stats
GET    /api/admin/songs         - All songs (admin view)
POST   /api/admin/songs         - Upload new song
PUT    /api/admin/songs/:id     - Edit song details
DELETE /api/admin/songs/:id     - Delete song + files
GET    /api/admin/users         - All registered users
```

---

## 🗄️ Database Schema

### User
```javascript
{
  name: String,              // "John Doe"
  email: String,             // "john@example.com" (unique)
  password: String,          // bcrypt hashed
  profilePicture: String,    // "/uploads/profiles/..."
  role: "user" | "admin",
  likedSongs: [Song._id],    // Array of liked song IDs
  recentlyPlayed: [{
    song: Song._id,
    playedAt: Date
  }],
  createdAt: Date,
  updatedAt: Date
}
```

### Song
```javascript
{
  title: String,             // "Blinding Lights"
  artist: String,            // "The Weeknd"
  genre: String,             // "Pop"
  duration: Number,          // in seconds
  filePath: String,          // "/uploads/songs/..."
  thumbnail: String,         // "/uploads/thumbnails/..."
  playCount: Number,         // total play count
  likes: [User._id],         // array of user IDs who liked
  uploadedBy: User._id,
  createdAt: Date
}
```

### Playlist
```javascript
{
  name: String,              // "My Favorites"
  description: String,
  owner: User._id,
  songs: [Song._id],
  coverImage: String,
  createdAt: Date
}
```

---

## ❗ Troubleshooting

**"Cannot connect to MongoDB"**
- Make sure MongoDB is running
- Check your `MONGO_URI` in `.env`
- Try: `mongosh` in terminal to test connection

**"CORS error" in browser**
- Make sure backend is running on port 5000
- Check `API_BASE` in `frontend/js/api.js`

**Songs not playing**
- Check that the MP3 file exists in `uploads/songs/`
- Check browser console for errors
- Make sure backend is running

**"Invalid token"**
- Clear browser localStorage and log in again
- Token may have expired (7 day expiry)

---

## 👨‍💻 For Beginners: Key Concepts

1. **JWT (JSON Web Token)**: Like a digital ID card. After login, the server gives you a token. You show this token with every request to prove who you are.

2. **API (Application Programming Interface)**: The backend exposes "endpoints" (URLs) that the frontend can call to get/send data.

3. **Middleware**: Code that runs between receiving a request and sending a response. Used for auth checks, file uploads, etc.

4. **MongoDB**: A database that stores data as JSON-like documents instead of tables.

5. **Mongoose**: A library that makes MongoDB easier to use in Node.js, with schemas and validation.

---

## 📝 License

Free to use for educational purposes. Made with ❤️ for students learning full-stack development.

**Project: SoundWave** | Built with Node.js, Express, MongoDB & Vanilla JS
"# SOUNDWAVE" 
