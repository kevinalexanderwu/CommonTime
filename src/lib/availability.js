export function slotKey(date, time) {
  return `${date}|${time}`;
}

export function splitSlotKey(key) {
  const [date, time] = String(key || '').split('|');
  return { date, time };
}

export function countBySlot(dates, times, participants) {
  const validSlots = new Set();
  dates.forEach((date) => {
    times.forEach((time) => validSlots.add(slotKey(date, time)));
  });

  const counts = new Map();
  validSlots.forEach((key) => counts.set(key, 0));

  participants.forEach((participant) => {
    const seen = new Set();
    participant.slots.forEach((key) => {
      if (validSlots.has(key) && !seen.has(key)) {
        seen.add(key);
        counts.set(key, (counts.get(key) || 0) + 1);
      }
    });
  });

  return counts;
}

export function getBestSlotKeys(counts) {
  let maxCount = 0;
  counts.forEach((count) => {
    if (count > maxCount) maxCount = count;
  });

  const keys = new Set();
  if (maxCount > 0) {
    counts.forEach((count, key) => {
      if (count === maxCount) keys.add(key);
    });
  }

  return { maxCount, keys };
}

export function getSlotsForParticipant(participant) {
  return new Set(participant?.slots || []);
}

export function countDatesInSelection(selection) {
  const dates = new Set();
  selection.forEach((key) => dates.add(splitSlotKey(key).date));
  return dates.size;
}
