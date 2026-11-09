export const MAX_POLL_DAYS = 60;
export const MAX_AVAILABILITY_SLOTS = 10000;
export const ALLOWED_INTERVALS = [15, 30, 60];

export function pad2(value) {
  return String(value).padStart(2, '0');
}

export function isValidDateKey(dateKey) {
  if (typeof dateKey !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
    return false;
  }

  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function normalizeTime(value) {
  if (typeof value !== 'string') return null;
  const match = /^([01]\d|2[0-3]):([0-5]\d)(?::[0-5]\d)?$/.exec(value.trim());
  if (!match) return null;
  return `${match[1]}:${match[2]}`;
}

export function timeToMinutes(time) {
  const normalized = normalizeTime(time);
  if (!normalized) return NaN;
  const [hours, minutes] = normalized.split(':').map(Number);
  return hours * 60 + minutes;
}

export function minutesToTime(minutes) {
  if (minutes === 1440) return '24:00';
  return `${pad2(Math.floor(minutes / 60))}:${pad2(minutes % 60)}`;
}

export function buildTimeSlots(startTime, endTime, interval) {
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  const step = Number(interval);

  if (
    Number.isNaN(start) ||
    Number.isNaN(end) ||
    !Number.isFinite(step) ||
    step <= 0 ||
    start >= end
  ) {
    return [];
  }

  const times = [];
  for (let current = start; current + step <= end; current += step) {
    times.push(minutesToTime(current));
  }
  return times;
}

export function slotKey(date, time) {
  return `${date}|${time}`;
}

export function parseSlotKey(key) {
  if (typeof key !== 'string') return null;
  const parts = key.split('|');
  if (parts.length !== 2) return null;
  const date = parts[0];
  const time = normalizeTime(parts[1]);
  if (!isValidDateKey(date) || !time) return null;
  return { date, time };
}

export function cleanName(value) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, ' ');
}

export function normalizeName(value) {
  return cleanName(value).toLowerCase();
}

export function normalizeSqlDate(value) {
  return String(value).slice(0, 10);
}

export function normalizeSqlTime(value) {
  return String(value).slice(0, 5);
}

export function toIsoString(value) {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  const stringValue = String(value);
  const normalized = stringValue.includes('T')
    ? stringValue
    : stringValue.replace(' ', 'T');
  return normalized.endsWith('Z') ? normalized : `${normalized}Z`;
}
