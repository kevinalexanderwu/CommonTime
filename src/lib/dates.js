export const MAX_POLL_DAYS = 60;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function pad2(value) {
  return String(value).padStart(2, '0');
}

export function dateToKey(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function todayKey() {
  return dateToKey(new Date());
}

export function parseDateKey(dateKey) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey || '')) return null;
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

export function isValidDateKey(dateKey) {
  return Boolean(parseDateKey(dateKey));
}

export function addDaysToKey(dateKey, amount) {
  const date = parseDateKey(dateKey);
  if (!date) return dateKey;
  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount);
  return dateToKey(next);
}

export function getDatesInRange(startKey, endKey) {
  const start = parseDateKey(startKey);
  const end = parseDateKey(endKey);
  if (!start || !end) return [];

  // Iterate using UTC day steps so daylight-saving changes cannot skip a date.
  const startUtc = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const endUtc = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
  if (startUtc > endUtc) return [];

  const dates = [];
  for (let time = startUtc; time <= endUtc; time += MS_PER_DAY) {
    const date = new Date(time);
    dates.push(`${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(date.getUTCDate())}`);
  }
  return dates;
}

export function formatDay(dateKey) {
  const date = parseDateKey(dateKey);
  if (!date) return { weekday: '', monthDay: '' };
  return {
    weekday: date.toLocaleDateString('en-US', { weekday: 'short' }),
    monthDay: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  };
}

export function formatShortDate(dateKey) {
  const date = parseDateKey(dateKey);
  if (!date) return '';
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function formatLongDate(dateKey) {
  const date = parseDateKey(dateKey);
  if (!date) return '';
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDateSpan(dateKeys) {
  if (!dateKeys || dateKeys.length === 0) return 'No dates';
  const sorted = [...dateKeys].sort();
  if (sorted.length === 1) {
    const date = parseDateKey(sorted[0]);
    return date
      ? date.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      : sorted[0];
  }

  const first = parseDateKey(sorted[0]);
  const last = parseDateKey(sorted[sorted.length - 1]);
  if (!first || !last) return `${sorted.length} dates`;

  const firstLabel = first.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const lastLabel = last.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  let consecutive = true;
  for (let index = 1; index < sorted.length; index += 1) {
    if (addDaysToKey(sorted[index - 1], 1) !== sorted[index]) {
      consecutive = false;
      break;
    }
  }

  if (consecutive) return `${firstLabel} – ${lastLabel}`;

  const listed = sorted.slice(0, 3).map((dateKey) => formatShortDate(dateKey));
  return `${listed.join(', ')}${sorted.length > 3 ? ` +${sorted.length - 3} more` : ''}`;
}

export function timeToMinutes(time) {
  if (!/^\d{2}:\d{2}$/.test(time || '')) return NaN;
  const [hours, minutes] = time.split(':').map(Number);
  if (hours > 23 || minutes > 59) return NaN;
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

  const slots = [];
  for (let current = start; current + step <= end; current += step) {
    slots.push(minutesToTime(current));
  }
  return slots;
}

export function formatSlotRange(startTime, interval) {
  const start = timeToMinutes(startTime);
  if (Number.isNaN(start)) return startTime;
  return `${startTime}–${minutesToTime(start + Number(interval))}`;
}

export function formatUpdatedAt(isoString) {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
