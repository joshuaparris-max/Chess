import { notFound } from 'next/navigation';
import Home from '../page-hub';
import type { AppMode } from '@/lib/types';

const rooms: AppMode[] = ['puzzles', 'learn', 'watch', 'roadmap', 'family', 'stickers'];

export function generateStaticParams() {
  return rooms.map((room) => ({ room }));
}

interface RoomPageProps {
  params: { room: string };
}

export default function RoomPage({ params }: RoomPageProps) {
  const { room } = params;
  const roomMode = room as AppMode;
  if (!rooms.includes(roomMode)) notFound();
  return <Home initialMode={roomMode} />;
}
