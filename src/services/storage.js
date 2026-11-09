const IDENTITY_KEY = 'commontime.identity.v1';

function readObject(key) {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return {};
    const value = JSON.parse(raw);
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  } catch {
    return {};
  }
}

function writeObject(key, value) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

// Polls, participants, and availability now live in MySQL. This small adapter
// only remembers which display name this browser last used for a poll so the
// response can be preloaded when the page is reopened.
export const pollStorage = {
  getSavedName(pollId) {
    const identity = readObject(IDENTITY_KEY);
    return typeof identity[pollId] === 'string' ? identity[pollId] : '';
  },

  saveName(pollId, name) {
    const identity = readObject(IDENTITY_KEY);
    identity[pollId] = name;
    writeObject(IDENTITY_KEY, identity);
  },
};
