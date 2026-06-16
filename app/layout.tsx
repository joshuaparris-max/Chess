import type { Metadata, Viewport } from 'next';
import './globals.css';
import BedtimeToggle from '@/components/BedtimeToggle';
import LootModal from '@/components/LootModal';
import StickerMilestones from '@/components/StickerMilestones';
import QuestTracker from '@/components/QuestTracker';

export const metadata: Metadata = {
  title: 'Grandmaster Path Alpha',
  description: 'A chess training alpha that combines play, puzzles, lessons, and model-game study.',
  applicationName: 'Grandmaster Path',
  appleWebApp: { capable: true, title: 'Grandmaster Path', statusBarStyle: 'black-translucent' },
};

export const viewport: Viewport = {
  themeColor: '#0f172a',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        {children}
        <BedtimeToggle />
        <LootModal />
        <StickerMilestones />
        <QuestTracker />
      </body>
    </html>
  );
}
