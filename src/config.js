// Central place for environment-level config.
// Your deployed backend (Render). Render free tier spins down when idle,
// so the very first request after inactivity can take 30-60s to respond —
// this is expected, not a bug in the app.
export const API_BASE_URL = 'https://loan-management-backend-adb5.onrender.com/api/v1';

// How long (ms) to wait before giving up on a request. Kept generous to
// tolerate Render's cold start.
export const API_TIMEOUT_MS = 60000;
