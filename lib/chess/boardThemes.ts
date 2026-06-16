export type BoardTheme = {
  id: string;
  label: string;
  light: string;
  dark: string;
  border: string;
};

export const BOARD_THEMES: Record<string, BoardTheme> = {
  classic: {
    id: 'classic',
    label: 'Classic',
    light: '#eee6cf',
    dark: '#6f8f72',
    border: '#64748b',
  },
  fairyGarden: {
    id: 'fairyGarden',
    label: '🌸 Fairy Garden',
    light: '#fdf4ff',
    dark: '#e879f9',
    border: '#f0abfc',
  },
  midnight: {
    id: 'midnight',
    label: '🌙 Midnight',
    light: '#1f2937',
    dark: '#111827',
    border: '#4f46e5',
  },
  ocean: {
    id: 'ocean',
    label: '🌊 Ocean',
    light: '#e0f2fe',
    dark: '#0369a1',
    border: '#0ea5e9',
  },
  forest: {
    id: 'forest',
    label: '🌲 Forest',
    light: '#dcfce7',
    dark: '#166534',
    border: '#22c55e',
  },
  sunset: {
    id: 'sunset',
    label: '🌅 Sunset',
    light: '#fff7ed',
    dark: '#c2410c',
    border: '#fb923c',
  },
};

export const BOARD_THEME_OPTIONS = Object.values(BOARD_THEMES);
