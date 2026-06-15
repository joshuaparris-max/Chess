import { describe, expect, it } from 'vitest';
import { recogniseOpening } from '@/lib/openings';

describe('opening recognition', () => {
  it('recognises the most specific matching opening', () => {
    expect(recogniseOpening(['e4', 'e5', 'Nf3', 'Nc6', 'Bc4'])?.name).toBe('Italian Game');
  });

  it('returns null for unknown move sequences', () => {
    expect(recogniseOpening(['a3', 'h6'])).toBeNull();
  });
});
