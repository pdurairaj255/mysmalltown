// Small helpers shared by every module: HTML escaping and calendar days.
// Days are local-date strings ("2026-10-25"); weeks run Monday to Sunday.

export function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export function dayKey(date = new Date()) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function parseDay(day) {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(day, n) {
  const d = parseDay(day);
  d.setDate(d.getDate() + n);
  return dayKey(d);
}

export function daysBetween(fromDay, toDay) {
  return Math.round((parseDay(toDay) - parseDay(fromDay)) / 86400000);
}

export function mondayOf(day) {
  const dow = (parseDay(day).getDay() + 6) % 7; // Monday = 0
  return addDays(day, -dow);
}

export function shortDate(day) {
  return parseDay(day).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function longDate(day) {
  return parseDay(day).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
}

// "Today", "Yesterday", "Wed", or "Oct 4" for anything older than a week.
export function relativeDay(day, today = dayKey()) {
  const diff = daysBetween(day, today);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff > 1 && diff < 7) return parseDay(day).toLocaleDateString(undefined, { weekday: 'short' });
  return shortDate(day);
}

export function listNames(names) {
  if (names.length <= 1) return names.join('');
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

export function possessive(name) {
  return name.endsWith('s') ? `${name}'` : `${name}'s`;
}
