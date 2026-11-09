import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import AppHeader from '../components/AppHeader.jsx';
import AvailabilityGrid from '../components/AvailabilityGrid.jsx';
import AvailabilityLegend from '../components/AvailabilityLegend.jsx';
import Button, { buttonClass } from '../components/Button.jsx';
import ParticipantsTable from '../components/ParticipantsTable.jsx';
import ResultsSection from '../components/ResultsSection.jsx';
import ShareLink from '../components/ShareLink.jsx';
import { useAvailabilitySelection } from '../hooks/useAvailabilitySelection.js';
import { usePollData } from '../hooks/usePollData.js';
import {
  countBySlot,
  countDatesInSelection,
  getBestSlotKeys,
  getSlotsForParticipant,
  splitSlotKey,
} from '../lib/availability.js';
import {
  buildTimeSlots,
  formatDateSpan,
  formatLongDate,
  formatSlotRange,
} from '../lib/dates.js';
import { cleanName, normalizeName } from '../lib/names.js';
import { errorClass, inputClass, labelClass } from '../lib/styles.js';
import { getPollUrl } from '../lib/urls.js';
import { pollService } from '../services/pollService.js';

export default function PollPage() {
  const { pollId } = useParams();
  const [searchParams] = useSearchParams();
  const { poll, participants, loading, error, refresh } = usePollData(pollId);

  const [activeTab, setActiveTab] = useState('respond');
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState('');
  const [loadedParticipantId, setLoadedParticipantId] = useState(null);
  const [notice, setNotice] = useState(null);
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);
  const [viewingParticipantId, setViewingParticipantId] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);

  const initializedRef = useRef(false);
  const {
    selected,
    selectedArray,
    count,
    paint,
    clear: clearSelection,
    replace: replaceSelection,
  } = useAvailabilitySelection();

  const times = useMemo(
    () => (poll ? buildTimeSlots(poll.startTime, poll.endTime, poll.interval) : []),
    [poll],
  );

  const counts = useMemo(
    () => (poll ? countBySlot(poll.dates, times, participants) : new Map()),
    [poll, times, participants],
  );

  const { maxCount, keys: bestSlotKeys } = useMemo(
    () => getBestSlotKeys(counts),
    [counts],
  );

  const mySavedName = poll ? pollService.getSavedName(poll.id) : '';
  const viewingParticipant =
    participants.find((participant) => participant.id === viewingParticipantId) || null;
  const matchedParticipant =
    participants.find(
      (participant) =>
        normalizeName(participant.name) === normalizeName(name) && cleanName(name),
    ) || null;
  const isEditingMatched =
    matchedParticipant && matchedParticipant.id === loadedParticipantId;
  const selectedSlotParts = selectedSlot ? splitSlotKey(selectedSlot) : null;
  const selectedSlotNames = selectedSlot
    ? participants
        .filter((participant) => participant.slots.includes(selectedSlot))
        .map((participant) => participant.name)
    : [];

  useEffect(() => {
    if (loading || !poll || initializedRef.current) return;
    initializedRef.current = true;

    const savedName = pollService.getSavedName(poll.id);
    if (!savedName) return;

    setName(savedName);
    const savedResponse = participants.find(
      (participant) => normalizeName(participant.name) === normalizeName(savedName),
    );
    if (savedResponse) {
      replaceSelection(savedResponse.slots);
      setLoadedParticipantId(savedResponse.id);
    }
  }, [loading, poll, participants, replaceSelection]);

  function handleNameChange(value) {
    setName(value);
    setNameError('');
    setSaveError('');
    setNotice(null);

    if (loadedParticipantId) {
      const loaded = participants.find((participant) => participant.id === loadedParticipantId);
      if (loaded && normalizeName(value) !== normalizeName(loaded.name)) {
        setLoadedParticipantId(null);
      }
    }
  }

  function handleLoadExisting() {
    if (!matchedParticipant) return;
    replaceSelection(matchedParticipant.slots);
    setLoadedParticipantId(matchedParticipant.id);
    setName(matchedParticipant.name);
    setNotice({
      type: 'info',
      text: `Loaded the saved availability for ${matchedParticipant.name}.`,
    });
    setSaveError('');
  }

  async function handleSave(event) {
    event.preventDefault();
    setSaveError('');
    setNameError('');

    const cleaned = cleanName(name);
    if (!cleaned) {
      setNameError('Enter your name before saving.');
      return;
    }
    if (cleaned.length > 50) {
      setNameError('Names must be 50 characters or fewer.');
      return;
    }
    if (count === 0) {
      setSaveError('Select at least one time slot before saving.');
      return;
    }

    setSaving(true);
    try {
      const result = await pollService.saveResponse(poll.id, cleaned, selectedArray);
      await refresh();
      setName(result.participant.name);
      setLoadedParticipantId(result.participant.id);
      setNotice({
        type: 'success',
        text: result.updated
          ? `Your availability was updated for ${result.participant.name}.`
          : `Your availability was saved for ${result.participant.name}.`,
      });
      setActiveTab('group');
      setViewingParticipantId(null);
      setSelectedSlot(null);
    } catch (saveFailure) {
      setSaveError(saveFailure.message || 'Your availability could not be saved.');
    } finally {
      setSaving(false);
    }
  }

  function handleViewParticipant(participant) {
    setViewingParticipantId(participant.id);
    setSelectedSlot(null);
    setActiveTab('group');
  }

  function handleEditParticipant(participant) {
    setName(participant.name);
    replaceSelection(participant.slots);
    setLoadedParticipantId(participant.id);
    setActiveTab('respond');
    setNotice({ type: 'info', text: `Editing the saved availability for ${participant.name}.` });
    setNameError('');
    setSaveError('');
  }

  function handleGroupCellClick(key) {
    if (viewingParticipant) return;
    setSelectedSlot((current) => (current === key ? null : key));
  }

  function handleViewingChange(value) {
    setViewingParticipantId(value === 'group' ? null : value);
    setSelectedSlot(null);
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <AppHeader />
        <main className="mx-auto max-w-2xl px-4 py-10">
          <p className="text-sm text-gray-600">Loading poll…</p>
        </main>
      </div>
    );
  }

  if (!poll) {
    return (
      <div className="min-h-screen">
        <AppHeader />
        <main className="mx-auto max-w-2xl px-4 py-10">
          <h1 className="text-2xl font-bold text-gray-900">Poll not found</h1>
          <p className="mt-2 text-sm leading-6 text-gray-600">
            {error || 'This poll may have been removed or the link is incorrect.'}
          </p>
          <Link to="/create" className={`${buttonClass('primary', 'md')} mt-4`}>
            Create a new poll
          </Link>
        </main>
      </div>
    );
  }

  const pollUrl = getPollUrl(poll.id);
  const isCreated = searchParams.get('created') === '1';
  const selectedDayCount = countDatesInSelection(selected);

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Link to="/" className="text-xs text-blue-700 hover:underline">
          ← Home
        </Link>

        <div className="mt-2 flex flex-col gap-4 border-b border-gray-200 pb-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold leading-tight text-gray-900">{poll.title}</h1>
            {poll.description ? (
              <p className="mt-1 whitespace-pre-line text-sm leading-6 text-gray-600">
                {poll.description}
              </p>
            ) : null}
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-600">
              <span>{formatDateSpan(poll.dates)}</span>
              <span aria-hidden="true">·</span>
              <span>
                {poll.dates.length} {poll.dates.length === 1 ? 'date' : 'dates'}
              </span>
              <span aria-hidden="true">·</span>
              <span>
                {poll.startTime}–{poll.endTime}
              </span>
              <span aria-hidden="true">·</span>
              <span>{poll.interval}-minute slots</span>
              <span aria-hidden="true">·</span>
              <span>
                {participants.length}{' '}
                {participants.length === 1 ? 'participant' : 'participants'}
              </span>
            </div>
          </div>
          <ShareLink url={pollUrl} />
        </div>

        {isCreated ? (
          <div className="mt-3 rounded border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-gray-700">
            Poll created. Copy the link above and share it with participants.
          </div>
        ) : null}

        {notice ? (
          <div
            role="status"
            className={`mt-3 flex items-start justify-between gap-3 rounded border px-3 py-2 text-sm ${
              notice.type === 'success'
                ? 'border-green-200 bg-green-50 text-green-800'
                : 'border-blue-200 bg-blue-50 text-gray-700'
            }`}
          >
            <span>{notice.text}</span>
            <button
              type="button"
              className="text-xs text-gray-500 hover:text-gray-800"
              onClick={() => setNotice(null)}
            >
              Dismiss
            </button>
          </div>
        ) : null}

        <div className="mt-4 border-b border-gray-200" role="tablist" aria-label="Poll views">
          <button
            type="button"
            role="tab"
            id="respond-tab"
            aria-selected={activeTab === 'respond'}
            aria-controls="respond-panel"
            onClick={() => setActiveTab('respond')}
            className={`-mb-px border-b-2 px-3 py-2 text-sm ${
              activeTab === 'respond'
                ? 'border-blue-600 font-semibold text-blue-700'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Your availability
          </button>
          <button
            type="button"
            role="tab"
            id="group-tab"
            aria-selected={activeTab === 'group'}
            aria-controls="group-panel"
            onClick={() => setActiveTab('group')}
            className={`-mb-px border-b-2 px-3 py-2 text-sm ${
              activeTab === 'group'
                ? 'border-blue-600 font-semibold text-blue-700'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Group overview
          </button>
        </div>

        {activeTab === 'respond' ? (
          <section
            id="respond-panel"
            role="tabpanel"
            aria-labelledby="respond-tab"
            className="mt-4"
          >
            <div className="rounded border border-gray-200 bg-white">
              <form onSubmit={handleSave}>
                <div className="border-b border-gray-200 p-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div className="w-full sm:max-w-sm">
                      <label htmlFor="participant-name" className={labelClass}>
                        Your name
                      </label>
                      <input
                        id="participant-name"
                        type="text"
                        className={inputClass}
                        value={name}
                        onChange={(event) => handleNameChange(event.target.value)}
                        placeholder="Enter your name"
                        autoComplete="name"
                        maxLength={50}
                      />
                      {nameError ? <p className={errorClass}>{nameError}</p> : null}
                    </div>
                    <p className="text-xs text-gray-500 sm:pb-2">
                      {loadedParticipantId
                        ? 'You are editing a saved response.'
                        : 'No account is needed. Your name identifies your response.'}
                    </p>
                  </div>

                  {matchedParticipant && !isEditingMatched ? (
                    <div className="mt-2 rounded border border-blue-200 bg-blue-50 px-2.5 py-2 text-xs text-gray-700">
                      A response already exists for {matchedParticipant.name}.{' '}
                      <button
                        type="button"
                        className="font-medium text-blue-700 hover:underline"
                        onClick={handleLoadExisting}
                      >
                        Load the saved response
                      </button>{' '}
                      or save to update it.
                    </div>
                  ) : null}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 px-3 py-2">
                  <p className="text-xs text-gray-600">
                    Click a cell to toggle it. Drag across cells to select several.
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-600">{count} selected</span>
                    <Button size="sm" onClick={clearSelection} disabled={count === 0}>
                      Clear
                    </Button>
                  </div>
                </div>

                <div className="p-2 sm:p-3">
                  <AvailabilityGrid
                    dates={poll.dates}
                    times={times}
                    interval={poll.interval}
                    mode="edit"
                    selectedSlots={selected}
                    onPaint={paint}
                  />
                </div>

                {saveError ? (
                  <div className="px-3 pb-2">
                    <p className={errorClass}>{saveError}</p>
                  </div>
                ) : null}

                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-200 p-3">
                  <p className="text-xs text-gray-600">
                    {count === 0
                      ? 'No time slots selected yet.'
                      : `${count} ${count === 1 ? 'slot' : 'slots'} selected across ${selectedDayCount} ${
                          selectedDayCount === 1 ? 'date' : 'dates'
                        }.`}
                  </p>
                  <Button type="submit" variant="primary" disabled={saving}>
                    {saving ? 'Saving…' : 'Save availability'}
                  </Button>
                </div>
              </form>
            </div>
          </section>
        ) : (
          <section
            id="group-panel"
            role="tabpanel"
            aria-labelledby="group-tab"
            className="mt-4"
          >
            <div className="rounded border border-gray-200 bg-white">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 px-3 py-2">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <label htmlFor="group-view" className="font-semibold text-gray-700">
                    Show:
                  </label>
                  <select
                    id="group-view"
                    className={`${inputClass} w-auto py-1 text-xs`}
                    value={viewingParticipantId || 'group'}
                    onChange={(event) => handleViewingChange(event.target.value)}
                  >
                    <option value="group">Group availability</option>
                    {participants.map((participant) => (
                      <option key={participant.id} value={participant.id}>
                        {participant.name}
                      </option>
                    ))}
                  </select>
                  <span className="text-gray-500">
                    {viewingParticipant
                      ? `${viewingParticipant.slots.length} slots selected`
                      : `${participants.length} ${
                          participants.length === 1 ? 'participant' : 'participants'
                        }`}
                  </span>
                </div>
                {viewingParticipant ? (
                  <Button size="sm" onClick={() => handleViewingChange('group')}>
                    Back to group
                  </Button>
                ) : (
                  <span className="text-xs text-gray-500">
                    Numbers show how many people are available.
                  </span>
                )}
              </div>

              <div className="border-b border-gray-200 px-3 py-2">
                {viewingParticipant ? (
                  <p className="text-xs text-gray-600">
                    Viewing the availability submitted by{' '}
                    <span className="font-semibold text-gray-900">{viewingParticipant.name}</span>.
                  </p>
                ) : (
                  <AvailabilityLegend />
                )}
              </div>

              <div className="p-2 sm:p-3">
                <AvailabilityGrid
                  dates={poll.dates}
                  times={times}
                  interval={poll.interval}
                  mode={viewingParticipant ? 'participant' : 'group'}
                  selectedSlots={
                    viewingParticipant
                      ? getSlotsForParticipant(viewingParticipant)
                      : new Set()
                  }
                  counts={counts}
                  participantCount={participants.length}
                  bestSlots={bestSlotKeys}
                  selectedSlot={selectedSlot}
                  onCellClick={handleGroupCellClick}
                  personName={viewingParticipant?.name || ''}
                />
              </div>

              {selectedSlot && selectedSlotParts && !viewingParticipant ? (
                <div className="border-t border-gray-200 bg-gray-50 p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {formatLongDate(selectedSlotParts.date)} ·{' '}
                        {formatSlotRange(selectedSlotParts.time, poll.interval)}
                      </p>
                      <p className="mt-1 text-xs text-gray-600">
                        {selectedSlotNames.length} of {participants.length} participants
                        available
                        {selectedSlotNames.length > 0
                          ? `: ${selectedSlotNames.join(', ')}`
                          : ': no one marked this slot.'}
                      </p>
                    </div>
                    <Button size="sm" onClick={() => setSelectedSlot(null)}>
                      Close
                    </Button>
                  </div>
                </div>
              ) : null}

              {participants.length === 0 ? (
                <div className="border-t border-gray-200 px-3 py-2 text-xs text-gray-500">
                  No responses have been submitted yet. Use the “Your availability” tab to add
                  the first one.
                </div>
              ) : null}
            </div>

            <div className="mt-4">
              <div className="mb-2 flex flex-wrap items-baseline justify-between gap-1">
                <h2 className="text-sm font-bold text-gray-900">Participants</h2>
                <p className="text-xs text-gray-500">
                  View a participant to see their individual availability.
                </p>
              </div>
              <ParticipantsTable
                participants={participants}
                myName={mySavedName}
                viewingId={viewingParticipantId}
                onView={handleViewParticipant}
                onEdit={handleEditParticipant}
              />
            </div>

            {maxCount > 0 ? (
              <p className="mt-2 text-xs text-gray-500">
                Highest overlap: {maxCount} of {participants.length} participants. Green
                outlined cells show the highest overlap.
              </p>
            ) : null}
          </section>
        )}

        <ResultsSection poll={poll} participants={participants} />
      </main>
    </div>
  );
}
