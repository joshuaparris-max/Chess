import { describe, expect, it } from 'vitest';
import { attachReviewSummary, LOCAL_GAME_ARCHIVE_LIMIT, normaliseGameArchive, type LocalGameRecord } from '@/lib/gameArchive';

function record(id: string): LocalGameRecord {
  return { schemaVersion: 1, id, createdAtIso: '2026-06-15T00:00:00Z', playerColor: 'w', opponentType: 'bot', result: 'Draw', pgn: '1. e4', moves: ['e4'], finalFen: 'fen' };
}

describe('local game archive', () => {
  it('rejects malformed records and caps the archive', () => {
    const input = [...Array.from({ length: 25 }, (_, index) => record(String(index))), { bad: true }];
    const result = normaliseGameArchive(input);
    expect(result).toHaveLength(LOCAL_GAME_ARCHIVE_LIMIT);
    expect(result[0].id).toBe('0');
  });

  it('attaches a review only to the matching archived game', () => {
    const games = [record('one'), { ...record('two'), pgn: '1. d4' }];
    const next = attachReviewSummary(games, '1. d4', 'Develop before attacking.');
    expect(next[0].reviewSummary).toBeUndefined();
    expect(next[1].reviewSummary).toBe('Develop before attacking.');
  });
});
