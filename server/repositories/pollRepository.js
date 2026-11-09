import { pool } from '../db.js';
import {
  normalizeName,
  normalizeSqlDate,
  normalizeSqlTime,
  parseSlotKey,
  slotKey,
  toIsoString,
} from '../lib/availability.js';
import { ApiError } from '../lib/http.js';
import { generateId } from '../lib/id.js';

function parseDates(raw) {
  if (Array.isArray(raw)) return raw;
  try {
    const parsed = JSON.parse(String(raw));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function mapPoll(row) {
  if (!row) return null;
  const poll = {
    id: row.id,
    title: row.title,
    description: row.description || '',
    dates: parseDates(row.dates),
    startTime: normalizeSqlTime(row.start_time),
    endTime: normalizeSqlTime(row.end_time),
    interval: Number(row.interval_minutes),
    createdAt: toIsoString(row.created_at),
  };

  if (row.participant_count !== undefined) {
    poll.participantCount = Number(row.participant_count);
  }
  return poll;
}

function groupParticipantRows(rows) {
  const participants = new Map();

  for (const row of rows) {
    let participant = participants.get(row.id);
    if (!participant) {
      participant = {
        id: row.id,
        name: row.name,
        slots: [],
        createdAt: toIsoString(row.created_at),
        updatedAt: toIsoString(row.updated_at),
      };
      participants.set(row.id, participant);
    }

    if (row.slot_date && row.slot_time) {
      participant.slots.push(
        slotKey(normalizeSqlDate(row.slot_date), normalizeSqlTime(row.slot_time)),
      );
    }
  }

  return [...participants.values()];
}

export async function listPolls() {
  const [rows] = await pool.query(`
    SELECT
      p.*,
      (SELECT COUNT(*) FROM participants pt WHERE pt.poll_id = p.id) AS participant_count
    FROM polls p
    ORDER BY p.created_at DESC
    LIMIT 100
  `);
  return rows.map(mapPoll);
}

export async function findPollById(pollId) {
  const [rows] = await pool.execute(
    `
      SELECT
        p.*,
        (SELECT COUNT(*) FROM participants pt WHERE pt.poll_id = p.id) AS participant_count
      FROM polls p
      WHERE p.id = ?
      LIMIT 1
    `,
    [pollId],
  );
  return rows.length > 0 ? mapPoll(rows[0]) : null;
}

export async function createPoll(input) {
  let pollId = generateId();

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await pool.execute(
        `
          INSERT INTO polls
            (id, title, description, dates, start_time, end_time, interval_minutes)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        [
          pollId,
          input.title,
          input.description || null,
          JSON.stringify(input.dates),
          input.startTime,
          input.endTime,
          input.interval,
        ],
      );
      return findPollById(pollId);
    } catch (error) {
      if (error.code !== 'ER_DUP_ENTRY') throw error;
      pollId = generateId();
    }
  }

  throw new Error('Could not generate a unique poll identifier.');
}

export async function listParticipants(pollId) {
  const [rows] = await pool.execute(
    `
      SELECT
        p.id,
        p.name,
        p.created_at,
        p.updated_at,
        a.slot_date,
        a.slot_time
      FROM participants p
      LEFT JOIN availability a ON a.participant_id = p.id
      WHERE p.poll_id = ?
      ORDER BY p.created_at ASC, p.name ASC, a.slot_date ASC, a.slot_time ASC
    `,
    [pollId],
  );
  return groupParticipantRows(rows);
}

export async function findParticipantById(pollId, participantId) {
  const [rows] = await pool.execute(
    `
      SELECT
        p.id,
        p.name,
        p.created_at,
        p.updated_at,
        a.slot_date,
        a.slot_time
      FROM participants p
      LEFT JOIN availability a ON a.participant_id = p.id
      WHERE p.poll_id = ? AND p.id = ?
      ORDER BY a.slot_date ASC, a.slot_time ASC
    `,
    [pollId, participantId],
  );
  const participants = groupParticipantRows(rows);
  return participants[0] || null;
}

async function findParticipantByName(pollId, name) {
  const [rows] = await pool.execute(
    'SELECT id FROM participants WHERE poll_id = ? AND name_key = ? LIMIT 1',
    [pollId, normalizeName(name)],
  );
  if (rows.length === 0) return null;
  return findParticipantById(pollId, rows[0].id);
}

export async function createOrGetParticipant(pollId, name) {
  const existing = await findParticipantByName(pollId, name);
  if (existing) {
    return { participant: existing, created: false };
  }

  const participantId = generateId();
  try {
    await pool.execute(
      `
        INSERT INTO participants (id, poll_id, name, name_key)
        VALUES (?, ?, ?, ?)
      `,
      [participantId, pollId, name, normalizeName(name)],
    );
  } catch (error) {
    if (error.code !== 'ER_DUP_ENTRY') throw error;
    const racedParticipant = await findParticipantByName(pollId, name);
    if (racedParticipant) {
      return { participant: racedParticipant, created: false };
    }
    throw error;
  }

  const participant = await findParticipantById(pollId, participantId);
  return { participant, created: true };
}

export async function replaceAvailability(pollId, participantId, slots) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [participantRows] = await connection.execute(
      'SELECT id FROM participants WHERE id = ? AND poll_id = ? FOR UPDATE',
      [participantId, pollId],
    );
    if (participantRows.length === 0) {
      throw new ApiError(404, 'PARTICIPANT_NOT_FOUND', 'Participant not found.');
    }

    await connection.execute('DELETE FROM availability WHERE participant_id = ?', [
      participantId,
    ]);

    if (slots.length > 0) {
      const parsedSlots = slots.map((key) => parseSlotKey(key));
      const placeholders = parsedSlots.map(() => '(?, ?, ?, ?)').join(', ');
      const values = parsedSlots.flatMap((slot) => [
        participantId,
        pollId,
        slot.date,
        slot.time,
      ]);
      await connection.query(
        `
          INSERT INTO availability (participant_id, poll_id, slot_date, slot_time)
          VALUES ${placeholders}
        `,
        values,
      );
    }

    await connection.execute(
      'UPDATE participants SET updated_at = CURRENT_TIMESTAMP(3) WHERE id = ?',
      [participantId],
    );

    await connection.commit();
  } catch (error) {
    try {
      await connection.rollback();
    } catch {
      // Preserve the original failure.
    }
    throw error;
  } finally {
    connection.release();
  }

  const participant = await findParticipantById(pollId, participantId);
  if (!participant) {
    throw new ApiError(404, 'PARTICIPANT_NOT_FOUND', 'Participant not found.');
  }
  return participant;
}

export async function listAvailabilityRows(pollId) {
  const [rows] = await pool.execute(
    `
      SELECT
        a.slot_date,
        a.slot_time,
        a.participant_id,
        p.name
      FROM availability a
      INNER JOIN participants p ON p.id = a.participant_id
      WHERE a.poll_id = ?
      ORDER BY a.slot_date ASC, a.slot_time ASC, p.name ASC
    `,
    [pollId],
  );

  return rows.map((row) => ({
    date: normalizeSqlDate(row.slot_date),
    time: normalizeSqlTime(row.slot_time),
    participantId: row.participant_id,
    name: row.name,
  }));
}
