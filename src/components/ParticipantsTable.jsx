import Button from './Button.jsx';
import { formatUpdatedAt } from '../lib/dates.js';
import { normalizeName } from '../lib/names.js';

export default function ParticipantsTable({
  participants = [],
  myName = '',
  viewingId = null,
  onView,
  onEdit,
}) {
  if (participants.length === 0) {
    return (
      <div className="rounded border border-gray-200 bg-white p-4 text-sm text-gray-500">
        No participant responses yet. Share the poll link to collect availability.
      </div>
    );
  }

  const myNormalized = normalizeName(myName);

  return (
    <div className="overflow-x-auto rounded border border-gray-200 bg-white">
      <table
        className="w-full text-left text-sm"
        aria-label="Participants and their availability"
      >
        <thead className="bg-gray-50 text-xs text-gray-600">
          <tr>
            <th scope="col" className="border-b border-gray-200 px-2 py-2 font-semibold sm:px-3">
              Participant
            </th>
            <th scope="col" className="border-b border-gray-200 px-2 py-2 font-semibold sm:px-3">
              Available slots
            </th>
            <th
              scope="col"
              className="hidden border-b border-gray-200 px-2 py-2 font-semibold sm:table-cell sm:px-3"
            >
              Last updated
            </th>
            <th
              scope="col"
              className="border-b border-gray-200 px-2 py-2 text-right font-semibold sm:px-3"
            >
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {participants.map((participant) => {
            const isMine =
              myNormalized && normalizeName(participant.name) === myNormalized;
            return (
              <tr key={participant.id} className="border-b border-gray-100 last:border-b-0">
                <td className="px-2 py-2 font-medium text-gray-900 sm:px-3">
                  {participant.name}
                  {isMine ? (
                    <span className="ml-2 text-xs font-normal text-gray-500">(you)</span>
                  ) : null}
                </td>
                <td className="whitespace-nowrap px-2 py-2 text-gray-600 sm:px-3">
                  {participant.slots.length} {participant.slots.length === 1 ? 'slot' : 'slots'}
                </td>
                <td className="hidden px-2 py-2 text-xs text-gray-500 sm:table-cell sm:px-3">
                  {formatUpdatedAt(participant.updatedAt)}
                </td>
                <td className="px-2 py-2 sm:px-3">
                  <div className="flex justify-end gap-1.5 whitespace-nowrap">
                    <Button
                      size="sm"
                      onClick={() => onView?.(participant)}
                      disabled={viewingId === participant.id}
                    >
                      {viewingId === participant.id ? 'Viewing' : 'View'}
                    </Button>
                    {isMine && onEdit ? (
                      <Button size="sm" variant="quiet" onClick={() => onEdit(participant)}>
                        Edit
                      </Button>
                    ) : null}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
