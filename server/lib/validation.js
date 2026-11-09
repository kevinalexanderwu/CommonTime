import { ApiError } from './http.js';
import {
  ALLOWED_INTERVALS,
  MAX_AVAILABILITY_SLOTS,
  MAX_POLL_DAYS,
  buildTimeSlots,
  cleanName,
  isValidDateKey,
  normalizeTime,
  parseSlotKey,
} from './availability.js';

function validationError(message, field = null) {
  return new ApiError(400, 'VALIDATION_ERROR', message, field ? { field } : null);
}

export function validateCreatePollInput(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw validationError('Request body must be a JSON object.');
  }

  if (typeof body.title !== 'string') {
    throw validationError('Event title is required.', 'title');
  }
  const title = body.title.trim();
  if (!title) {
    throw validationError('Enter an event title.', 'title');
  }
  if (title.length > 100) {
    throw validationError('The event title must be 100 characters or fewer.', 'title');
  }

  let description = '';
  if (body.description !== undefined && body.description !== null) {
    if (typeof body.description !== 'string') {
      throw validationError('Description must be a string.', 'description');
    }
    description = body.description.trim();
  }
  if (description.length > 500) {
    throw validationError('The description must be 500 characters or fewer.', 'description');
  }

  if (!Array.isArray(body.dates)) {
    throw validationError('Dates must be an array.', 'dates');
  }
  const dates = [...new Set(body.dates)].sort();
  if (dates.length === 0) {
    throw validationError('Select at least one date.', 'dates');
  }
  if (dates.length > MAX_POLL_DAYS) {
    throw validationError(`Polls can cover up to ${MAX_POLL_DAYS} dates.`, 'dates');
  }
  if (!dates.every(isValidDateKey)) {
    throw validationError('Every date must use the YYYY-MM-DD format.', 'dates');
  }

  const startTime = normalizeTime(body.startTime);
  const endTime = normalizeTime(body.endTime);
  if (!startTime || !endTime) {
    throw validationError('Start and end times must use the HH:MM format.', 'time');
  }

  const interval = Number(body.interval);
  if (!ALLOWED_INTERVALS.includes(interval)) {
    throw validationError('Choose a valid time slot interval.', 'interval');
  }

  const times = buildTimeSlots(startTime, endTime, interval);
  if (times.length === 0) {
    throw validationError('The time range needs to fit at least one time slot.', 'time');
  }

  return {
    title,
    description,
    dates,
    startTime,
    endTime,
    interval,
    times,
  };
}

export function validateParticipantInput(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw validationError('Request body must be a JSON object.');
  }
  if (typeof body.name !== 'string') {
    throw validationError('Enter your name.', 'name');
  }

  const name = cleanName(body.name);
  if (!name) {
    throw validationError('Enter your name.', 'name');
  }
  if (name.length > 50) {
    throw validationError('Names must be 50 characters or fewer.', 'name');
  }
  return { name };
}

export function validateAvailabilityInput(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw validationError('Request body must be a JSON object.');
  }

  if (typeof body.participantId !== 'string' || !body.participantId.trim()) {
    throw validationError('participantId is required.', 'participantId');
  }
  const participantId = body.participantId.trim();
  if (participantId.length > 16) {
    throw validationError('participantId is not valid.', 'participantId');
  }

  if (!Array.isArray(body.slots)) {
    throw validationError('slots must be an array.', 'slots');
  }
  if (body.slots.length > MAX_AVAILABILITY_SLOTS) {
    throw validationError('Too many availability slots were provided.', 'slots');
  }

  const slots = [...new Set(body.slots)];
  for (const key of slots) {
    if (!parseSlotKey(key)) {
      throw validationError(`Invalid availability slot: ${String(key)}`, 'slots');
    }
  }

  return { participantId, slots };
}
