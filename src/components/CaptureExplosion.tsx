/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';

interface Particle {
  id: number;
  x: number; // Final translation X
  y: number; // Final translation Y
  size: number;
  color: string;
  emoji?: string;
  rotation: number;
}

interface CaptureExplosionProps {
  square: string;
  pieceType: string;
}

const SWEET_TEXTS = [
  'OM NOM! 🍰',
  'CHOMP! 🍬',
  'YUM! 🧁',
  'CRUNCH! 🍪',
  'EATEN! 🍓',
  'GOTCHA! 🎀',
  'DELISH! 🍭',
  'POW! 💥'
];

const PARTICLE_COLORS = [
  '#FF80BF', // Pink
  '#B2FFD6', // Spearmint
  '#FFDEF2', // Light Pink
  '#FFE135', // Sweet Yellow
  '#7D5A94', // Purple
  '#FF4F81', // Crimson Red
];

const CANDY_EMOJIS = ['🍬', '🍭', '🍓', '🧁', '🍪', '🍰', '✨', '💖', '⭐', '💥'];

export function CaptureExplosion({ pieceType }: CaptureExplosionProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [text, setText] = useState('');

  useEffect(() => {
    // Select a fun random chomp phrase
    const randomText = SWEET_TEXTS[Math.floor(Math.random() * SWEET_TEXTS.length)];
    setText(randomText);

    // Generate 12-16 colorful explosion particles radiating outwards
    const count = 12 + Math.floor(Math.random() * 6);
    const newParticles: Particle[] = [];

    for (let i = 0; i < count; i++) {
      // Choose angle and distance for radiation
      const angle = Math.random() * Math.PI * 2;
      const distance = 30 + Math.random() * 55; // Spread radius in pixels
      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance;

      // Random attributes
      const size = 6 + Math.floor(Math.random() * 8);
      const color = PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)];
      const rotation = Math.random() * 360 - 180;
      
      // 50% chance to be a cute sweet candy emoji instead of a pixel block
      const isEmoji = Math.random() > 0.45;
      const emoji = isEmoji ? CANDY_EMOJIS[Math.floor(Math.random() * CANDY_EMOJIS.length)] : undefined;

      newParticles.push({
        id: i,
        x,
        y,
        size,
        color,
        emoji,
        rotation
      });
    }

    setParticles(newParticles);
  }, [pieceType]);

  return (
    <div className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center overflow-visible">
      {/* 1. Brief white/pink grid cells flash overlay */}
      <motion.div
        initial={{ opacity: 0.8, scale: 0.95 }}
        animate={{ opacity: 0, scale: 1.15 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="absolute inset-0 bg-white border-4 border-[#FF80BF] rounded-none mix-blend-screen"
      />

      {/* 2. Radial Candy Particles Explosion */}
      {particles.map((p) => {
        if (p.emoji) {
          return (
            <motion.div
              key={p.id}
              initial={{ x: 0, y: 0, scale: 0.1, opacity: 1, rotate: 0 }}
              animate={{ 
                x: p.x, 
                y: p.y, 
                scale: [0.2, 1.25, 0.7, 0], 
                opacity: [1, 1, 0.8, 0],
                rotate: p.rotation
              }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="absolute select-none text-sm leading-none"
              style={{ fontSize: `${p.size + 8}px` }}
            >
              {p.emoji}
            </motion.div>
          );
        } else {
          // Retro pixel colored square blocks
          return (
            <motion.div
              key={p.id}
              initial={{ x: 0, y: 0, scale: 0.1, opacity: 1, rotate: 0 }}
              animate={{ 
                x: p.x, 
                y: p.y, 
                scale: [0.1, 1.2, 0.5, 0], 
                opacity: [1, 1, 0.7, 0],
                rotate: p.rotation
              }}
              transition={{ duration: 0.75, ease: 'easeOut' }}
              className="absolute border border-black shadow-xs"
              style={{ 
                width: `${p.size}px`, 
                height: `${p.size}px`, 
                backgroundColor: p.color
              }}
            />
          );
        }
      })}

      {/* 3. Comic book "CHOMP!" word popup badge */}
      <motion.div
        initial={{ y: 5, scale: 0.5, opacity: 0 }}
        animate={{ 
          y: -42, 
          scale: [0.5, 1.4, 1.1, 0], 
          opacity: [0, 1, 1, 0] 
        }}
        transition={{ duration: 1.0, ease: 'easeOut' }}
        className="absolute flex items-center justify-center whitespace-nowrap z-40 select-none pointer-events-none"
      >
        <div className="bg-[#B2FFD6] text-black border-2 border-black px-2 py-1 text-[9px] font-pixel font-bold uppercase tracking-tight shadow-[2px_2px_0_rgba(0,0,0,1)] rounded-none rotate-[-4deg]">
          {text}
        </div>
      </motion.div>
    </div>
  );
}
