import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AppHeader from '../components/AppHeader.jsx';
import Button from '../components/Button.jsx';
import {
  addDaysToKey,
  buildTimeSlots,
  formatShortDate,
  getDatesInRange,
  isValidDateKey,
  MAX_POLL_DAYS,
  todayKey,
} from '../lib/dates.js';
import { errorClass, helperClass, inputClass, labelClass } from '../lib/styles.js';
import { pollService } from '../services/pollService.js';

const intervalOptions = [
  { value: 15, label: '15 minutes' },
  { value: 30, label: '30 minutes' },
  { value: 60, label: '60 minutes' },
];

export default function CreatePollPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dateMode, setDateMode] = useState('range');
  const [rangeStart, setRangeStart] = useState(() => todayKey());
  const [rangeEnd, setRangeEnd] = useState(() => addDaysToKey(todayKey(), 6));
  const [specificDates, setSpecificDates] = useState([]);
  const [specificInput, setSpecificInput] = useState(() => todayKey());
  const [specificError, setSpecificError] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [interval, setIntervalValue] = useState(30);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const dates = useMemo(() => {
    if (dateMode === 'range') return getDatesInRange(rangeStart, rangeEnd);
    return [...specificDates].sort();
  }, [dateMode, rangeStart, rangeEnd, specificDates]);

  const timeSlots = useMemo(
    () => buildTimeSlots(startTime, endTime, interval),
    [startTime, endTime, interval],
  );

  const totalSlots = dates.length * timeSlots.length;

  function switchDateMode(mode) {
    setDateMode(mode);
    setSpecificError('');
    setErrors((previous) => ({ ...previous, dates: undefined }));
  }

  function addSpecificDate() {
    setSpecificError('');
    if (!isValidDateKey(specificInput)) {
      setSpecificError('Choose a valid date.');
      return;
    }
    if (specificDates.includes(specificInput)) {
      setSpecificError('That date has already been added.');
      return;
    }
    if (specificDates.length >= MAX_POLL_DAYS) {
      setSpecificError(`You can add up to ${MAX_POLL_DAYS} dates.`);
      return;
    }
    setSpecificDates((previous) => [...previous, specificInput].sort());
    setErrors((previous) => ({ ...previous, dates: undefined }));
  }

  function removeSpecificDate(dateKey) {
    setSpecificDates((previous) => previous.filter((date) => date !== dateKey));
  }

  function handleSpecificKeyDown(event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      addSpecificDate();
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitError('');

    const nextErrors = {};
    const trimmedTitle = title.trim();

    if (!trimmedTitle) nextErrors.title = 'Enter an event title.';
    if (trimmedTitle.length > 100) {
      nextErrors.title = 'Keep the event title to 100 characters or fewer.';
    }
    if (dates.length === 0) {
      nextErrors.dates =
        dateMode === 'range'
          ? 'Choose a valid start and end date.'
          : 'Add at least one specific date.';
    } else if (dates.length > MAX_POLL_DAYS) {
      nextErrors.dates = `Polls can cover up to ${MAX_POLL_DAYS} dates.`;
    }
    if (!startTime || !endTime || startTime >= endTime) {
      nextErrors.time = 'The end time must be after the start time.';
    } else if (timeSlots.length === 0) {
      nextErrors.time = 'The time range must fit at least one time slot.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      const poll = await pollService.createPoll({
        title: trimmedTitle,
        description,
        dates,
        startTime,
        endTime,
        interval,
      });
      navigate(`/poll/${poll.id}?created=1`);
    } catch (error) {
      setSubmitError(error.message || 'The poll could not be created.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="mx-auto max-w-2xl px-4 py-6">
        <Link to="/" className="text-xs text-blue-700 hover:underline">
          ← Back to home
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">Create a scheduling poll</h1>
        <p className="mt-1 text-sm text-gray-600">
          Set the dates and times you want to compare, then share the poll with participants.
        </p>

        <form onSubmit={handleSubmit} className="mt-4 rounded border border-gray-200 bg-white">
          <section className="border-b border-gray-200 p-4">
            <h2 className="text-sm font-bold text-gray-900">Event details</h2>
            <div className="mt-3 space-y-3">
              <div>
                <label htmlFor="poll-title" className={labelClass}>
                  Event title
                </label>
                <input
                  id="poll-title"
                  type="text"
                  className={inputClass}
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="e.g. Team Meeting"
                  maxLength={100}
                  autoFocus
                />
                {errors.title ? <p className={errorClass}>{errors.title}</p> : null}
              </div>
              <div>
                <label htmlFor="poll-description" className={labelClass}>
                  Description <span className="font-normal text-gray-500">(optional)</span>
                </label>
                <textarea
                  id="poll-description"
                  className={`${inputClass} min-h-20 resize-y`}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Add a note about the meeting or activity."
                  maxLength={500}
                  rows={3}
                />
              </div>
            </div>
          </section>

          <section className="border-b border-gray-200 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-bold text-gray-900">Dates</h2>
              <div className="flex rounded border border-gray-300 bg-white p-0.5">
                <button
                  type="button"
                  aria-pressed={dateMode === 'range'}
                  onClick={() => switchDateMode('range')}
                  className={`rounded px-2 py-1 text-xs ${
                    dateMode === 'range'
                      ? 'bg-blue-50 font-semibold text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Date range
                </button>
                <button
                  type="button"
                  aria-pressed={dateMode === 'specific'}
                  onClick={() => switchDateMode('specific')}
                  className={`rounded px-2 py-1 text-xs ${
                    dateMode === 'specific'
                      ? 'bg-blue-50 font-semibold text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Specific dates
                </button>
              </div>
            </div>

            {dateMode === 'range' ? (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="range-start" className={labelClass}>
                    Start date
                  </label>
                  <input
                    id="range-start"
                    type="date"
                    className={inputClass}
                    value={rangeStart}
                    onChange={(event) => setRangeStart(event.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="range-end" className={labelClass}>
                    End date
                  </label>
                  <input
                    id="range-end"
                    type="date"
                    className={inputClass}
                    value={rangeEnd}
                    onChange={(event) => setRangeEnd(event.target.value)}
                  />
                </div>
                <p className={`${helperClass} sm:col-span-2`}>
                  {dates.length > MAX_POLL_DAYS
                    ? `Choose a range of ${MAX_POLL_DAYS} days or fewer.`
                    : `${dates.length} ${dates.length === 1 ? 'date' : 'dates'} in this range.`}
                </p>
              </div>
            ) : (
              <div className="mt-3">
                <div className="flex flex-wrap items-end gap-2">
                  <div className="min-w-40 flex-1">
                    <label htmlFor="specific-date" className={labelClass}>
                      Add a date
                    </label>
                    <input
                      id="specific-date"
                      type="date"
                      className={inputClass}
                      value={specificInput}
                      onChange={(event) => setSpecificInput(event.target.value)}
                      onKeyDown={handleSpecificKeyDown}
                    />
                  </div>
                  <Button size="md" onClick={addSpecificDate}>
                    Add date
                  </Button>
                </div>
                {specificError ? <p className={errorClass}>{specificError}</p> : null}
                {specificDates.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {specificDates.map((date) => (
                      <span
                        key={date}
                        className="inline-flex items-center gap-1 rounded border border-gray-300 bg-gray-50 py-1 pl-2 pr-1 text-xs text-gray-700"
                      >
                        {formatShortDate(date)}
                        <button
                          type="button"
                          onClick={() => removeSpecificDate(date)}
                          className="rounded px-1 text-gray-500 hover:bg-gray-200 hover:text-gray-800"
                          aria-label={`Remove ${formatShortDate(date)}`}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className={helperClass}>No specific dates added yet.</p>
                )}
              </div>
            )}
            {errors.dates ? <p className={errorClass}>{errors.dates}</p> : null}
          </section>

          <section className="border-b border-gray-200 p-4">
            <h2 className="text-sm font-bold text-gray-900">Time range</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <div>
                <label htmlFor="start-time" className={labelClass}>
                  Start time
                </label>
                <input
                  id="start-time"
                  type="time"
                  className={inputClass}
                  value={startTime}
                  onChange={(event) => setStartTime(event.target.value)}
                />
              </div>
              <div>
                <label htmlFor="end-time" className={labelClass}>
                  End time
                </label>
                <input
                  id="end-time"
                  type="time"
                  className={inputClass}
                  value={endTime}
                  onChange={(event) => setEndTime(event.target.value)}
                />
              </div>
              <div>
                <label htmlFor="slot-interval" className={labelClass}>
                  Time slot interval
                </label>
                <select
                  id="slot-interval"
                  className={inputClass}
                  value={interval}
                  onChange={(event) => setIntervalValue(Number(event.target.value))}
                >
                  {intervalOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {errors.time ? <p className={errorClass}>{errors.time}</p> : null}
            <p className={helperClass}>
              {timeSlots.length > 0
                ? `${timeSlots.length} slots per day (last slot starts at ${
                    timeSlots[timeSlots.length - 1]
                  }).`
                : 'The current time range does not fit a full slot.'}
            </p>
          </section>

          <section className="p-4">
            <div className="rounded border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
              <span className="font-semibold">{dates.length}</span>{' '}
              {dates.length === 1 ? 'date' : 'dates'} ·{' '}
              <span className="font-semibold">{timeSlots.length}</span> slots per day ·{' '}
              <span className="font-semibold">{totalSlots}</span> total cells
            </div>
            {submitError ? <p className={errorClass}>{submitError}</p> : null}
            <div className="mt-3 flex items-center justify-end gap-2">
              <Link
                to="/"
                className="rounded px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </Link>
              <Button type="submit" variant="primary" disabled={submitting}>
                {submitting ? 'Creating…' : 'Create poll'}
              </Button>
            </div>
          </section>
        </form>
      </main>
    </div>
  );
}
