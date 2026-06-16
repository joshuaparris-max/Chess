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
    label: 'Midnight',
    light: '#1f2937',
    dark: '#111827',
    border: '#4f46e5',
  },
};

export const BOARD_THEME_OPTIONS = Object.values(BOARD_THEMES);
