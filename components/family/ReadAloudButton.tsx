'use client';

import { useEffect, useState } from 'react';

type Props = {
  text: string;
  label?: string;
};

export default function ReadAloudButton({ text, label = 'Read aloud' }: Props) {
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    setSupported(
      typeof window !== 'undefined' &&
      'speechSynthesis' in window &&
      'SpeechSynthesisUtterance' in window,
    );
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  if (!supported) return null;

  const speak = () => {
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
  };

  return (
    <button
      onClick={speak}
      aria-label={`${label}: ${text}`}
      className="shrink-0 rounded-xl border border-slate-600 bg-slate-800 px-3 py-2 text-sm font-bold text-slate-200 hover:bg-slate-700 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300"
    >
      🔊 {label}
    </button>
  );
}
