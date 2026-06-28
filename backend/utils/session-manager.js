const sessions = new Map();

export const getSession = async (phone) => {
  if (!phone) return null;
  const cleanPhone = phone.replace(/\D/g, "");
  return sessions.get(cleanPhone) || null;
};

export const setSession = async (phone, session) => {
  if (!phone || !session) return;
  const cleanPhone = phone.replace(/\D/g, "");

  // Clear any existing timer
  const existing = sessions.get(cleanPhone);
  if (existing && existing._timerId) {
    clearTimeout(existing._timerId);
  }

  // Auto-expire after 1 hour
  const timerId = setTimeout(() => {
    sessions.delete(cleanPhone);
    console.log(`🧹 Session auto-expired: ${cleanPhone}`);
  }, 3600000);

  session._timerId = timerId;
  sessions.set(cleanPhone, session);
};

export const deleteSession = async (phone) => {
  if (!phone) return;
  const cleanPhone = phone.replace(/\D/g, "");
  const existing = sessions.get(cleanPhone);
  if (existing && existing._timerId) {
    clearTimeout(existing._timerId);
  }
  sessions.delete(cleanPhone);
};

/**
 * Get all active sessions (for debugging)
 */
export const getAllSessions = async () => {
  return Array.from(sessions.entries()).map(([phone, session]) => ({
    phone,
    createdAt: session.createdAt,
    step: session.step,
    mediaUploaded: session.incidentData?.mediaUploaded || [],
  }));
};

/**
 * Get session count
 */
export const getSessionCount = async () => {
  return sessions.size;
};

export default {
  getSession,
  setSession,
  deleteSession,
  getAllSessions,
  getSessionCount,
};