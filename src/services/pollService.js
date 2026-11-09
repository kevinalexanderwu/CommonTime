import { pollStorage } from './storage.js';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');

class ApiRequestError extends Error {
  constructor(status, code, message) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.code = code;
  }
}

async function request(path, options = {}) {
  const { method = 'GET', body } = options;
  let response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiRequestError(
      0,
      'NETWORK_ERROR',
      'Could not connect to the server. Please try again.',
    );
  }

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    // The API normally returns JSON. Keep a useful fallback for unexpected responses.
  }

  if (!response.ok) {
    throw new ApiRequestError(
      response.status,
      payload?.error?.code || 'REQUEST_FAILED',
      payload?.error?.message || `Request failed with status ${response.status}.`,
    );
  }

  return payload;
}

// This service is the only frontend module that talks to persistence. Poll data
// and responses come from the Express API; localStorage is used only to remember
// the current browser user's display name for each poll.
export const pollService = {
  async createPoll(input) {
    const payload = await request('/api/polls', {
      method: 'POST',
      body: input,
    });
    return payload.poll;
  },

  async getPoll(pollId) {
    if (!pollId) return null;
    try {
      const payload = await request(`/api/polls/${encodeURIComponent(pollId)}`);
      return payload.poll;
    } catch (error) {
      if (error.status === 404) return null;
      throw error;
    }
  },

  async getResponses(pollId) {
    if (!pollId) return [];
    const payload = await request(
      `/api/polls/${encodeURIComponent(pollId)}/participants`,
    );
    return Array.isArray(payload.participants) ? payload.participants : [];
  },

  async saveResponse(pollId, name, slots) {
    const participantResult = await request(
      `/api/polls/${encodeURIComponent(pollId)}/participants`,
      {
        method: 'POST',
        body: { name },
      },
    );

    const availabilityResult = await request(
      `/api/polls/${encodeURIComponent(pollId)}/availability`,
      {
        method: 'POST',
        body: {
          participantId: participantResult.participant.id,
          slots,
        },
      },
    );

    pollStorage.saveName(pollId, availabilityResult.participant.name);

    return {
      participant: availabilityResult.participant,
      updated: !participantResult.created,
    };
  },

  async getAvailability(pollId) {
    if (!pollId) return null;
    const payload = await request(
      `/api/polls/${encodeURIComponent(pollId)}/availability`,
    );
    return payload.availability;
  },

  getSavedName(pollId) {
    return pollStorage.getSavedName(pollId);
  },
};
