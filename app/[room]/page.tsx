import { notFound } from 'next/navigation';
import Home from '../page';
import type { AppMode } from '@/lib/types';

const rooms: AppMode[] = ['play', 'puzzles', 'learn', 'watch', 'roadmap', 'family'];

export function generateStaticParams() {
  return rooms.map((room) => ({ room }));
}

export default async function RoomPage({ params }: { params: Promise<{ room: string }> }) {
  const { room } = await params;
  if (!rooms.includes(room as AppMode)) notFound();
  return <Home initialMode={room as AppMode} />;
}
