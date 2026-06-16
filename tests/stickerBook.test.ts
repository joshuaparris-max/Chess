import { describe, expect, it } from 'vitest';
import { stickers } from '../lib/stickers/stickerCatalog';
import { normaliseStickerIds } from '../lib/stickers/awardSticker';

describe('sticker book catalog', () => {
  it('contains exactly 20 unique stickers', () => {
    expect(stickers).toHaveLength(20);
    expect(new Set(stickers.map((sticker) => sticker.id)).size).toBe(20);
  });

  it('starts with the three story rewards', () => {
    expect(stickers.slice(0, 3).map((sticker) => sticker.id)).toEqual(['rose', 'butterfly', 'crown']);
  });
});

describe('sticker storage helpers', () => {
  it('deduplicates earned sticker ids and ignores invalid rows', () => {
    expect(normaliseStickerIds(['rose', 'rose', null, 'crown', 7])).toEqual(['rose', 'crown']);
  });
});

