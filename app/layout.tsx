import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Grandmaster Path Alpha',
  description: 'A chess training alpha that combines play, puzzles, lessons, and model-game study.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
