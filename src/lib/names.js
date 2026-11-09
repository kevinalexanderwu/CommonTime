export function cleanName(value) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, ' ');
}

export function normalizeName(value) {
  return cleanName(value).toLowerCase();
}
