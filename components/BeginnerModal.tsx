'use client';

import { useState } from 'react';

interface BeginnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStart: () => void;
}

export default function BeginnerModal({ isOpen, onClose, onStart }: BeginnerModalProps) {
  const [selected, setSelected] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelection = (level: string) => {
    setSelected(level);
  };

  const handleStart = () => {
    if (!selected) return;

    // Map beginner levels to game configuration
    const configMap: Record<string, { levelId: string; botStyle: 'gentle' | 'standard'; spellsEnabled: boolean }> = {
      'complete-new': {
        levelId: 'street-400', // Trainer Level 1
        botStyle: 'gentle',
        spellsEnabled: true, // Enable hints/spells
      },
      'know-pieces': {
        levelId: 'learner-800', // Trainer Level 2
        botStyle: 'gentle',
        spellsEnabled: true,
      },
      'played-before': {
        levelId: 'club-1200', // Trainer Level 3
        botStyle: 'standard',
        spellsEnabled: false, // Standard doesn't need hints
      },
    };

    const config = configMap[selected] || configMap['complete-new'];

    // Apply configuration to localStorage
    try {
      const playSettings = {
        levelId: config.levelId,
        playerColor: 'w',
        timeControl: 'untimed',
        boardFlipped: false,
        gameMode: 'vs-computer',
      };
      localStorage.setItem('gm-play-settings-v1', JSON.stringify(playSettings));
      localStorage.setItem('gm-bot-style', config.botStyle);
      localStorage.setItem('gm-spells-enabled', String(config.spellsEnabled));

      // Store the beginner level for reference
      localStorage.setItem('gmp-beginner-level', selected);
    } catch {
      // Silent fail - localStorage may be unavailable
    }

    onStart();
  };

  const levels = [
    {
      id: 'complete-new',
      title: "I'm completely new",
      description: 'Never played before or just learning the rules.',
      color: 'from-blue-500 to-blue-600',
    },
    {
      id: 'know-pieces',
      title: 'I know how the pieces move',
      description: 'Can play a game but not confident with tactics.',
      color: 'from-teal-500 to-teal-600',
    },
    {
      id: 'played-before',
      title: "I've played before",
      description: 'Have some experience and want to improve.',
      color: 'from-yellow-500 to-yellow-600',
    },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-3xl border border-slate-700 bg-slate-900 p-8 shadow-2xl">
          <h2 className="text-3xl font-black text-white">
            How familiar are you with chess?
          </h2>
          <p className="mt-2 text-slate-400">
            We'll adjust the game to match your level.
          </p>

          <div className="mt-8 space-y-3">
            {levels.map((level) => (
              <button
                key={level.id}
                onClick={() => handleSelection(level.id)}
                className={`w-full rounded-2xl border-2 p-4 text-left transition ${
                  selected === level.id
                    ? 'border-teal-400 bg-teal-400/10'
                    : 'border-slate-700 hover:border-slate-600'
                }`}
              >
                <div className="font-bold text-white">{level.title}</div>
                <div className="mt-1 text-sm text-slate-400">
                  {level.description}
                </div>
              </button>
            ))}
          </div>

          {selected && (
            <button
              onClick={handleStart}
              className="mt-8 w-full rounded-lg bg-teal-400 py-3 font-bold text-slate-950 transition hover:bg-teal-300"
            >
              Let's play!
            </button>
          )}

          <button
            onClick={onClose}
            className="mt-3 w-full rounded-lg border border-slate-600 py-3 font-bold text-slate-300 transition hover:bg-slate-800"
          >
            Maybe later
          </button>
        </div>
      </div>
    </>
  );
}
