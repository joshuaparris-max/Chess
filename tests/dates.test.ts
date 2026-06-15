import { describe, it, expect } from 'vitest';
import { getSydneyDateString } from '@/lib/dates';

describe('Sydney date utilities', () => {
  it('formats a UTC date to Sydney date string YYYY-MM-DD', () => {
    // Test 1: A known UTC date that maps to a specific Sydney date
    // UTC 2026-06-14 15:00 should be 2026-06-15 01:00 Sydney (UTC+10 standard time)
    const utcDate = new Date('2026-06-14T15:00:00Z');
    const sydneyDate = getSydneyDateString(utcDate);
    expect(sydneyDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    // During standard time (June), Sydney is UTC+10, so UTC 15:00 = Sydney 01:00 next day
    expect(sydneyDate).toBe('2026-06-15');
  });

  it('returns a properly formatted YYYY-MM-DD string', () => {
    const date = new Date('2026-01-15T12:00:00Z');
    const result = getSydneyDateString(date);
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('handles daylight saving time boundary (April: change from daylight to standard)', () => {
    // Around early April, Australia transitions from daylight saving to standard time
    // This is a regression test to ensure the formatter handles the transition
    const date = new Date('2026-04-05T12:00:00Z');
    const result = getSydneyDateString(date);
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(result).toBe('2026-04-05');
  });

  it('handles daylight saving time boundary (October: change from standard to daylight)', () => {
    // Around early October, Australia transitions from standard to daylight saving time
    const date = new Date('2026-10-04T12:00:00Z');
    const result = getSydneyDateString(date);
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(result).toBe('2026-10-04');
  });

  it('uses current date if no date provided', () => {
    const result = getSydneyDateString();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('correctly advances to next day for late UTC times in Sydney standard time', () => {
    // UTC 20:00 in June (standard time) = Sydney 06:00 next day (UTC+10)
    const utcDate = new Date('2026-06-14T20:00:00Z');
    const sydneyDate = getSydneyDateString(utcDate);
    expect(sydneyDate).toBe('2026-06-15');
  });

  it('correctly handles early morning UTC times', () => {
    // UTC 00:00 in June = Sydney 10:00 same day (UTC+10)
    const utcDate = new Date('2026-06-15T00:00:00Z');
    const sydneyDate = getSydneyDateString(utcDate);
    expect(sydneyDate).toBe('2026-06-15');
  });
});
