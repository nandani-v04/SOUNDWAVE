/**
 * SoundWave - API Helper
 * All functions to communicate with our backend.
 * Uses fetch() to make HTTP requests.
 */

// The base URL of our backend server
const API_BASE = 'http://localhost:5000/api';

/**
 * Helper function to make API requests
 * Automatically adds the JWT token to headers if user is logged in
 */
async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('sw_token');

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }), // Add token if exists
      ...options.headers,
    },
    ...options,
  };

  // Don't set Content-Type for FormData (file uploads)
  if (options.body instanceof FormData) {
    delete config.headers['Content-Type'];
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Something went wrong');
    }

    return data;
  } catch (error) {
    throw error;
  }
}

// ==================== AUTH API ====================

const AuthAPI = {
  // Sign up new user
 signup: (name, email, password) =>
  apiRequest('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ username: name, email, password }),
  }),

  // Log in
  login: (email, password) =>
    apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  // Get current user info
  me: () => apiRequest('/auth/me'),

  // Create admin account
  createAdmin: (name, email, password, adminSecret) =>
    apiRequest('/auth/create-admin', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, adminSecret }),
    }),
};

// ==================== SONGS API ====================

const SongsAPI = {
  // Get all songs
  getAll: () => apiRequest('/songs'),

  // Search songs
  search: (query) => apiRequest(`/songs/search?q=${encodeURIComponent(query)}`),

  // Get most popular songs
  getPopular: () => apiRequest('/songs/popular'),

  // Get single song
  getOne: (id) => apiRequest(`/songs/${id}`),

  // Like or unlike a song
  like: (id) => apiRequest(`/songs/${id}/like`, { method: 'POST' }),

  // Track that a song was played
  trackPlay: (id) => apiRequest(`/songs/${id}/play`, { method: 'POST' }),
};

// ==================== USERS API ====================

const UsersAPI = {
  // Get user profile
  getProfile: () => apiRequest('/users/profile'),

  // Update profile name
  updateProfile: (name) =>
    apiRequest('/users/profile', {
      method: 'PUT',
      body: JSON.stringify({ name }),
    }),

  // Upload profile picture
  uploadProfilePicture: (formData) =>
    apiRequest('/users/profile-picture', {
      method: 'POST',
      body: formData, // FormData object
    }),

  // Change password
  changePassword: (currentPassword, newPassword) =>
    apiRequest('/users/change-password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),

  // Get recently played songs
  getRecentlyPlayed: () => apiRequest('/users/recently-played'),

  // Get liked songs
  getLikedSongs: () => apiRequest('/users/liked-songs'),
};

// ==================== PLAYLISTS API ====================

const PlaylistsAPI = {
  // Get all user playlists
  getAll: () => apiRequest('/playlists'),

  // Create new playlist
  create: (name, description) =>
    apiRequest('/playlists', {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    }),

  // Get single playlist
  getOne: (id) => apiRequest(`/playlists/${id}`),

  // Delete playlist
  delete: (id) =>
    apiRequest(`/playlists/${id}`, { method: 'DELETE' }),

  // Add song to playlist
  addSong: (playlistId, songId) =>
    apiRequest(`/playlists/${playlistId}/songs`, {
      method: 'POST',
      body: JSON.stringify({ songId }),
    }),

  // Remove song from playlist
  removeSong: (playlistId, songId) =>
    apiRequest(`/playlists/${playlistId}/songs/${songId}`, {
      method: 'DELETE',
    }),
};

// ==================== ADMIN API ====================

const AdminAPI = {
  // Get dashboard stats
  getStats: () => apiRequest('/admin/stats'),

  // Upload new song
  uploadSong: (formData) =>
    apiRequest('/admin/songs', {
      method: 'POST',
      body: formData, // FormData with song file + thumbnail + details
    }),

  // Edit song details
  editSong: (id, data) =>
    apiRequest(`/admin/songs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Delete song
  deleteSong: (id) =>
    apiRequest(`/admin/songs/${id}`, { method: 'DELETE' }),

  // Get all songs (admin view)
  getAllSongs: () => apiRequest('/admin/songs'),

  // Get all users
  getAllUsers: () => apiRequest('/admin/users'),
};

// ==================== LOCAL STORAGE HELPERS ====================

const Storage = {
  // Save user data after login
  saveUser: (token, user) => {
    localStorage.setItem('sw_token', token);
    localStorage.setItem('sw_user', JSON.stringify(user));
  },

  // Get current user
  getUser: () => {
    const user = localStorage.getItem('sw_user');
    return user ? JSON.parse(user) : null;
  },

  // Get token
  getToken: () => localStorage.getItem('sw_token'),

  // Check if user is logged in
  isLoggedIn: () => !!localStorage.getItem('sw_token'),

  // Check if user is admin
  isAdmin: () => {
    const user = Storage.getUser();
    return user?.role === 'admin';
  },

  // Log out
  logout: () => {
    localStorage.removeItem('sw_token');
    localStorage.removeItem('sw_user');
  },
};

// ==================== TOAST NOTIFICATIONS ====================

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container') || createToastContainer();

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  // Auto-remove after 3 seconds
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function createToastContainer() {
  const container = document.createElement('div');
  container.id = 'toast-container';
  container.className = 'toast-container';
  document.body.appendChild(container);
  return container;
}

// ==================== FORMAT HELPERS ====================

/**
 * Format seconds to MM:SS display
 * Example: 215 -> "3:35"
 */
function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Get image URL (full path including server)
 */
function getImageUrl(path) {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `http://localhost:5000${path}`;
}

/**
 * Format number with commas (e.g., 1234567 -> "1,234,567")
 */
function formatNumber(num) {
  return num?.toLocaleString() || '0';
}

/**
 * Get user's initials for avatar placeholder
 * Example: "John Doe" -> "JD"
 */
function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}
// Auto-update sidebar on every page load
document.addEventListener('DOMContentLoaded', () => {
  const user = Storage.getUser();
  const token = Storage.getToken();
  if (!user || !token) return;

  const nameEl = document.getElementById('sidebar-name');
  const avatarEl = document.getElementById('sidebar-avatar');
  const roleEl = document.getElementById('sidebar-role');
  const loginBtn = document.getElementById('login-btn');
  const logoutBtn = document.getElementById('logout-btn');
  const adminNav = document.getElementById('admin-nav');

  if (nameEl) nameEl.textContent = user.name;
  if (roleEl) roleEl.textContent = user.role;
  if (avatarEl) {
    if (user.profilePicture) {
      avatarEl.innerHTML = `<img src="${getImageUrl(user.profilePicture)}" alt="${user.name}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
    } else {
      avatarEl.textContent = getInitials(user.name);
    }
  }
  // Fix: also update the name text inside user-card directly
  const userNameEl = document.querySelector('.user-name');
  const userRoleEl = document.querySelector('.user-role');
  if (userNameEl) userNameEl.textContent = user.name;
  if (userRoleEl) userRoleEl.textContent = user.role;
  if (loginBtn) loginBtn.style.display = 'none';
  if (logoutBtn) logoutBtn.style.display = 'block';
  if (adminNav && user.role === 'admin') adminNav.style.display = 'block';
});
