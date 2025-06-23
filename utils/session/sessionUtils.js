/**
 * Adds a new session to the user's sessions array.
 * @param {Object} user - Mongoose user document.
 * @param {string} token - JWT token.
 * @param {string} device - User agent or device info.
 * @param {string} ipAddress - Client IP address.
 */
const addSession = (user, token, device, ipAddress) => {
  user.sessions.push({
    token,
    device: device || 'unknown',
    ipAddress,
    lastActive: new Date(),
  });
};

/**
 * Removes old or inactive sessions (older than 30 days).
 * @param {Object} user - Mongoose user document.
 * @returns {Array} Filtered sessions array.
 */
const cleanOldSessions = (user) => {
  return user.sessions.filter(
    (session) =>
      session.active && session.lastActive > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days
  );
};

/**
 * Maps active sessions to a simplified format for API response.
 * @param {Array} sessions - User's sessions array.
 * @returns {Array} Array of active session objects.
 */
const getActiveSessions = (sessions) => {
  return sessions
    .filter((session) => session.active)
    .map((session) => ({
      token: session.token,
      device: session.device,
      lastActive: session.lastActive,
    }));
};

module.exports = {
  addSession,
  cleanOldSessions,
  getActiveSessions,
};