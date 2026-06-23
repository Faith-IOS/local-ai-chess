/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Chess } from 'chess.js';
import { AISettings, PromptLog } from '../types';

// Simple heuristic values for chess pieces (positive is good for black, negative is good for white)
const PIECE_VALUES: Record<string, number> = {
  p: 10,
  n: 30,
  b: 30,
  r: 50,
  q: 90,
  k: 1000
};

// Evaluate the board state.
// We want to maximize this score for Black, who plays against the User (White).
export function evaluateBoard(chess: Chess): number {
  let totalEvaluation = 0;
  const board = chess.board();

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const square = board[r][c];
      if (square) {
        const type = square.type;
        const color = square.color;
        let value = PIECE_VALUES[type] || 0;

        // Simple positional bonuses for 8-bit engine
        if (type === 'p') {
          // Pawns encouraged to advance
          if (color === 'b') {
            value += (r - 1) * 0.5; // Encouraged to go down (rows 1 -> 7)
          } else {
            value += (6 - r) * 0.5; // Encouraged to go up (rows 6 -> 0)
          }
        } else if (type === 'n' || type === 'b') {
          // Center preference
          if (c >= 2 && c <= 5 && r >= 2 && r <= 5) {
            value += 1.5;
          }
        }

        if (color === 'b') {
          totalEvaluation += value;
        } else {
          totalEvaluation -= value;
        }
      }
    }
  }

  // Factor in status
  if (chess.isGameOver()) {
    if (chess.isCheckmate()) {
      totalEvaluation += chess.turn() === 'w' ? 8000 : -8000;
    } else {
      // Draw is somewhat neutral
      totalEvaluation += 0;
    }
  }

  return totalEvaluation;
}

// Simple Minimax search with Alpha-Beta pruning
export function minimax(
  chess: Chess,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizingPlayer: boolean
): { score: number; move: string | null } {
  if (depth === 0 || chess.isGameOver()) {
    return { score: evaluateBoard(chess), move: null };
  }

  const moves = chess.moves();
  if (moves.length === 0) {
    return { score: evaluateBoard(chess), move: null };
  }

  let bestMove: string | null = null;

  if (isMaximizingPlayer) {
    let maxEval = -Infinity;
    // Sort moves to speed up pruning (captures first)
    const sortedMoves = [...moves].sort((a, b) => {
      const isACap = a.includes('x') ? 1 : 0;
      const isBCap = b.includes('x') ? 1 : 0;
      return isBCap - isACap;
    });

    for (const move of sortedMoves) {
      const tempChess = new Chess(chess.fen());
      try {
        tempChess.move(move);
        const evaluation = minimax(tempChess, depth - 1, alpha, beta, false).score;
        if (evaluation > maxEval) {
          maxEval = evaluation;
          bestMove = move;
        }
        alpha = Math.max(alpha, evaluation);
        if (beta <= alpha) {
          break; // Beta cutout
        }
      } catch (e) {
        // Skip illegal move states
      }
    }
    return { score: maxEval, move: bestMove };
  } else {
    let minEval = Infinity;
    const sortedMoves = [...moves].sort((a, b) => {
      const isACap = a.includes('x') ? 1 : 0;
      const isBCap = b.includes('x') ? 1 : 0;
      return isBCap - isACap;
    });

    for (const move of sortedMoves) {
      const tempChess = new Chess(chess.fen());
      try {
        tempChess.move(move);
        const evaluation = minimax(tempChess, depth - 1, alpha, beta, true).score;
        if (evaluation < minEval) {
          minEval = evaluation;
          bestMove = move;
        }
        beta = Math.min(beta, evaluation);
        if (beta <= alpha) {
          break; // Alpha cutout
        }
      } catch (e) {
        // Skip illegal
      }
    }
    return { score: minEval, move: bestMove };
  }
}

// Primary solver for the AI player (Black)
export function getRetroEngineMove(chess: Chess, depth: number = 2): string {
  // Turn must be 'b'
  const result = minimax(chess, depth, -Infinity, Infinity, true);
  if (result.move) {
    return result.move;
  }
  // Fallback to random if minimax can't find one
  const moves = chess.moves();
  return moves[Math.floor(Math.random() * moves.length)];
}

// Clean Prompt generation for local Gemma LLM
export function generateGemmaPrompt(chess: Chess, history: string[]): {
  systemPrompt: string;
  userPrompt: string;
} {
  const currentFen = chess.fen();
  const legalMoves = chess.moves();
  const nextColor = chess.turn() === 'b' ? 'Black (your color)' : 'White';
  const recentHistory = history.slice(-10).join(', ') || 'No moves yet';

  const systemPrompt = `You are a cutesy, bubbly 8-bit retro video game AI named "GemmaBot" playing an adorable chess game.
Your target is to beat the user, who is playing as White, while keeping your messages extremely cute, playful, and filled with retro 8-bit pixel gaming humor (like "pawn charge!", "*beep boop*", "pixels power!").

You MUST choose exactly one move from the provided list of LEGAL MOVES.
You MUST respond with a valid JSON block containing your cute 8-bit remarks, your brief mental reasoning, and your choosing move. Do not write any text outside of the JSON block.

Required JSON Schema:
{
  "remark": "A short cute retro chiptune reaction (max 10 words, e.g. '*happy beeps* Let us charge the cute castle! 🏰')",
  "reasoning": "A brief, charming 1-2 sentence chess logical reasoning of why you made this move.",
  "move": "The move you choose. It MUST be EXACTLY one of the provided legal moves from the list."
}`;

  const userPrompt = `Game FEN State: ${currentFen}
Turn: ${nextColor}
Move History (recent): [${recentHistory}]

LEGAL MOVES AVAILABLE (choose EXACTLY one of these strings):
${JSON.stringify(legalMoves)}

Your JSON Response:`;

  return { systemPrompt, userPrompt };
}

// Request move from local LM Studio Gemma Model
export async function getGemmaModelMove(
  chess: Chess,
  history: string[],
  settings: AISettings
): Promise<{
  move: string;
  remark: string;
  reasoning: string;
  log: PromptLog;
}> {
  const { systemPrompt, userPrompt } = generateGemmaPrompt(chess, history);
  const startTime = Date.now();
  const logId = Math.random().toString(36).substring(4);
  const legalMoves = chess.moves();

  // Primary request runner
  try {
    const endpoint = `${settings.apiUrl.replace(/\/$/, '')}/chat/completions`;
    
    const requestPayload = {
      model: settings.model,
      messages: [
        { role: 'system', content: settings.systemPrompt || systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: settings.temperature,
      max_tokens: settings.maxTokens,
      response_format: { type: 'json_object' } // Tells LM studio to return JSON
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestPayload),
      // Set a reasonable timeout so the interface doesn't hang forever
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    // Parse response JSON
    let parsed: { remark?: string; reasoning?: string; move?: string } = {};
    try {
      // Find JSON block if there's markdown wrap
      const jsonStr = content.match(/\{[\s\S]*\}/)?.[0] || content;
      parsed = JSON.parse(jsonStr);
    } catch (parseErr) {
      // Try to extract move directly via regex if JSON parse fails
      const moveMatch = content.match(/"move"\s*:\s*"([^"]+)"/) || content.match(/move:\s*([^\s,]+)/);
      if (moveMatch) {
        parsed.move = moveMatch[1].trim();
      }
      parsed.remark = "Beep boop! Processing static signals...";
      parsed.reasoning = "JSON parse failed, but I tried to salvage the signal directly.";
    }

    const cleanedMove = (parsed.move || '').trim();
    
    // Check if Gemma chose a legal move
    const isValid = legalMoves.includes(cleanedMove);
    const elapsedMs = Date.now() - startTime;

    const log: PromptLog = {
      id: logId,
      timestamp: new Date().toLocaleTimeString(),
      prompt: systemPrompt + "\n\n" + userPrompt,
      responseText: content,
      parsedMove: cleanedMove,
      isValid,
      mode: 'gemma',
      elapsedMs
    };

    if (isValid) {
      return {
        move: cleanedMove,
        remark: parsed.remark || "*pixels shine* Beep!",
        reasoning: parsed.reasoning || "Chose a valid tactical pawn advancement.",
        log
      };
    } else {
      // If move is invalid, trigger fallback
      throw new Error(`Chose illegal move: "${cleanedMove}" (Not in: ${legalMoves.slice(0, 5).join(', ')}...)`);
    }

  } catch (error: any) {
    const elapsedMs = Date.now() - startTime;
    // Calculate fallback immediately
    const fallbackMove = getRetroEngineMove(chess, 2);
    
    const log: PromptLog = {
      id: logId,
      timestamp: new Date().toLocaleTimeString(),
      prompt: systemPrompt + "\n\n" + userPrompt,
      responseText: error?.message || 'Connection error',
      parsedMove: fallbackMove,
      isValid: false,
      error: error?.message || 'Failed connecting to LM Studio at ' + settings.apiUrl,
      mode: 'retro-engine',
      elapsedMs
    };

    return {
      move: fallbackMove,
      remark: "Beep! Connection to LM Studio is resting. Swapping to Retro 8-bit Core AI! 🎮",
      reasoning: `Fallback triggered due to: ${error?.message || 'Connection timeout/error'}.`,
      log
    };
  }
}
