/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ChessPiece } from './ChessPiece';
import { Chess, Square } from 'chess.js';
import { motion, AnimatePresence } from 'motion/react';
import { CaptureExplosion } from './CaptureExplosion';

// Cutesy board theme presets
export interface BoardTheme {
  name: string;
  light: string;
  dark: string;
  border: string;
  accent: string;
}

export const BOARD_THEMES: BoardTheme[] = [
  {
    name: 'Vibrant Palette 🌸',
    light: '#FFFFFF', // Clean retro white
    dark: '#FFD1DC',  // Bubblegum pink
    border: '#FF80BF', // Hot pink
    accent: '#FF80BF'
  },
  {
    name: 'Cotton Candy 🍬',
    light: '#FFF9FB', // Soft strawberry cream white
    dark: '#A8E6CF',  // Pastel spearmint green
    border: '#FFD1DC', // Pastel bubblegum pink
    accent: '#FF8DA1'
  },
  {
    name: 'Choco Banana 🍌',
    light: '#FFFDD0', // Soft banana yellow
    dark: '#7D5A4F',  // Sweet milk chocolate brown
    border: '#E8D3A7', // Light cookie gold
    accent: '#E67E22'
  },
  {
    name: 'Lavender Fields 🪻',
    light: '#F8F6FF', // Soft violet highlight
    dark: '#C8B2F9',  // Vibrant cute lilac purple
    border: '#AF94F2', // Medium sweet lavender
    accent: '#8E44AD'
  },
  {
    name: 'Retro Arcade 👾',
    light: '#4A5568', // Steel gray
    dark: '#1A202C',  // Deep pitch arcade dark
    border: '#319795', // Chiptune neon teal
    accent: '#319795'
  }
];

interface ChessBoardProps {
  chess: Chess;
  isThinking: boolean;
  onMove: (from: string, to: string, promotion?: string) => void;
  selectedTheme: BoardTheme;
  lastMove: { from: string; to: string } | null;
  playerColor: 'w' | 'b';
}

export function ChessBoard({
  chess,
  isThinking,
  onMove,
  selectedTheme,
  lastMove,
  playerColor = 'w'
}: ChessBoardProps) {
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [promotionPending, setPromotionPending] = useState<{ from: string; to: string } | null>(null);
  const [captureExplosion, setCaptureExplosion] = useState<{ square: string; type: string } | null>(null);

  React.useEffect(() => {
    if (!lastMove) {
      setCaptureExplosion(null);
      return;
    }
    const history = chess.history({ verbose: true });
    if (history.length > 0) {
      const lastPlayed = history[history.length - 1];
      if (lastPlayed && lastPlayed.captured && lastPlayed.to === lastMove.to) {
        setCaptureExplosion({
          square: lastPlayed.to,
          type: lastPlayed.captured
        });
        
        // Auto-clear the visual explosion after 1200ms
        const timer = setTimeout(() => {
          setCaptureExplosion(null);
        }, 1200);
        return () => clearTimeout(timer);
      }
    }
  }, [lastMove, chess]);

  const board = chess.board();
  const currentTurn = chess.turn();
  const inCheck = chess.inCheck();

  // Find King square if in check
  let kingInCheckSquare: string | null = null;
  if (inCheck) {
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = board[r][c];
        if (p && p.type === 'k' && p.color === currentTurn) {
          const file = String.fromCharCode(97 + c);
          const rank = 8 - r;
          kingInCheckSquare = `${file}${rank}`;
        }
      }
    }
  }

  // Get legal moves from selected square
  const getMovesForSquare = (sq: string) => {
    // If the game is thinking, disable player move clicks
    if (isThinking) return [];
    
    // We convert FEN moves list to identify targeting coordinates
    const moves = chess.moves({ verbose: true });
    return moves
      .filter((m) => (m.from as string) === sq)
      .map((m) => m.to as string);
  };

  const possibleMoves = selectedSquare ? getMovesForSquare(selectedSquare) : [];

  // Convert row, col index into standard SAN label
  const getSquareName = (row: number, col: number): string => {
    const file = String.fromCharCode(97 + col);
    const rank = 8 - row;
    return `${file}${rank}`;
  };

  // Convert SAN label to coordinate index
  const getIndexes = (sq: string) => {
    const col = sq.charCodeAt(0) - 97;
    const row = 8 - parseInt(sq[1]);
    return { row, col };
  };

  // Handle cell clicks
  const handleSquareClick = (sq: string) => {
    if (isThinking) return;

    const { row, col } = getIndexes(sq);
    const pieceOnSq = board[row][col];

    // If clicking on player piece, select it
    if (pieceOnSq && pieceOnSq.color === currentTurn && currentTurn === playerColor) {
      if (selectedSquare === sq) {
        setSelectedSquare(null); // Deselect
      } else {
        setSelectedSquare(sq);
      }
      return;
    }

    // If clicking on highlighted valid target
    if (selectedSquare && possibleMoves.includes(sq)) {
      const from = selectedSquare;
      const to = sq;

      // Handle promotion trigger check
      const movingPiece = board[getIndexes(from).row][getIndexes(from).col];
      const isPawn = movingPiece && movingPiece.type === 'p';
      const isPromotingRow = to.endsWith('8') || to.endsWith('1');

      if (isPawn && isPromotingRow) {
        // Queue promotion dialog
        setPromotionPending({ from, to });
      } else {
        // Direct standard move
        onMove(from, to);
        setSelectedSquare(null);
      }
      return;
    }

    // Clicking elsewhere deselects
    setSelectedSquare(null);
  };

  // Handle Promotion Choose
  const handlePromote = (pieceType: string) => {
    if (promotionPending) {
      onMove(promotionPending.from, promotionPending.to, pieceType);
      setPromotionPending(null);
      setSelectedSquare(null);
    }
  };

  // Files a-h, ranks 1-8
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = [8, 7, 6, 5, 4, 3, 2, 1];

  // Rotate coordinates if player is black
  const boardRanks = playerColor === 'b' ? [...ranks].reverse() : ranks;
  const boardFiles = playerColor === 'b' ? [...files].reverse() : files;

  return (
    <div className="relative flex flex-col items-center">
      {/* Promotion popup overlay */}
      <AnimatePresence>
        {promotionPending && (
          <motion.div 
            id="promotion-menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black/60 rounded-xl backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center cursor-default"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 15 }}
              className="bg-card p-6 rounded-2xl border-4 border-dashed border-pink-400 shadow-2xl max-w-xs"
            >
              <h3 className="font-mono text-sm uppercase text-pink-500 font-bold tracking-wider mb-2">Pawn Ascension! ✨</h3>
              <p className="text-xs text-muted-foreground mb-4">Choose an adorable new form for your brave little pawn:</p>
              
              <div className="grid grid-cols-2 gap-3">
                {[
                  { type: 'q', name: 'Queen Sweetie' },
                  { type: 'n', name: 'Derpy Knight' },
                  { type: 'r', name: 'Smiley Rook' },
                  { type: 'b', name: 'Wizard Bishop' }
                ].map((p) => (
                  <button
                    key={p.type}
                    id={`promote-btn-${p.type}`}
                    onClick={() => handlePromote(p.type)}
                    className="flex flex-col items-center justify-center p-3 rounded-lg border-2 border-primary/20 hover:border-pink-400 hover:bg-pink-50 transition cursor-pointer"
                  >
                    <ChessPiece type={p.type} color={playerColor} size={42} />
                    <span className="text-[10px] font-mono mt-1 font-semibold capitalize text-foreground">{p.name}</span>
                  </button>
                ))}
              </div>
              <button 
                id="cancel-promotion"
                onClick={() => setPromotionPending(null)}
                className="mt-4 font-mono text-[9px] uppercase tracking-widest text-muted-foreground hover:text-foreground cursor-pointer underline"
              >
                Go Back
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Elegant Chess Board Frame with 8-bit styling */}
      <div 
        className="w-full max-w-[450px] aspect-square p-3 bg-black border-4 border-black shadow-[8px_8px_0_0_rgba(0,0,0,0.2)] flex flex-col justify-between"
      >
        <div className="flex-1 grid grid-cols-8 grid-rows-8 relative border-2 border-black overflow-hidden bg-black">
          {boardRanks.map((rank, rankIdx) => {
            const actualRow = playerColor === 'b' ? rankIdx : 8 - rank;
            
            return boardFiles.map((file, fileIdx) => {
              const actualCol = playerColor === 'b' ? 7 - fileIdx : file.charCodeAt(0) - 97;
              
              const sqName = `${file}${rank}`;
              const piece = board[actualRow][actualCol];
              const isDark = (actualRow + actualCol) % 2 === 1;
              const isSelected = selectedSquare === sqName;
              const isPossibleTarget = possibleMoves.includes(sqName);
              const isLastMoveFrom = lastMove?.from === sqName;
              const isLastMoveTo = lastMove?.to === sqName;
              const isKingInCheck = kingInCheckSquare === sqName;
              const hasExplosion = captureExplosion?.square === sqName;

              // Color determination
              let bg = isDark ? selectedTheme.dark : selectedTheme.light;
              
              // Apply highlights
              let outlineElement: React.ReactNode = null;
              
              if (isSelected) {
                // Gold pixel outline
                outlineElement = (
                  <div className="absolute inset-0.5 border-4 border-yellow-400/90 rounded-sm pointer-events-none animate-pulse" />
                );
              } else if (isLastMoveFrom || isLastMoveTo) {
                // Purple trace
                bg = isDark ? '#DFD8F3' : '#F0ECFA';
              }

              return (
                <div
                  key={`${rankIdx}-${fileIdx}-${sqName}`}
                  row-label={actualRow}
                  col-label={actualCol}
                  id={`square-${sqName}`}
                  onClick={() => handleSquareClick(sqName)}
                  className="relative flex items-center justify-center cursor-pointer select-none aspect-square group transition-all duration-300"
                  style={{ backgroundColor: bg }}
                >
                  {/* Pieces Layer */}
                  {piece && (
                    <ChessPiece 
                      type={piece.type} 
                      color={piece.color} 
                      size={38}
                      isThinking={isThinking && piece.color === 'b' && piece.type === 'k'} 
                    />
                  )}

                  {/* Capture explosion event layer */}
                  {hasExplosion && (
                    <CaptureExplosion 
                      square={sqName} 
                      pieceType={captureExplosion.type} 
                    />
                  )}

                  {/* Move Target dots */}
                  {isPossibleTarget && (
                    <div className="absolute flex items-center justify-center inset-0 z-10 pointer-events-none">
                      {piece ? (
                        // Red Ring for capture target
                        <div className="w-[85%] h-[85%] rounded-lg border-4 border-dashed border-red-400/80 shrink-0" />
                      ) : (
                        // Green Dot for empty slide target
                        <div className="w-3.5 h-3.5 rounded-full bg-emerald-500/70 border-2 border-white shrink-0 shadow-xs animate-bounce" />
                      )}
                    </div>
                  )}

                  {/* King Check Red alert */}
                  {isKingInCheck && (
                    <div className="absolute inset-0 bg-red-400/40 border-4 border-red-500 animate-pulse pointer-events-none" />
                  )}

                  {outlineElement}

                  {/* Coordinate helper tags on outer-most margins of grid */}
                  {actualCol === (playerColor === 'b' ? 7 : 0) && (
                    <span 
                      className="absolute top-0.5 left-0.5 font-mono text-[8px] font-bold select-none leading-none opacity-30"
                      style={{ color: '#2D3033' }}
                    >
                      {rank}
                    </span>
                  )}
                  {actualRow === (playerColor === 'b' ? 0 : 7) && (
                    <span 
                      className="absolute bottom-0.5 right-0.5 font-mono text-[8px] font-bold select-none leading-none opacity-30"
                      style={{ color: '#2D3033' }}
                    >
                      {file}
                    </span>
                  )}
                </div>
              );
            });
          })}
        </div>
      </div>
    </div>
  );
}
