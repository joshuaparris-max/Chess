"use client";

import { useEffect, useMemo, useState } from "react";
import { type Chess, type Square } from "chess.js";
import ChessPiece from "./ChessPiece";
import BoardThemePicker from "./BoardThemePicker";
import { BOARD_THEME_OPTIONS, type BoardTheme } from "@/lib/chess/boardThemes";
import {
  WhiteQueen,
  BlackQueen,
  WhiteKing,
  BlackKing,
  WhitePawn,
  BlackPawn,
  WhiteRook,
  BlackRook,
  WhiteKnight,
  BlackKnight,
  WhiteBishop,
  BlackBishop,
} from "../lib/chess/fairyPieces";

type ChessBoardProps = {
  game: Chess;
  selectedSquare: Square | null;
  legalTargets: string[];
  captureSquares?: string[];
  lastMove: { from: string; to: string } | null;
  disabled?: boolean;
  flipped?: boolean;
  onSquareClick: (square: Square) => void;
};

type ThemeKey = "classic" | "fairyGarden" | "midnight";

const PIECE_SETS = {
  classic: {
    label: "Classic",
    pieces: {
      wk: "♔",
      wq: "♕",
      wr: "♖",
      wb: "♗",
      wn: "♘",
      wp: "♙",
      bk: "♚",
      bq: "♛",
      br: "♜",
      bb: "♝",
      bn: "♞",
      bp: "♟",
    },
    classes: "text-4xl",
  },
  inverted: {
    label: "Inverted",
    pieces: {
      wk: "♚",
      wq: "♛",
      wr: "♜",
      wb: "♝",
      wn: "♞",
      wp: "♟",
      bk: "♔",
      bq: "♕",
      br: "♖",
      bb: "♗",
      bn: "♘",
      bp: "♙",
    },
    classes: "text-4xl",
  },
  modern: {
    label: "Modern",
    pieces: {
      wk: "♔",
      wq: "♕",
      wr: "♖",
      wb: "♗",
      wn: "♘",
      wp: "♙",
      bk: "♚",
      bq: "♛",
      br: "♜",
      bb: "♝",
      bn: "♞",
      bp: "♟",
    },
    classes:
      "inline-flex h-12 w-12 items-center justify-center rounded-full text-3xl font-semibold ring-1 ring-slate-500/20 shadow-sm",
  },
  outline: {
    label: "Outline",
    pieces: {
      wk: "K",
      wq: "Q",
      wr: "R",
      wb: "B",
      wn: "N",
      wp: "P",
      bk: "K",
      bq: "Q",
      br: "R",
      bb: "B",
      bn: "N",
      bp: "P",
    },
    classes:
      "inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-500/30 text-2xl font-semibold",
  },
  letters: {
    label: "Letters",
    pieces: {
      wk: "K",
      wq: "Q",
      wr: "R",
      wb: "B",
      wn: "N",
      wp: "P",
      bk: "K",
      bq: "Q",
      br: "R",
      bb: "B",
      bn: "N",
      bp: "P",
    },
    classes:
      "inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950/80 text-2xl font-semibold uppercase tracking-[0.16em]",
  },
  fairy: {
    label: "Fairy",
    pieces: {
      wk: "WQ",
      wq: "WQ",
      wr: "WR",
      wb: "WB",
      wn: "WN",
      wp: "WP",
      bk: "BQ",
      bq: "BQ",
      br: "BR",
      bb: "BB",
      bn: "BN",
      bp: "BP",
    },
    classes:
      "inline-flex h-12 w-12 items-center justify-center text-transparent",
  },
};

type PieceSetKey = keyof typeof PIECE_SETS;

export default function ChessBoard({
  game,
  selectedSquare,
  legalTargets,
  captureSquares = [],
  lastMove,
  disabled = false,
  flipped = false,
  onSquareClick,
}: ChessBoardProps) {
  const [boardTheme, setBoardTheme] = useState<ThemeKey>("classic");
  const [pieceSet, setPieceSet] = useState<PieceSetKey>("classic");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("gm-piece-set");
      if (saved && saved in PIECE_SETS) {
        setPieceSet(saved as PieceSetKey);
      }
      const savedTheme = window.localStorage.getItem("gm-board-theme");
      if (
        savedTheme === "fairyGarden" ||
        savedTheme === "midnight" ||
        savedTheme === "classic"
      ) {
        setBoardTheme(savedTheme);
      }
    } catch {
      // Ignore storage errors.
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem("gm-piece-set", pieceSet);
      window.localStorage.setItem("gm-board-theme", boardTheme);
    } catch {
      // Ignore storage errors.
    }
  }, [pieceSet, boardTheme]);

  const pieces: Record<string, string> = useMemo(
    () => PIECE_SETS[pieceSet].pieces,
    [pieceSet],
  );

  const getFairyPiece = (color: "w" | "b", type: string) => {
    if (color === "w") {
      switch (type) {
        case "k":
          return <WhiteKing />;
        case "q":
          return <WhiteQueen />;
        case "r":
          return <WhiteRook />;
        case "b":
          return <WhiteBishop />;
        case "n":
          return <WhiteKnight />;
        case "p":
          return <WhitePawn />;
        default:
          return null;
      }
    }
    switch (type) {
      case "k":
        return <BlackKing />;
      case "q":
        return <BlackQueen />;
      case "r":
        return <BlackRook />;
      case "b":
        return <BlackBishop />;
      case "n":
        return <BlackKnight />;
      case "p":
        return <BlackPawn />;
      default:
        return null;
    }
  };

  const getPieceClasses = (color?: "w" | "b") => {
    if (!color) {
      return "";
    }

    const baseClasses = PIECE_SETS[pieceSet].classes;
    if (pieceSet === "classic" || pieceSet === "inverted") {
      return `${baseClasses} ${color === "w" ? "text-white drop-shadow-md" : "text-slate-950"}`;
    }

    if (pieceSet === "modern") {
      return `${baseClasses} ${color === "w" ? "bg-white text-slate-950" : "bg-slate-950 text-white"}`;
    }

    return `${baseClasses} ${color === "w" ? "text-slate-950" : "text-white"}`;
  };

  const board = game.board();
  const displayRows = flipped ? [...board].reverse() : board;
  const activeTheme = useMemo<BoardTheme>(() => {
    return (
      BOARD_THEME_OPTIONS.find((item) => item.id === boardTheme) ??
      BOARD_THEME_OPTIONS[0]
    );
  }, [boardTheme]);

  return (
    <div className="space-y-3">
      <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
        <BoardThemePicker
          selectedTheme={boardTheme}
          onSelectTheme={(themeId) => setBoardTheme(themeId as ThemeKey)}
        />
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-600 bg-slate-950/60 p-3 text-slate-100">
          <div>
            <p className="text-sm font-semibold text-slate-200">Piece style</p>
            <p className="text-xs text-slate-400">
              Choose how the board pieces appear.
            </p>
          </div>
          <select
            aria-label="Select chess icon set"
            value={pieceSet}
            onChange={(event) => setPieceSet(event.target.value as PieceSetKey)}
            className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white"
          >
            {Object.entries(PIECE_SETS).map(([key, option]) => (
              <option key={key} value={key}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div
        className="relative chess-board board-shadow rounded-2xl border overflow-hidden"
        style={{
          borderColor: activeTheme.border,
          backgroundColor: activeTheme.border,
        }}
      >
        {boardTheme === "fairyGarden" && (
          <div className="pointer-events-none absolute inset-0">
            <span className="fairy-sparkle sparkle-top-left" />
            <span className="fairy-sparkle sparkle-top-right" />
            <span className="fairy-sparkle sparkle-bottom-left" />
            <span className="fairy-sparkle sparkle-bottom-right" />
          </div>
        )}

        {displayRows.flatMap((row, rowIndex) => {
          const displayCells = flipped ? [...row].reverse() : row;
          const rankNum = flipped ? rowIndex + 1 : 8 - rowIndex;

          return displayCells.map((piece, fileIndex) => {
            const fileChar = flipped
              ? "hgfedcba"[fileIndex]
              : "abcdefgh"[fileIndex];
            const square = `${fileChar}${rankNum}` as Square;
            const isLight = (rowIndex + fileIndex) % 2 === 0;
            const isSelected = selectedSquare === square;
            const isLegalTarget = legalTargets.includes(square);
            const isCapture = captureSquares.includes(square);
            const isLastMove =
              lastMove?.from === square || lastMove?.to === square;
            const pieceKey = piece
              ? (`${piece.color}${piece.type}` as keyof typeof pieces)
              : undefined;
            const pieceDescription = piece
              ? ` ${piece.color === "w" ? "white" : "black"} ${piece.type}`
              : "";
            const ariaLabel = `${square}${pieceDescription}${isCapture ? ", capture available" : isLegalTarget ? ", legal destination" : ""}${isSelected ? ", selected" : ""}`;
            let pieceElement = null;

            if (piece) {
              if (pieceSet === "classic") {
                pieceElement = (
                  <ChessPiece color={piece.color} type={piece.type} />
                );
              } else if (pieceSet === "fairy") {
                pieceElement = getFairyPiece(piece.color, piece.type);
              } else {
                pieceElement = (
                  <span
                    className={`chess-piece ${getPieceClasses(piece.color)}`}
                  >
                    {pieceKey ? pieces[pieceKey] : ""}
                  </span>
                );
              }
            }

            return (
              <button
                key={square}
                data-square={square}
                aria-label={ariaLabel}
                disabled={disabled}
                onClick={() => onSquareClick(square)}
                onKeyDown={(event) => {
                  const offsets: Record<string, [number, number]> = {
                    ArrowUp: [0, -1],
                    ArrowDown: [0, 1],
                    ArrowLeft: [-1, 0],
                    ArrowRight: [1, 0],
                  };
                  const offset = offsets[event.key];
                  if (!offset) return;
                  event.preventDefault();
                  const nextFile = fileIndex + offset[0];
                  const nextRow = rowIndex + offset[1];
                  if (
                    nextFile < 0 ||
                    nextFile > 7 ||
                    nextRow < 0 ||
                    nextRow > 7
                  )
                    return;
                  const nextRank = flipped ? nextRow + 1 : 8 - nextRow;
                  const nextFileChar = flipped
                    ? "hgfedcba"[nextFile]
                    : "abcdefgh"[nextFile];
                  const nextDestination =
                    event.currentTarget.parentElement?.querySelector(
                      `button[data-square="${nextFileChar}${nextRank}"]`,
                    );
                  if (nextDestination instanceof HTMLElement) {
                    nextDestination.focus();
                  }
                }}
                className={`chess-square transition ${disabled ? "cursor-not-allowed opacity-90" : "cursor-pointer hover:brightness-110"} ${isSelected ? "ring-4 ring-yellow-300 ring-inset" : ""}`}
                style={{
                  backgroundColor: isLight
                    ? activeTheme.light
                    : activeTheme.dark,
                }}
              >
                {isLastMove && (
                  <span className="absolute inset-0 bg-yellow-300/25" />
                )}
                {isLegalTarget && !isCapture && (
                  <span className="absolute h-7 w-7 rounded-full bg-slate-950/45 sm:h-8 sm:w-8" />
                )}
                {isCapture && (
                  <span className="absolute inset-0.5 rounded-sm ring-4 ring-red-500/70 sm:ring-[5px]" />
                )}
                {pieceElement}
                {(rankNum === (flipped ? 8 : 1) || fileIndex === 0) && (
                  <span className="coord">{square}</span>
                )}
              </button>
            );
          });
        })}
      </div>
    </div>
  );
}
