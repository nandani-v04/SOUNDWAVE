# SoundWave - Database Schema Documentation

## Overview
SoundWave uses **MongoDB** (a NoSQL database) with **Mongoose** ODM.
Data is stored as documents (JSON-like objects) in collections.

---

## Collections

### 1. users
Stores all registered user accounts.

```json
{
  "_id": "ObjectId",
  "name": "John Doe",
  "email": "john@example.com",
  "password": "$2b$12$hashedpassword...",
  "profilePicture": "/uploads/profiles/1234-photo.jpg",
  "role": "user",
  "likedSongs": ["songId1", "songId2"],
  "recentlyPlayed": [
    {
      "song": "songId",
      "playedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

**Indexes:** email (unique)
**Password:** Never stored as plain text. Always hashed with bcrypt (12 rounds).

---

### 2. songs
Stores all uploaded songs and their metadata.

```json
{
  "_id": "ObjectId",
  "title": "Blinding Lights",
  "artist": "The Weeknd",
  "genre": "Pop",
  "duration": 215,
  "filePath": "/uploads/songs/1704067200-blinding_lights.mp3",
  "thumbnail": "/uploads/thumbnails/1704067200-cover.jpg",
  "playCount": 142,
  "likes": ["userId1", "userId2", "userId3"],
  "uploadedBy": "adminUserId",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

**Virtual field:** `likeCount` = `likes.length`

---

### 3. playlists
Stores user-created playlists.

```json
{
  "_id": "ObjectId",
  "name": "My Workout Mix",
  "description": "High energy songs for the gym",
  "owner": "userId",
  "songs": ["songId1", "songId2", "songId3"],
  "coverImage": null,
  "createdAt": "2024-01-10T00:00:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

---

## Relationships

```
User  ──(has many)──►  Playlist (owner field)
User  ──(likes many)──► Song (likedSongs array)
Song  ──(liked by many)──► User (likes array)
Playlist ──(has many)──► Song (songs array)
Song  ──(uploaded by)──► User (uploadedBy field)
User  ──(recently played)──► Song (recentlyPlayed array)
```

---

## Sample MongoDB Queries

```javascript
// Find all songs by an artist
db.songs.find({ artist: "The Weeknd" })

// Find most played songs
db.songs.find().sort({ playCount: -1 }).limit(10)

// Find a user's liked songs
db.users.findOne({ email: "john@example.com" }, { likedSongs: 1 })

// Get total play count of all songs
db.songs.aggregate([
  { $group: { _id: null, total: { $sum: "$playCount" } } }
])

// Find songs in a specific genre
db.songs.find({ genre: { $regex: "pop", $options: "i" } })
```
