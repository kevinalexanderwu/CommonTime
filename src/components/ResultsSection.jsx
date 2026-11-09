import { useMemo } from 'react';
import {
  buildTimeSlots,
  formatDateSpan,
  formatShortDate,
  formatSlotRange,
} from '../lib/dates.js';
import { countBySlot, slotKey } from '../lib/availability.js';

export default function ResultsSection({ poll, participants }) {
  const times = useMemo(
    () => buildTimeSlots(poll.startTime, poll.endTime, poll.interval),
    [poll.startTime, poll.endTime, poll.interval],
  );

  const namesBySlot = useMemo(() => {
    const map = new Map();
    participants.forEach((participant) => {
      participant.slots.forEach((key) => {
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(participant.name);
      });
    });
    return map;
  }, [participants]);

  const counts = useMemo(
    () => countBySlot(poll.dates, times, participants),
    [poll.dates, times, participants],
  );

  const rankedSlots = useMemo(() => {
    const rows = [];
    poll.dates.forEach((date) => {
      times.forEach((time) => {
        const key = slotKey(date, time);
        const count = counts.get(key) || 0;
        if (count > 0) {
          rows.push({
            key,
            date,
            time,
            count,
            names: namesBySlot.get(key) || [],
          });
        }
      });
    });

    return rows.sort(
      (a, b) =>
        b.count - a.count ||
        a.date.localeCompare(b.date) ||
        a.time.localeCompare(b.time),
    );
  }, [poll.dates, times, counts, namesBySlot]);

  const maxCount = rankedSlots[0]?.count || 0;
  const bestSlots = maxCount > 0 ? rankedSlots.filter((slot) => slot.count === maxCount) : [];
  const visibleBestSlots = bestSlots.slice(0, 12);
  const bestDateKeys = [...new Set(bestSlots.map((slot) => slot.date))];
  const everyoneAvailable = maxCount > 0 && maxCount === participants.length;

  return (
    <section className="mt-6 rounded border border-gray-200 bg-white" aria-labelledby="results-heading">
      <div className="border-b border-gray-200 px-4 py-3">
        <h2 id="results-heading" className="text-base font-bold text-gray-900">
          Results
        </h2>
        <p className="mt-0.5 text-xs text-gray-500">
          Time slots are ranked by the number of participants available.
        </p>
      </div>

      {participants.length === 0 ? (
        <div className="p-4 text-sm text-gray-500">
          There are no responses yet. Results will appear after participants submit their
          availability.
        </div>
      ) : maxCount === 0 ? (
        <div className="p-4 text-sm text-gray-500">
          Participants have not selected any available time slots yet.
        </div>
      ) : (
        <div className="p-4">
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="rounded border border-gray-200 bg-gray-50 p-2.5">
              <div className="text-xs text-gray-500">Participants</div>
              <div className="mt-0.5 text-lg font-semibold tabular-nums text-gray-900">
                {participants.length}
              </div>
            </div>
            <div
              className={`rounded border p-2.5 ${
                everyoneAvailable
                  ? 'border-green-200 bg-green-50'
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="text-xs text-gray-500">Highest availability</div>
              <div className="mt-0.5 text-lg font-semibold tabular-nums text-gray-900">
                {maxCount} of {participants.length}
              </div>
            </div>
            <div className="rounded border border-gray-200 bg-gray-50 p-2.5">
              <div className="text-xs text-gray-500">Best date</div>
              <div className="mt-1 text-sm font-semibold leading-5 text-gray-900">
                {formatDateSpan(bestDateKeys)}
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-baseline justify-between gap-1">
            <h3 className="text-sm font-semibold text-gray-900">Most suitable time slots</h3>
            <span className="text-xs text-gray-500">
              {bestSlots.length} {bestSlots.length === 1 ? 'slot' : 'slots'} with the best overlap
            </span>
          </div>

          {everyoneAvailable ? (
            <p className="mt-1 text-xs text-green-700">
              Every participant is available at these times.
            </p>
          ) : (
            <p className="mt-1 text-xs text-gray-500">
              No time works for everyone yet. These are the slots with the highest overlap.
            </p>
          )}

          <div className="mt-2 overflow-x-auto rounded border border-gray-200">
            <table
              className="w-full text-left text-xs sm:text-sm"
              aria-label="Most suitable time slots"
            >
              <thead className="bg-gray-50 text-xs text-gray-600">
                <tr>
                  <th scope="col" className="border-b border-gray-200 px-2 py-2 font-semibold sm:px-3">
                    Date
                  </th>
                  <th scope="col" className="border-b border-gray-200 px-2 py-2 font-semibold sm:px-3">
                    Time
                  </th>
                  <th scope="col" className="border-b border-gray-200 px-2 py-2 font-semibold sm:px-3">
                    Available
                  </th>
                  <th scope="col" className="border-b border-gray-200 px-2 py-2 font-semibold sm:px-3">
                    Who is available
                  </th>
                </tr>
              </thead>
              <tbody>
                {visibleBestSlots.map((slot) => (
                  <tr
                    key={slot.key}
                    className="border-b border-gray-100 bg-green-50/60 last:border-b-0"
                  >
                    <td className="whitespace-nowrap px-2 py-2 text-gray-800 sm:px-3">
                      {formatShortDate(slot.date)}
                    </td>
                    <td className="whitespace-nowrap px-2 py-2 tabular-nums text-gray-800 sm:px-3">
                      {formatSlotRange(slot.time, poll.interval)}
                    </td>
                    <td className="whitespace-nowrap px-2 py-2 font-medium tabular-nums text-gray-900 sm:px-3">
                      {slot.count} / {participants.length}
                    </td>
                    <td className="px-2 py-2 text-xs text-gray-600 sm:px-3">
                      <span title={slot.names.join(', ')}>{slot.names.join(', ')}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {bestSlots.length > visibleBestSlots.length ? (
            <p className="mt-2 text-xs text-gray-500">
              Showing the first {visibleBestSlots.length} of {bestSlots.length} equally good
              slots. See the group grid for all availability counts.
            </p>
          ) : null}
        </div>
      )}
    </section>
  );
}
