import { useEffect, useRef } from 'react';
import {
  formatDay,
  formatLongDate,
  formatSlotRange,
} from '../lib/dates.js';
import { slotKey } from '../lib/availability.js';

function groupCellTone(count, participantCount, isBest) {
  if (count === 0 || participantCount === 0) return 'bg-white text-gray-300';
  const ratio = count / participantCount;
  if (isBest) {
    return ratio >= 1 ? 'bg-green-200 text-green-900' : 'bg-green-100 text-green-900';
  }
  if (ratio >= 0.67) return 'bg-blue-200 text-gray-800';
  if (ratio >= 0.34) return 'bg-blue-100 text-gray-800';
  return 'bg-blue-50 text-gray-700';
}

export default function AvailabilityGrid({
  dates = [],
  times = [],
  interval = 30,
  mode = 'edit',
  selectedSlots = new Set(),
  counts = new Map(),
  participantCount = 0,
  bestSlots = new Set(),
  selectedSlot = null,
  onPaint,
  onCellClick,
  personName = '',
}) {
  const dragRef = useRef(null);
  const lastPointerType = useRef('mouse');

  useEffect(() => {
    function stopDragging() {
      dragRef.current = null;
    }

    window.addEventListener('pointerup', stopDragging);
    window.addEventListener('pointercancel', stopDragging);
    window.addEventListener('blur', stopDragging);
    return () => {
      window.removeEventListener('pointerup', stopDragging);
      window.removeEventListener('pointercancel', stopDragging);
      window.removeEventListener('blur', stopDragging);
    };
  }, []);

  if (dates.length === 0 || times.length === 0) {
    return (
      <div className="rounded border border-gray-200 bg-white p-4 text-sm text-gray-500">
        This poll does not have any time slots yet.
      </div>
    );
  }

  function handlePointerDown(event, key) {
    lastPointerType.current = event.pointerType || 'mouse';
    if (mode !== 'edit' || !onPaint) return;

    const isMouse = event.pointerType === 'mouse' || !event.pointerType;
    if (!isMouse) return;

    event.preventDefault();
    const shouldSelect = !selectedSlots.has(key);
    dragRef.current = { shouldSelect };
    onPaint(key, shouldSelect);
  }

  function handlePointerEnter(event, key) {
    if (mode !== 'edit' || !dragRef.current || !onPaint) return;
    if (event.buttons === 0) {
      dragRef.current = null;
      return;
    }
    onPaint(key, dragRef.current.shouldSelect);
  }

  function handleClick(key) {
    if (mode === 'group') {
      onCellClick?.(key);
      return;
    }

    if (mode === 'edit' && lastPointerType.current !== 'mouse') {
      onPaint?.(key, !selectedSlots.has(key));
    }
  }

  function handleKeyDown(event, key) {
    if (event.key !== ' ' && event.key !== 'Enter') return;
    if (mode === 'edit') {
      event.preventDefault();
      onPaint?.(key, !selectedSlots.has(key));
    } else if (mode === 'group') {
      event.preventDefault();
      onCellClick?.(key);
    }
  }

  return (
    <div
      id="availability-grid"
      className="max-h-[70vh] overflow-auto overscroll-contain rounded border border-gray-200 bg-white"
    >
      <table className="w-full min-w-max select-none border-separate border-spacing-0 text-center text-xs">
        <caption className="sr-only">
          {mode === 'edit'
            ? 'Select the time slots when you are available.'
            : 'Availability overview for all participants.'}
        </caption>
        <thead>
          <tr>
            <th
              scope="col"
              className="sticky left-0 top-0 z-30 w-16 min-w-16 border-b border-r border-gray-200 bg-gray-100 px-1 py-1 text-left text-[11px] font-semibold text-gray-600"
            >
              Time
            </th>
            {dates.map((date) => {
              const day = formatDay(date);
              return (
                <th
                  key={date}
                  scope="col"
                  className="sticky top-0 z-20 min-w-[86px] border-b border-r border-gray-200 bg-gray-100 px-1 py-1 font-semibold text-gray-700 last:border-r-0"
                  aria-label={formatLongDate(date)}
                >
                  <span className="block text-[11px] leading-4">{day.weekday}</span>
                  <span className="block text-[11px] font-normal leading-4 text-gray-600">
                    {day.monthDay}
                  </span>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {times.map((time) => (
            <tr key={time}>
              <th
                scope="row"
                className="sticky left-0 z-10 w-16 min-w-16 border-b border-r border-gray-200 bg-gray-50 px-1 py-1 text-left text-[11px] font-normal tabular-nums text-gray-600"
              >
                {time}
              </th>
              {dates.map((date) => {
                const key = slotKey(date, time);
                const isSelected = selectedSlots.has(key);
                const count = counts.get(key) || 0;
                const isBest = bestSlots.has(key);
                const isInspected = selectedSlot === key;
                const slotRange = formatSlotRange(time, interval);

                let tone = '';
                let content = null;
                let label = '';

                if (mode === 'group') {
                  tone = groupCellTone(count, participantCount, isBest);
                  content = participantCount > 0 ? count : '';
                  label = `${formatLongDate(date)}, ${slotRange}: ${count} of ${participantCount} participants available`;
                } else if (mode === 'participant') {
                  tone = isSelected
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-white text-transparent';
                  content = isSelected ? '✓' : '';
                  label = `${formatLongDate(date)}, ${slotRange}: ${
                    isSelected ? 'available' : 'not available'
                  }${personName ? ` for ${personName}` : ''}`;
                } else {
                  tone = isSelected
                    ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    : 'bg-white text-transparent hover:bg-gray-50';
                  content = isSelected ? '✓' : '';
                  label = `${formatLongDate(date)}, ${slotRange}: ${
                    isSelected ? 'selected' : 'not selected'
                  }`;
                }

                const bestRing =
                  mode === 'group' && isBest && count > 0
                    ? 'font-semibold ring-1 ring-inset ring-green-700'
                    : '';
                const inspectRing =
                  mode === 'group' && isInspected
                    ? 'ring-2 ring-inset ring-blue-700'
                    : '';

                return (
                  <td
                    key={key}
                    role={mode === 'participant' ? undefined : mode === 'edit' ? 'checkbox' : 'button'}
                    tabIndex={mode === 'participant' ? undefined : 0}
                    aria-checked={mode === 'edit' ? isSelected : undefined}
                    aria-label={label}
                    title={label}
                    className={`h-8 border-b border-r border-gray-200 p-0 align-middle text-[11px] focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-600 sm:h-7 ${
                      mode === 'participant' ? '' : 'cursor-pointer'
                    } ${tone} ${bestRing} ${inspectRing}`}
                    onPointerDown={(event) => handlePointerDown(event, key)}
                    onPointerEnter={(event) => handlePointerEnter(event, key)}
                    onClick={() => handleClick(key)}
                    onKeyDown={(event) => handleKeyDown(event, key)}
                  >
                    <span className="flex h-full w-full items-center justify-center leading-none">
                      {content}
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
