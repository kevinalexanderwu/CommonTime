export function getPollUrl(pollId) {
  const base = import.meta.env.BASE_URL || '/';
  return `${window.location.origin}${base}poll/${pollId}`;
}
