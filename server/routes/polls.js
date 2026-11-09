import { Router } from 'express';
import {
  buildTimeSlots,
  slotKey,
} from '../lib/availability.js';
import { ApiError, asyncHandler } from '../lib/http.js';
import {
  validateAvailabilityInput,
  validateCreatePollInput,
  validateParticipantInput,
} from '../lib/validation.js';
import {
  createOrGetParticipant,
  createPoll,
  findPollById,
  listAvailabilityRows,
  listParticipants,
  listPolls,
  replaceAvailability,
} from '../repositories/pollRepository.js';

const router = Router();

async function getPollOrThrow(pollId) {
  const poll = await findPollById(pollId);
  if (!poll) {
    throw new ApiError(404, 'POLL_NOT_FOUND', 'Poll not found.');
  }
  return poll;
}

router.get(
  '/',
  asyncHandler(async (request, response) => {
    const polls = await listPolls();
    response.status(200).json({ polls });
  }),
);

router.post(
  '/',
  asyncHandler(async (request, response) => {
    const input = validateCreatePollInput(request.body);
    const poll = await createPoll(input);
    response.status(201).json({ poll });
  }),
);

router.get(
  '/:id',
  asyncHandler(async (request, response) => {
    const poll = await getPollOrThrow(request.params.id);
    response.status(200).json({ poll });
  }),
);

router.get(
  '/:id/participants',
  asyncHandler(async (request, response) => {
    await getPollOrThrow(request.params.id);
    const participants = await listParticipants(request.params.id);
    response.status(200).json({ participants });
  }),
);

router.post(
  '/:id/participants',
  asyncHandler(async (request, response) => {
    await getPollOrThrow(request.params.id);
    const { name } = validateParticipantInput(request.body);
    const result = await createOrGetParticipant(request.params.id, name);
    response.status(result.created ? 201 : 200).json(result);
  }),
);

router.get(
  '/:id/availability',
  asyncHandler(async (request, response) => {
    const poll = await getPollOrThrow(request.params.id);
    const times = buildTimeSlots(poll.startTime, poll.endTime, poll.interval);
    const rows = await listAvailabilityRows(poll.id);
    const grouped = new Map();

    for (const row of rows) {
      const key = slotKey(row.date, row.time);
      if (!grouped.has(key)) {
        grouped.set(key, { participantIds: [], participantNames: [] });
      }
      const entry = grouped.get(key);
      if (!entry.participantIds.includes(row.participantId)) {
        entry.participantIds.push(row.participantId);
        entry.participantNames.push(row.name);
      }
    }

    let bestCount = 0;
    const slots = [];
    for (const date of poll.dates) {
      for (const time of times) {
        const key = slotKey(date, time);
        const entry = grouped.get(key) || { participantIds: [], participantNames: [] };
        const count = entry.participantIds.length;
        if (count > bestCount) bestCount = count;
        slots.push({
          date,
          time,
          count,
          participantIds: entry.participantIds,
          participantNames: entry.participantNames,
        });
      }
    }

    response.status(200).json({
      availability: {
        pollId: poll.id,
        participantCount: poll.participantCount || 0,
        dates: poll.dates,
        times,
        bestCount,
        slots,
      },
    });
  }),
);

router.post(
  '/:id/availability',
  asyncHandler(async (request, response) => {
    const poll = await getPollOrThrow(request.params.id);
    const { participantId, slots } = validateAvailabilityInput(request.body);
    const times = buildTimeSlots(poll.startTime, poll.endTime, poll.interval);
    const validSlots = new Set();

    for (const date of poll.dates) {
      for (const time of times) {
        validSlots.add(slotKey(date, time));
      }
    }

    const invalidSlot = slots.find((key) => !validSlots.has(key));
    if (invalidSlot) {
      throw new ApiError(
        400,
        'INVALID_SLOT',
        `Availability slot "${invalidSlot}" is outside this poll's schedule.`,
      );
    }

    const participant = await replaceAvailability(poll.id, participantId, slots);
    response.status(200).json({
      participant,
      savedCount: participant.slots.length,
    });
  }),
);

export default router;
