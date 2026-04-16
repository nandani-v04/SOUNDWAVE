/**
 * SoundWave - Music Player
 * Handles all audio playback logic:
 * - Play, Pause, Skip, Previous
 * - Progress bar
 * - Volume control
 * - Shuffle and Repeat
 * - Like songs
 */

// The global player state - keeps track of everything
const Player = {
  audio: new Audio(),       // The HTML5 Audio object that actually plays music
  currentSong: null,        // Currently playing song object
  queue: [],                // List of songs to play
  currentIndex: -1,         // Index of current song in queue
  isPlaying: false,
  isShuffle: false,
  repeatMode: 'none',       // 'none', 'all', 'one'
  volume: 0.8,
  likedSongs: new Set(),    // Set of liked song IDs for fast lookup
};

// ==================== INITIALIZE PLAYER ====================

function initPlayer() {
  const audio = Player.audio;
  audio.volume = Player.volume;

  // Update progress bar as song plays
  audio.addEventListener('timeupdate', () => {
    if (!audio.duration) return;

    const percent = (audio.currentTime / audio.duration) * 100;
    const fill = document.getElementById('progress-fill');
    const current = document.getElementById('time-current');

    if (fill) fill.style.width = `${percent}%`;
    if (current) current.textContent = formatTime(audio.currentTime);
  });

  // When song ends
  audio.addEventListener('ended', () => {
    handleSongEnd();
  });

  // When song metadata loads (we get duration)
  audio.addEventListener('loadedmetadata', () => {
    const duration = document.getElementById('time-duration');
    if (duration) duration.textContent = formatTime(audio.duration);
  });

  // Click on progress bar to seek
  const progressBar = document.getElementById('progress-bar');
  if (progressBar) {
    progressBar.addEventListener('click', (e) => {
      const rect = progressBar.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      audio.currentTime = percent * audio.duration;
    });
  }

  // Volume slider
  const volumeSlider = document.getElementById('volume-slider');
  if (volumeSlider) {
    volumeSlider.value = Player.volume * 100;
    volumeSlider.addEventListener('input', (e) => {
      Player.volume = e.target.value / 100;
      audio.volume = Player.volume;
    });
  }

  // Load liked songs from user data
  const user = Storage.getUser();
  if (user) {
    loadLikedSongs();
  }
}

// ==================== PLAY A SONG ====================

async function playSong(song, queue = null) {
  if (!song) return;

  // If a new queue is provided, update the queue
  if (queue) {
    Player.queue = queue;
    Player.currentIndex = queue.findIndex(s => s._id === song._id);
  } else if (Player.currentIndex === -1) {
    Player.queue = [song];
    Player.currentIndex = 0;
  }

  Player.currentSong = song;
    // Save to localStorage so it persists across pages
  localStorage.setItem('sw_current_song', JSON.stringify(song));
  localStorage.setItem('sw_queue', JSON.stringify(Player.queue));


  // Set the audio source
  const songUrl = `http://localhost:5000${song.filePath}`;
  Player.audio.src = songUrl;
  Player.audio.load();

  try {
    await Player.audio.play();
    Player.isPlaying = true;
    updatePlayPauseButton();
    updatePlayerUI(song);

    // Track the play (fire and forget - don't block UI)
    if (Storage.isLoggedIn()) {
      SongsAPI.trackPlay(song._id).catch(() => {});
    }
  } catch (error) {
    console.error('Error playing audio:', error);
    showToast('Could not play this song. Check if the file exists.', 'error');
  }
}

// ==================== TOGGLE PLAY/PAUSE ====================

function togglePlayPause() {
  if (!Player.currentSong) {
    showToast('Select a song to play!', 'info');
    return;
  }

  if (Player.isPlaying) {
    Player.audio.pause();
    Player.isPlaying = false;
  } else {
    Player.audio.play().then(() => {
      Player.isPlaying = true;
    });
  }

  updatePlayPauseButton();
}

// ==================== NEXT SONG ====================

function playNext() {
  if (Player.queue.length === 0) return;

  let nextIndex;

  if (Player.isShuffle) {
    // Random song (not the current one)
    do {
      nextIndex = Math.floor(Math.random() * Player.queue.length);
    } while (nextIndex === Player.currentIndex && Player.queue.length > 1);
  } else {
    nextIndex = Player.currentIndex + 1;

    if (nextIndex >= Player.queue.length) {
      if (Player.repeatMode === 'all') {
        nextIndex = 0; // Loop back to beginning
      } else {
        // End of queue
        Player.isPlaying = false;
        updatePlayPauseButton();
        return;
      }
    }
  }

  Player.currentIndex = nextIndex;
  playSong(Player.queue[nextIndex]);
}

// ==================== PREVIOUS SONG ====================

function playPrevious() {
  if (Player.queue.length === 0) return;

  // If more than 3 seconds into song, restart it instead of going back
  if (Player.audio.currentTime > 3) {
    Player.audio.currentTime = 0;
    return;
  }

  let prevIndex = Player.currentIndex - 1;

  if (prevIndex < 0) {
    prevIndex = Player.repeatMode === 'all' ? Player.queue.length - 1 : 0;
  }

  Player.currentIndex = prevIndex;
  playSong(Player.queue[prevIndex]);
}

// ==================== HANDLE SONG END ====================

function handleSongEnd() {
  if (Player.repeatMode === 'one') {
    // Repeat current song
    Player.audio.currentTime = 0;
    Player.audio.play();
  } else {
    playNext();
  }
}

// ==================== TOGGLE SHUFFLE ====================

function toggleShuffle() {
  Player.isShuffle = !Player.isShuffle;
  const btn = document.getElementById('shuffle-btn');
  if (btn) {
    btn.classList.toggle('active', Player.isShuffle);
  }
  showToast(Player.isShuffle ? 'Shuffle on 🔀' : 'Shuffle off', 'info');
}

// ==================== TOGGLE REPEAT ====================

function toggleRepeat() {
  const modes = ['none', 'all', 'one'];
  const currentMode = modes.indexOf(Player.repeatMode);
  Player.repeatMode = modes[(currentMode + 1) % modes.length];

  const btn = document.getElementById('repeat-btn');
  if (btn) {
    btn.classList.toggle('active', Player.repeatMode !== 'none');
    // Show different icon for repeat-one
    if (Player.repeatMode === 'one') {
      btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/><line x1="12" y1="17" x2="12" y2="17"/></svg>`;
    } else {
      btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>`;
    }
  }

  const messages = { none: 'Repeat off', all: 'Repeat all 🔁', one: 'Repeat one 🔂' };
  showToast(messages[Player.repeatMode], 'info');
}

// ==================== LIKE/UNLIKE SONG ====================

async function toggleLike(songId) {
  if (!Storage.isLoggedIn()) {
    showToast('Log in to like songs!', 'info');
    return;
  }

  try {
    const data = await SongsAPI.like(songId);

    if (data.liked) {
      Player.likedSongs.add(songId);
      showToast('Added to liked songs ❤️', 'success');
    } else {
      Player.likedSongs.delete(songId);
      showToast('Removed from liked songs', 'info');
    }

    // Update all like buttons on the page for this song
    document.querySelectorAll(`[data-like-btn="${songId}"]`).forEach(btn => {
      btn.classList.toggle('liked', data.liked);
    });

  } catch (error) {
    showToast(error.message, 'error');
  }
}

async function loadLikedSongs() {
  try {
    const data = await UsersAPI.getLikedSongs();
    data.likedSongs?.forEach(song => {
      Player.likedSongs.add(song._id);
    });
    // Update like button states
    updateAllLikeButtons();
  } catch (error) {
    // Silently fail - not critical
  }
}

function updateAllLikeButtons() {
  document.querySelectorAll('[data-like-btn]').forEach(btn => {
    const songId = btn.dataset.likeBtn;
    btn.classList.toggle('liked', Player.likedSongs.has(songId));
  });
}

// ==================== UPDATE UI ====================

function updatePlayerUI(song) {
  // Song title and artist
  const titleEl = document.getElementById('player-title');
  const artistEl = document.getElementById('player-artist');
  const thumbEl = document.getElementById('player-thumb');
  const likeBtn = document.getElementById('player-like-btn');

  if (titleEl) titleEl.textContent = song.title;
  if (artistEl) artistEl.textContent = song.artist;

  if (thumbEl) {
    if (song.thumbnail) {
      thumbEl.innerHTML = `<img src="${getImageUrl(song.thumbnail)}" alt="${song.title}">`;
    } else {
      thumbEl.innerHTML = '🎵';
    }
  }

  if (likeBtn) {
    likeBtn.dataset.likeBtn = song._id;
    likeBtn.dataset.songId = song._id;
    likeBtn.classList.toggle('liked', Player.likedSongs.has(song._id));
  }

  // Update page title
  document.title = `${song.title} - ${song.artist} | SoundWave`;

  // Update playing state on all song cards
  document.querySelectorAll('.song-card, .song-list-item').forEach(el => {
    el.classList.remove('playing');
    if (el.dataset.songId === song._id) {
      el.classList.add('playing');
    }
  });
}

function updatePlayPauseButton() {
  const btn = document.getElementById('play-pause-btn');
  if (!btn) return;

  if (Player.isPlaying) {
    btn.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`;
  } else {
    btn.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><polygon points="5 3 19 12 5 21 5 3"/></svg>`;
  }
}

// ==================== BUILD SONG CARD HTML ====================

function createSongCard(song) {
  const isLiked = Player.likedSongs.has(song._id);
  const thumbHtml = song.thumbnail
    ? `<img src="${getImageUrl(song.thumbnail)}" alt="${song.title}" loading="lazy">`
    : `<div class="song-thumbnail-placeholder">🎵</div>`;

  return `
    <div class="song-card" data-song-id="${song._id}" onclick="handleSongCardClick('${song._id}')">
      <button class="like-btn ${isLiked ? 'liked' : ''}"
              data-like-btn="${song._id}"
              onclick="event.stopPropagation(); toggleLike('${song._id}')">
        ${isLiked ? '❤️' : '🤍'}
      </button>
      <div class="song-thumbnail">
        ${thumbHtml}
        <div class="play-overlay">
          <div class="play-overlay-btn">
            <svg viewBox="0 0 24 24" fill="white" width="22" height="22"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          </div>
        </div>
      </div>
      <div class="song-title">${escapeHtml(song.title)}</div>
      <div class="song-artist">${escapeHtml(song.artist)}</div>
      <span class="song-genre">${escapeHtml(song.genre)}</span>
    </div>
  `;
}

function createSongListItem(song, index, queue) {
  const isLiked = Player.likedSongs.has(song._id);
  const thumbHtml = song.thumbnail
    ? `<img src="${getImageUrl(song.thumbnail)}" alt="${song.title}">`
    : '🎵';

  return `
    <div class="song-list-item" data-song-id="${song._id}"
         onclick="playSong(${JSON.stringify(song).replace(/'/g, "\\'")}, ${JSON.stringify(queue || []).replace(/'/g, "\\'")})">
      <span class="song-list-num">${index + 1}</span>
      <div class="song-list-thumb">${thumbHtml}</div>
      <div class="song-list-info">
        <div class="song-list-title">${escapeHtml(song.title)}</div>
        <div class="song-list-artist">${escapeHtml(song.artist)}</div>
      </div>
      <span class="song-list-duration">${formatTime(song.duration)}</span>
      <button class="like-btn ${isLiked ? 'liked' : ''}"
              data-like-btn="${song._id}"
              onclick="event.stopPropagation(); toggleLike('${song._id}')">
        ${isLiked ? '❤️' : '🤍'}
      </button>
    </div>
  `;
}

// Security: Prevent XSS attacks by escaping HTML special characters
function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// This will be set by each page to handle song card clicks
let handleSongCardClick = (songId) => {};

// Initialize player when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  initPlayer();
  // Restore song from localStorage if page was refreshed
  const savedSong = localStorage.getItem('sw_current_song');
  const savedQueue = localStorage.getItem('sw_queue');
  if (savedSong && !Player.currentSong) {
    Player.currentSong = JSON.parse(savedSong);
    Player.queue = savedQueue ? JSON.parse(savedQueue) : [Player.currentSong];
    Player.currentIndex = Player.queue.findIndex(s => s._id === Player.currentSong._id);
    updatePlayerUI(Player.currentSong);
  }
});