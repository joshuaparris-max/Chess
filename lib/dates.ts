/**
 * Sydney timezone (Australia/Sydney) date utilities.
 * Used for puzzle_date calculations to ensure consistency across UTC server times.
 */

const SYDNEY_TZ = 'Australia/Sydney';

/**
 * Get today's date in Sydney timezone as YYYY-MM-DD.
 * Accounts for daylight saving time transitions.
 */
export function getSydneyDateString(date: Date = new Date()): string {
  const sydneyFormatter = new Intl.DateTimeFormat('en-AU', {
    timeZone: SYDNEY_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const parts = sydneyFormatter.formatToParts(date);
  const year = parts.find(p => p.type === 'year')?.value;
  const month = parts.find(p => p.type === 'month')?.value;
  const day = parts.find(p => p.type === 'day')?.value;

  if (!year || !month || !day) {
    throw new Error('Failed to format Sydney date');
  }

  return `${year}-${month}-${day}`;
}

/**
 * Get current time in Sydney as a Date object (useful for logging).
 */
export function getSydneyDate(utcDate: Date = new Date()): Date {
  const sydneyFormatter = new Intl.DateTimeFormat('en-AU', {
    timeZone: SYDNEY_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const parts = sydneyFormatter.formatToParts(utcDate);
  const year = parseInt(parts.find(p => p.type === 'year')?.value || '2026', 10);
  const month = parseInt(parts.find(p => p.type === 'month')?.value || '01', 10) - 1;
  const day = parseInt(parts.find(p => p.type === 'day')?.value || '01', 10);
  const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '00', 10);
  const minute = parseInt(parts.find(p => p.type === 'minute')?.value || '00', 10);
  const second = parseInt(parts.find(p => p.type === 'second')?.value || '00', 10);

  return new Date(year, month, day, hour, minute, second);
}
