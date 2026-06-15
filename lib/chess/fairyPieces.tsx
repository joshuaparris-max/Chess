'use client';

import type { ReactNode } from 'react';

const queenKingStyle = {
  fill: '#f9a8d4',
  stroke: '#c026d3',
  strokeWidth: 1,
};

const pawnStyle = {
  fill: '#86efac',
  stroke: '#059669',
  strokeWidth: 1,
};

const rookStyle = {
  fill: '#fde68a',
  stroke: '#c2410c',
  strokeWidth: 1,
};

const knightStyle = {
  fill: '#c4b5fd',
  stroke: '#7c3aed',
  strokeWidth: 1,
};

const bishopStyle = {
  fill: '#93c5fd',
  stroke: '#2563eb',
  strokeWidth: 1,
};

function FairyPiece({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 40 40" className="h-12 w-12" aria-hidden="true">
      <g transform="translate(0 0)">{children}</g>
    </svg>
  );
}

export function WhiteQueen() {
  return (
    <FairyPiece>
      <path d="M8 28 C12 16, 28 16, 32 28 L28 24 L24 28 L20 24 L16 28 L12 24 Z" {...queenKingStyle} />
      <path d="M12 20 L14 10 L16 20 M18 20 L20 10 L22 20 M24 20 L26 10 L28 20" stroke="#ec4899" strokeWidth="2" fill="none" />
      <circle cx="18" cy="18" r="3" fill="#fff" />
      <path d="M14 18 C14 14, 26 14, 26 18 C26 22, 14 22, 14 18 Z" fill="#fde68a" />
    </FairyPiece>
  );
}

export function BlackQueen() {
  return (
    <FairyPiece>
      <path d="M8 28 C12 16, 28 16, 32 28 L28 24 L24 28 L20 24 L16 28 L12 24 Z" fill="#7c3aed" stroke="#4c1d95" strokeWidth="1" />
      <path d="M12 20 L14 10 L16 20 M18 20 L20 10 L22 20 M24 20 L26 10 L28 20" stroke="#ddd6fe" strokeWidth="2" fill="none" />
      <circle cx="18" cy="18" r="3" fill="#fbcfe8" />
      <path d="M14 18 C14 14, 26 14, 26 18 C26 22, 14 22, 14 18 Z" fill="#f9a8d4" />
    </FairyPiece>
  );
}

export function WhiteKing() {
  return (
    <FairyPiece>
      <path d="M10 24 L30 24 L28 28 L12 28 Z" fill="#f9a8d4" stroke="#c026d3" strokeWidth="1" />
      <path d="M16 24 L16 12 L24 12 L24 24" fill="#f9a8d4" stroke="#c026d3" strokeWidth="1" />
      <path d="M18 10 L22 10 L22 14 L18 14 Z" fill="#fde68a" />
      <path d="M12 20 C14 16, 26 16, 28 20" fill="#86efac" opacity="0.85" />
      <circle cx="20" cy="26" r="3" fill="#fff" />
    </FairyPiece>
  );
}

export function BlackKing() {
  return (
    <FairyPiece>
      <path d="M10 24 L30 24 L28 28 L12 28 Z" fill="#c4b5fd" stroke="#7c3aed" strokeWidth="1" />
      <path d="M16 24 L16 12 L24 12 L24 24" fill="#c4b5fd" stroke="#7c3aed" strokeWidth="1" />
      <path d="M18 10 L22 10 L22 14 L18 14 Z" fill="#93c5fd" />
      <path d="M12 20 C14 16, 26 16, 28 20" fill="#fde68a" opacity="0.85" />
      <circle cx="20" cy="26" r="3" fill="#f5f3ff" />
    </FairyPiece>
  );
}

export function WhitePawn() {
  return (
    <FairyPiece>
      <circle cx="20" cy="14" r="6" {...pawnStyle} />
      <path d="M12 22 C14 28, 26 28, 28 22 C26 24, 24 26, 20 26 C16 26, 14 24, 12 22 Z" {...pawnStyle} />
      <circle cx="20" cy="10" r="2" fill="#fde68a" />
    </FairyPiece>
  );
}

export function BlackPawn() {
  return (
    <FairyPiece>
      <circle cx="20" cy="14" r="6" fill="#4ade80" stroke="#166534" strokeWidth="1" />
      <path d="M12 22 C14 28, 26 28, 28 22 C26 24, 24 26, 20 26 C16 26, 14 24, 12 22 Z" fill="#4ade80" stroke="#166534" strokeWidth="1" />
      <circle cx="20" cy="10" r="2" fill="#fde68a" />
    </FairyPiece>
  );
}

export function WhiteRook() {
  return (
    <FairyPiece>
      <path d="M14 10 H26 V20 H14 Z" {...rookStyle} />
      <path d="M12 20 C12 26, 28 26, 28 20 L28 28 H12 Z" fill="#f9a8d4" stroke="#c026d3" strokeWidth="1" />
      <path d="M14 10 V8 H18 V10 M22 10 V8 H26 V10" stroke="#c2410c" strokeWidth="1.5" />
    </FairyPiece>
  );
}

export function BlackRook() {
  return (
    <FairyPiece>
      <path d="M14 10 H26 V20 H14 Z" fill="#fde68a" stroke="#c2410c" strokeWidth="1" />
      <path d="M12 20 C12 26, 28 26, 28 20 L28 28 H12 Z" fill="#7c3aed" stroke="#4c1d95" strokeWidth="1" />
      <path d="M14 10 V8 H18 V10 M22 10 V8 H26 V10" stroke="#4c1d95" strokeWidth="1.5" />
    </FairyPiece>
  );
}

export function WhiteKnight() {
  return (
    <FairyPiece>
      <path d="M12 26 C14 20, 18 16, 24 16 C28 16, 32 18, 28 22 C26 24, 24 24, 22 22 C20 20, 18 22, 18 24" fill="#c4b5fd" stroke="#7c3aed" strokeWidth="1" />
      <path d="M18 14 L22 10 L26 14" fill="none" stroke="#7c3aed" strokeWidth="2" />
      <circle cx="24" cy="22" r="2" fill="#fff" />
      <path d="M20 18 C18 16, 22 14, 24 16" fill="#fde68a" opacity="0.75" />
    </FairyPiece>
  );
}

export function BlackKnight() {
  return (
    <FairyPiece>
      <path d="M12 26 C14 20, 18 16, 24 16 C28 16, 32 18, 28 22 C26 24, 24 24, 22 22 C20 20, 18 22, 18 24" fill="#7c3aed" stroke="#4c1d95" strokeWidth="1" />
      <path d="M18 14 L22 10 L26 14" fill="none" stroke="#ddd6fe" strokeWidth="2" />
      <circle cx="24" cy="22" r="2" fill="#f9a8d4" />
      <path d="M20 18 C18 16, 22 14, 24 16" fill="#93c5fd" opacity="0.9" />
    </FairyPiece>
  );
}

export function WhiteBishop() {
  return (
    <FairyPiece>
      <path d="M20 8 L24 14 L20 20 L16 14 Z" fill="#93c5fd" stroke="#2563eb" strokeWidth="1" />
      <path d="M20 20 L20 30" stroke="#2563eb" strokeWidth="2" />
      <circle cx="20" cy="6" r="3" fill="#fde68a" />
      <path d="M18 12 L22 12 M20 14 L20 10" stroke="#fff" strokeWidth="1.5" />
    </FairyPiece>
  );
}

export function BlackBishop() {
  return (
    <FairyPiece>
      <path d="M20 8 L24 14 L20 20 L16 14 Z" fill="#2563eb" stroke="#1d4ed8" strokeWidth="1" />
      <path d="M20 20 L20 30" stroke="#1d4ed8" strokeWidth="2" />
      <circle cx="20" cy="6" r="3" fill="#f9a8d4" />
      <path d="M18 12 L22 12 M20 14 L20 10" stroke="#f8fafc" strokeWidth="1.5" />
    </FairyPiece>
  );
}
