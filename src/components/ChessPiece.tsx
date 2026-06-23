/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';

interface ChessPieceProps {
  type: string;  // 'p', 'r', 'n', 'b', 'q', 'k'
  color: 'w' | 'b';
  size?: number;
  isThinking?: boolean;
  isCaptured?: boolean;
}

export function ChessPiece({ type, color, size = 44, isThinking = false, isCaptured = false }: ChessPieceProps) {
  // Pastel, cute colors representing 8-Bit candy theme
  const colors = {
    w: {
      body: '#FFD1DC',       // Soft Strawberry Blossom Pink
      accent: '#FFF0F5',     // Cream Lavender Light
      outline: '#2D3033',    // Dark Charcoal Retro borders
      blush: '#FF8DA1',      // Pink cheeks
      eye: '#2D3033'
    },
    b: {
      body: '#B19FFB',       // Cute Lilac / Grape Purple
      accent: '#E6E0FF',     // Sweet Lavender highlight
      outline: '#2D3033',    // Dark Charcoal
      blush: '#FF6D88',      // Bright blush
      eye: '#2D3033'
    }
  };

  const currentColors = color === 'w' ? colors.w : colors.b;

  // Gently bobbing animation when thinking or idle
  const animateConfig = isThinking
    ? {
        y: [0, -6, 0],
        scale: [1, 1.05, 1],
        transition: {
          duration: 1.2,
          repeat: Infinity,
          ease: "easeInOut"
        }
      }
    : isCaptured
    ? { scale: [1, 0.8] }
    : {
        y: [0, -1.5, 0],
        transition: {
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
          delay: Math.random() * 2
        }
      };

  // Helper renderers for beautiful custom cutesy pixelated SVGs
  const renderSVGPath = () => {
    switch (type.toLowerCase()) {
      case 'p': // Adorable Bubble Pawn
        return (
          <g>
            {/* Body */}
            <circle cx="22" cy="18" r="8" fill={currentColors.body} stroke={currentColors.outline} strokeWidth="3" />
            <path d="M14 36 C14 26, 30 26, 30 36 Z" fill={currentColors.body} stroke={currentColors.outline} strokeWidth="3" strokeLinejoin="round" />
            
            {/* Cute Apron/Bow */}
            <rect x="18" y="27" width="8" height="6" rx="2" fill={currentColors.accent} stroke={currentColors.outline} strokeWidth="1.5" />
            
            {/* Face */}
            <circle cx="19" cy="17" r="1.5" fill={currentColors.eye} />
            <circle cx="25" cy="17" r="1.5" fill={currentColors.eye} />
            {/* Blush */}
            <circle cx="16" cy="19" r="1" fill={currentColors.blush} />
            <circle cx="28" cy="19" r="1" fill={currentColors.blush} />
            {/* Smile */}
            <path d="M 21 21 Q 22 22 23 21" stroke={currentColors.outline} strokeWidth="1.5" strokeLinecap="round" fill="none" />
          </g>
        );

      case 'r': // Resilient Fortress Rook with smile
        return (
          <g>
            {/* Base block */}
            <path d="M12 37 L32 37 L32 23 L29 23 L29 13 L33 13 L33 7 L28 7 L28 11 L25 11 L25 7 L19 7 L19 11 L16 11 L16 7 L11 7 L11 13 L15 13 L15 23 L12 23 Z" 
              fill={currentColors.body} 
              stroke={currentColors.outline} 
              strokeWidth="3" 
              strokeLinejoin="round" 
            />
            {/* Castle brick accent */}
            <rect x="15" y="16" width="14" height="6" rx="1" fill={currentColors.accent} stroke={currentColors.outline} strokeWidth="2" />
            
            {/* Cute Face */}
            <circle cx="19" cy="19" r="1.5" fill={currentColors.eye} />
            <circle cx="25" cy="19" r="1.5" fill={currentColors.eye} />
            <circle cx="16.5" cy="20" r="1" fill={currentColors.blush} />
            <circle cx="27.5" cy="20" r="1" fill={currentColors.blush} />
            <path d="M 21 22 Q 22 23.5 23 22" stroke={currentColors.outline} strokeWidth="1.5" strokeLinecap="round" fill="none" />
          </g>
        );

      case 'n': // Adorable Chibi Knight (Little Horse)
        return (
          <g>
            {/* Horse Body & Head */}
            <path d="M12 37 C12 28, 16 22, 16 18 C16 13, 11 11, 14 7 C18 6, 22 8, 25 6 C28 4, 32 8, 31 14 C31 17, 28 20, 29 24 C31 29, 32 32, 32 37 Z" 
              fill={currentColors.body} 
              stroke={currentColors.outline} 
              strokeWidth="3" 
              strokeLinejoin="round" 
            />
            {/* Mane */}
            <path d="M13 25 C10 21, 10 15, 12 12" fill="none" stroke={currentColors.accent} strokeWidth="3" strokeLinecap="round" />
            
            {/* Cute Snout accent */}
            <path d="M 25 14 Q 28 15 29 13 Q 28 11 26 12" fill={currentColors.accent} stroke={currentColors.outline} strokeWidth="1.5" />

            {/* Huge Adorable Eye */}
            <circle cx="20" cy="12" r="2" fill={currentColors.eye} />
            <circle cx="19.5" cy="11.5" r="0.75" fill="#FFFFFF" /> {/* Sparkle */}
            {/* Blush */}
            <circle cx="21" cy="15" r="1.5" fill={currentColors.blush} />
            
            {/* Cute horse smile */}
            <path d="M 23 16 Q 24 17 25 16" stroke={currentColors.outline} strokeWidth="1.5" strokeLinecap="round" fill="none" />
          </g>
        );

      case 'b': // Wise Owl Wizard Bishop
        return (
          <g>
            {/* Bishop Hat and Body */}
            <circle cx="22" cy="14" r="7" fill={currentColors.accent} stroke={currentColors.outline} strokeWidth="3" />
            <path d="M13 37 C13 22, 31 22, 31 37 Z" fill={currentColors.body} stroke={currentColors.outline} strokeWidth="3" strokeLinejoin="round" />
            
            {/* Cute Mitre slit details / wizard lines */}
            <path d="M22 7 L22 11" stroke={currentColors.outline} strokeWidth="2.5" />
            <path d="M19 28 L25 28" stroke={currentColors.outline} strokeWidth="2.5" strokeLinecap="round" />

            {/* Glowing yellow star on robe */}
            <polygon points="22,25 23,27 25,27 23.5,28.5 24,30.5 22,29.5 20,30.5 20.5,28.5 19,27 21,27" fill="#FFDF00" stroke={currentColors.outline} strokeWidth="1" />

            {/* Sleepy cute face */}
            <path d="M 17 14 Q 19 15 19 13.5" stroke={currentColors.outline} strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <path d="M 27 14 Q 25 15 25 13.5" stroke={currentColors.outline} strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <circle cx="17" cy="16" r="1" fill={currentColors.blush} />
            <circle cx="27" cy="16" r="1" fill={currentColors.blush} />
            
            {/* Tiny happy beak/mouth */}
            <polygon points="21,15 23,15 22,17" fill="#FFA500" stroke={currentColors.outline} strokeWidth="1" />
          </g>
        );

      case 'q': // Royal Cupcake Queen
        return (
          <g>
            {/* Queen Crown and dress */}
            <path d="M12 37 L32 37 L32 24 C32 20, 31 18, 29 17 L33 9 L28 13 L22 7 L16 13 L11 9 L15 17 C13 18, 12 20, 12 24 Z" 
              fill={currentColors.body} 
              stroke={currentColors.outline} 
              strokeWidth="3" 
              strokeLinejoin="round" 
            />
            {/* Crown Jewels (adorned dots) */}
            <circle cx="11.5" cy="8.5" r="2.5" fill="#FFE135" stroke={currentColors.outline} strokeWidth="1.5" />
            <circle cx="22" cy="6" r="2.5" fill="#FF4F81" stroke={currentColors.outline} strokeWidth="1.5" />
            <circle cx="32.5" cy="8.5" r="2.5" fill="#FFE135" stroke={currentColors.outline} strokeWidth="1.5" />

            <ellipse cx="22" cy="27" rx="8" ry="4" fill={currentColors.accent} stroke={currentColors.outline} strokeWidth="2a" />

            {/* Elegant and happy face */}
            <circle cx="18" cy="21" r="1.5" fill={currentColors.eye} />
            <circle cx="26" cy="21" r="1.5" fill={currentColors.eye} />
            <circle cx="15.5" cy="22" r="1.5" fill={currentColors.blush} />
            <circle cx="28.5" cy="22" r="1.5" fill={currentColors.blush} />
            {/* Cat face mouth :3 */}
            <path d="M 21 23 Q 22 24 22 23 Q 22 24 23 23" stroke={currentColors.outline} strokeWidth="1.5" strokeLinecap="round" fill="none" />
          </g>
        );

      case 'k': // Teddy King
        return (
          <g>
            {/* Bear King Ears & Body */}
            <ellipse cx="16" cy="11" rx="4" ry="4" fill={currentColors.body} stroke={currentColors.outline} strokeWidth="3" />
            <ellipse cx="28" cy="11" rx="4" ry="4" fill={currentColors.body} stroke={currentColors.outline} strokeWidth="3" />
            <ellipse cx="16" cy="11" rx="2" ry="2" fill={currentColors.accent} />
            <ellipse cx="28" cy="11" rx="2" ry="2" fill={currentColors.accent} />

            <path d="M12 37 L32 37 L32 23 L29 23 C29 16, 15 16, 15 23 L12 23 Z" 
              fill={currentColors.body} 
              stroke={currentColors.outline} 
              strokeWidth="3" 
              strokeLinejoin="round" 
            />

            {/* Little Crown on top */}
            <path d="M19 14 L20 8 L22 11 L24 8 L25 14 Z" fill="#FFE135" stroke={currentColors.outline} strokeWidth="1.8" strokeLinejoin="round" />
            <circle cx="22" cy="6" r="1.5" fill="#FF4F81" stroke={currentColors.outline} strokeWidth="1" />

            {/* Bear snout & face */}
            <circle cx="18" cy="20" r="1.75" fill={currentColors.eye} />
            <circle cx="26" cy="20" r="1.75" fill={currentColors.eye} />
            <circle cx="15.5" cy="22" r="1.5" fill={currentColors.blush} />
            <circle cx="28.5" cy="22" r="1.5" fill={currentColors.blush} />

            {/* Cute bear nose */}
            <ellipse cx="22" cy="22" rx="2" ry="1.2" fill={currentColors.outline} />
            <path d="M 22 23.2 L 22 24.5 M 22 24.5 Q 21 25.5 20.5 25 Q 22 24.5 22 24.5 Q 22 24.5 23.5 25" stroke={currentColors.outline} strokeWidth="1.5" strokeLinecap="round" fill="none" />
          </g>
        );

      default:
        return null;
    }
  };

  const getPieceProperName = (t: string) => {
    const names: Record<string, string> = {
      p: 'Pawn (Bubble Pawn)',
      r: 'Rook (Fortress Rook)',
      n: 'Knight (Chibi Knight)',
      b: 'Bishop (Wizard Bishop)',
      q: 'Queen (Cupcake Queen)',
      k: 'King (Teddy King)'
    };
    return names[t.toLowerCase()] || 'Chess Piece';
  };

  return (
    <motion.div
      className={`relative flex items-center justify-center cursor-grab active:cursor-grabbing select-none`}
      animate={animateConfig}
      hover={{ scale: 1.15 }}
      whileTap={{ scale: 0.95 }}
      style={{ width: size, height: size }}
      title={`${color === 'w' ? 'White' : 'Black'} ${getPieceProperName(type)}`}
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 44 44"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ imageRendering: 'pixelated' }}
      >
        {/* Soft shadow below the piece */}
        <ellipse cx="22" cy="38" rx="10" ry="2" fill="rgba(0,0,0,0.12)" />
        {renderSVGPath()}
      </svg>
    </motion.div>
  );
}
