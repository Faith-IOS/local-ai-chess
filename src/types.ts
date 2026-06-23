/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ChessColor = 'w' | 'b';

export interface AISettings {
  apiUrl: string;
  model: string;
  enabled: boolean;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  useFallback: boolean; // fallback to retro algorithm if Gemma makes an illegal move or connection fails
  thinkingDelay: number; // simulated timing in ms to let user see AI "thinking"
}

export interface MoveLog {
  id: string;
  san: string;       // "e4", "Nf3"
  from: string;      // "e2"
  to: string;        // "e4"
  color: ChessColor;
  piece: string;     // 'p', 'r', 'n', 'b', 'q', 'k'
  captured?: string;
  timestamp: string;
}

export interface GameStats {
  whiteTime: number; // in seconds
  blackTime: number; // in seconds
  capturedWhite: string[];
  capturedBlack: string[];
}

export interface PromptLog {
  id: string;
  timestamp: string;
  prompt: string;
  responseText: string;
  parsedMove: string;
  isValid: boolean;
  error?: string;
  mode: 'gemma' | 'retro-engine';
  elapsedMs: number;
}
