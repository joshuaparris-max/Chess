export type Sticker = {
  id: string;
  emoji: string;
  name: string;
  hint: string;
};

export const stickers: Sticker[] = [
  { id: 'rose', emoji: '🌸', name: 'Rose', hint: 'Complete Chapter 1' },
  { id: 'butterfly', emoji: '🦋', name: 'Butterfly', hint: 'Complete Chapter 2' },
  { id: 'crown', emoji: '👑', name: 'Crown', hint: 'Complete Chapter 3' },
  { id: 'star', emoji: '⭐', name: 'Star', hint: 'Solve 5 puzzles' },
  { id: 'heart', emoji: '💜', name: 'Heart', hint: 'Play 3 games' },
  { id: 'rainbow', emoji: '🌈', name: 'Rainbow', hint: 'Win a game' },
  { id: 'unicorn', emoji: '🦄', name: 'Unicorn', hint: 'Use fairy pieces' },
  { id: 'magic', emoji: '✨', name: 'Magic', hint: 'Find a checkmate' },
  { id: 'bow', emoji: '🎀', name: 'Bow', hint: 'Try a family lesson' },
  { id: 'flower', emoji: '🌺', name: 'Flower', hint: 'Solve a beginner puzzle' },
  { id: 'mushroom', emoji: '🍄', name: 'Mushroom', hint: 'Play Fairy Garden' },
  { id: 'moon', emoji: '🌙', name: 'Moon', hint: 'Train after dinner' },
  { id: 'carousel', emoji: '🎠', name: 'Carousel', hint: 'Visit Family Chess' },
  { id: 'castle', emoji: '🏰', name: 'Castle', hint: 'Finish a story chapter' },
  { id: 'dragon', emoji: '🐉', name: 'Dragon', hint: 'Beat a stronger bot' },
  { id: 'sparkle', emoji: '🌟', name: 'Sparkle', hint: 'Keep a puzzle streak' },
  { id: 'circus', emoji: '🎪', name: 'Circus', hint: 'Try a new mode' },
  { id: 'peacock', emoji: '🦚', name: 'Peacock', hint: 'Review a saved game' },
  { id: 'mask', emoji: '🎭', name: 'Mask', hint: 'Play as both colors' },
  { id: 'palette', emoji: '🎨', name: 'Palette', hint: 'Change board style' },
];

