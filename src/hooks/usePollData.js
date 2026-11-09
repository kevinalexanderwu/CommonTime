import { useCallback, useEffect, useState } from 'react';
import { pollService } from '../services/pollService.js';

export function usePollData(pollId) {
  const [poll, setPoll] = useState(undefined);
  const [participants, setParticipants] = useState([]);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    try {
      const nextPoll = await pollService.getPoll(pollId);
      if (!nextPoll) {
        setPoll(null);
        setParticipants([]);
        setError('');
        return;
      }

      const nextParticipants = await pollService.getResponses(pollId);
      setPoll(nextPoll);
      setParticipants(nextParticipants);
      setError('');
    } catch (loadError) {
      setError(loadError.message || 'The poll could not be loaded. Please try again.');
      setPoll((current) => (current === undefined ? null : current));
    }
  }, [pollId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    function handleFocus() {
      refresh();
    }

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refresh]);

  return {
    poll,
    participants,
    loading: poll === undefined && !error,
    error,
    refresh,
  };
}
