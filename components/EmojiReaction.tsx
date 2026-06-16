type EmojiReactionProps = {
  emoji: string;
};

export default function EmojiReaction({ emoji }: EmojiReactionProps) {
  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center" aria-hidden="true">
      <style>{`
        @keyframes chess-emoji-float {
          0% { opacity: 0; transform: translateY(24px) scale(0.75); }
          15% { opacity: 1; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(-60px) scale(1.25); }
        }
      `}</style>
      <span
        className="text-7xl drop-shadow-2xl"
        style={{ animation: 'chess-emoji-float 1.5s ease-out forwards' }}
      >
        {emoji}
      </span>
    </div>
  );
}

