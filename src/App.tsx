/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Chess } from 'chess.js';
import { ChessBoard, BOARD_THEMES, BoardTheme } from './components/ChessBoard';
import { AISettingsPanel } from './components/AISettingsPanel';
import { GemmaLogPanel } from './components/GemmaLogPanel';
import { ChessPiece } from './components/ChessPiece';
import { AISettings, PromptLog, MoveLog } from './types';
import { getGemmaModelMove, getRetroEngineMove } from './utils/engine';
import { customAudioEngine } from './utils/audio';

import {
  Sparkles,
  RotateCcw,
  Volume2,
  VolumeX,
  Plus,
  Play,
  Heart,
  HelpCircle,
  Code,
  ShieldAlert,
  Crown
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

// Initial default configuration
const DEFAULT_AI_SETTINGS: AISettings = {
  apiUrl: 'http://localhost:1234/v1',
  model: 'gemma',
  enabled: false, // Default to false (fully functional local minimax play, user can toggle)
  temperature: 0.7,
  maxTokens: 300,
  systemPrompt: '',
  useFallback: true,
  thinkingDelay: 1200 // Adorable delay to make the bot look lifelike
};

export default function App() {
  const [chessRef, setChessRef] = useState<Chess>(() => new Chess());
  const [fenState, setFenState] = useState<string>(() => chessRef.fen());
  const [aiSettings, setAiSettings] = useState<AISettings>(DEFAULT_AI_SETTINGS);
  const [promptLogs, setPromptLogs] = useState<PromptLog[]>([]);
  const [moveHistory, setMoveHistory] = useState<MoveLog[]>([]);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [boardTheme, setBoardTheme] = useState<BoardTheme>(BOARD_THEMES[0]);
  const [soundOn, setSoundOn] = useState<boolean>(true);
  
  // Game states
  const [gameOverInfo, setGameOverInfo] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    winner: 'w' | 'b' | 'draw' | null;
  } | null>(null);

  const [showDeploymentHelp, setShowDeploymentHelp] = useState<boolean>(false);

  // Status logs
  const [statusMessage, setStatusMessage] = useState<string>('Welcome to Chibi 8-Bit Chess! Make your move below. 🍓');

  // Triggering game reset
  const handleResetGame = useCallback(() => {
    const newChess = new Chess();
    setChessRef(newChess);
    setFenState(newChess.fen());
    setMoveHistory([]);
    setLastMove(null);
    setPromptLogs([]);
    setIsThinking(false);
    setGameOverInfo(null);
    setStatusMessage('Crafted a brand new retro sugary board! Your turn! 🍓');
    if (soundOn) {
      customAudioEngine.playMove();
    }
  }, [soundOn]);

  // Extract captured pieces
  const getCapturedPieces = () => {
    const defaultPieces = {
      w: { p: 8, n: 2, b: 2, r: 2, q: 1 },
      b: { p: 8, n: 2, b: 2, r: 2, q: 1 }
    };
    
    const currentCount = {
      w: { p: 0, n: 0, b: 0, r: 0, q: 0 },
      b: { p: 0, n: 0, b: 0, r: 0, q: 0 }
    };
    
    const board = chessRef.board();
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const sq = board[r][c];
        if (sq && sq.type !== 'k') {
          const typeChar = sq.type as 'p' | 'n' | 'b' | 'r' | 'q';
          currentCount[sq.color][typeChar]++;
        }
      }
    }
    
    const capturedWhite: string[] = []; // Held by Black
    const capturedBlack: string[] = []; // Held by White
    
    // White pieces captured
    Object.keys(defaultPieces.w).forEach((k) => {
      const type = k as 'p' | 'n' | 'b' | 'r' | 'q';
      const diff = defaultPieces.w[type] - currentCount.w[type];
      for (let i = 0; i < diff; i++) {
        capturedWhite.push(type);
      }
    });

    // Black pieces captured
    Object.keys(defaultPieces.b).forEach((k) => {
      const type = k as 'p' | 'n' | 'b' | 'r' | 'q';
      const diff = defaultPieces.b[type] - currentCount.b[type];
      for (let i = 0; i < diff; i++) {
        capturedBlack.push(type);
      }
    });

    return { capturedWhite, capturedBlack };
  };

  const { capturedWhite, capturedBlack } = getCapturedPieces();

  // Primary runner to trigger AI move calculations
  const triggerAIMove = useCallback(async (currentChess: Chess) => {
    setIsThinking(true);
    setStatusMessage('GemmaBot is calculating retro pixel nodes... 🤔');
    
    // Simulate thinking delay so the animation remains visible
    await new Promise((resolve) => setTimeout(resolve, aiSettings.thinkingDelay));

    const sanHistory = moveHistory.map((m) => m.san);

    // Dynamic responses for local minimax AI
    const cutePhrases = [
      "*adjusts pixel ribbon* Scanning board coordinates! 🎀",
      "*retro sparkles* Knight hop incoming! 🐎",
      "Pawn march! *beeps with cute confidence* 🍡",
      "Let us secure the cookie fortress! 🏰",
      "*glorious star dust* Moving my teddy helper! 🧸",
      "Hehe, watch this cute maneuver! 💫",
    ];

    try {
      if (aiSettings.enabled) {
        // query LM Studio
        const result = await getGemmaModelMove(currentChess, sanHistory, aiSettings);
        
        // Execute move on actual chessboard
        const moveDetails = currentChess.move(result.move);
        const playedSan = moveDetails.san;

        if (soundOn) {
          if (moveDetails.captured) {
            customAudioEngine.playCapture();
          } else if (currentChess.inCheck()) {
            customAudioEngine.playCheck();
          } else {
            customAudioEngine.playMove();
          }
        }

        setLastMove({ from: moveDetails.from, to: moveDetails.to });
        setPromptLogs((prev) => [...prev, result.log]);
        
        const newMoveLog: MoveLog = {
          id: Math.random().toString(36).substring(4),
          san: playedSan,
          from: moveDetails.from,
          to: moveDetails.to,
          color: 'b',
          piece: moveDetails.piece,
          captured: moveDetails.captured ? moveDetails.captured : undefined,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        };
        setMoveHistory((prev) => [...prev, newMoveLog]);
        setStatusMessage(`GemmaBot played ${playedSan}! "${result.remark}" 👾`);

      } else {
        // Run minimax local solver
        const bestMove = getRetroEngineMove(currentChess, 2);
        const moveDetails = currentChess.move(bestMove);
        const playedSan = moveDetails.san;

        if (soundOn) {
          if (moveDetails.captured) {
            customAudioEngine.playCapture();
          } else if (currentChess.inCheck()) {
            customAudioEngine.playCheck();
          } else {
            customAudioEngine.playMove();
          }
        }

        setLastMove({ from: moveDetails.from, to: moveDetails.to });
        
        const phrase = cutePhrases[Math.floor(Math.random() * cutePhrases.length)];
        const simulatedLog: PromptLog = {
          id: Math.random().toString(36).substring(4),
          timestamp: new Date().toLocaleTimeString(),
          prompt: 'Local MiniMax offline algorithm activated.',
          responseText: JSON.stringify({
            remark: phrase,
            reasoning: 'Calculated minimax depth-2 scores across board positions.',
            move: playedSan
          }),
          parsedMove: playedSan,
          isValid: true,
          mode: 'retro-engine',
          elapsedMs: 25
        };

        setPromptLogs((prev) => [...prev, simulatedLog]);

        const newMoveLog: MoveLog = {
          id: Math.random().toString(36).substring(4),
          san: playedSan,
          from: moveDetails.from,
          to: moveDetails.to,
          color: 'b',
          piece: moveDetails.piece,
          captured: moveDetails.captured ? moveDetails.captured : undefined,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        };
        setMoveHistory((prev) => [...prev, newMoveLog]);
        setStatusMessage(`Offline AI played ${playedSan}! "${phrase}" 👾`);
      }

      setFenState(currentChess.fen());
    } catch (err: any) {
      console.error(err);
      setStatusMessage('Swapped back to safety grid index. AI thinking refresh needed! 🎀');
    } finally {
      setIsThinking(false);
    }
  }, [aiSettings, moveHistory, soundOn]);

  // Check Game Over status whenever the FEN changes
  useEffect(() => {
    if (chessRef.isGameOver()) {
      let title = "Game Complete!";
      let desc = "The sweet retro board matches standard draw limits.";
      let winner: 'w' | 'b' | 'draw' | null = null;

      if (chessRef.isCheckmate()) {
        const loserColor = chessRef.turn();
        if (loserColor === 'w') {
          title = "✨ GemmaBot Wins Checkmate! ✨";
          desc = "A magnificent 8-bit chip match! The Cozy Lilac cupcakes proved victorious. Play again! 👾";
          winner = 'b';
          if (soundOn) customAudioEngine.playLose();
        } else {
          title = "🎉 Sweet Match Victory! 🎉";
          desc = "You solved the chess grid beautifully! Sweet strawberry cream beats the purple pixels! 🍓";
          winner = 'w';
          if (soundOn) customAudioEngine.playWin();
        }
      } else if (chessRef.isDraw()) {
        title = "🍿 Chess Match Draw! 🍿";
        winner = 'draw';
        if (soundOn) customAudioEngine.playMove(); // simple double tone
        if (chessRef.isStalemate()) {
          desc = "Stalemate detected! No legal moves remain. Both teams sharing candy!";
        } else if (chessRef.isThreefoldRepetition()) {
          desc = "Threefold repetition! Coordinates cycled into a retro loop!";
        } else {
          desc = "Insufficient materials on board to continue playing.";
        }
      }

      setGameOverInfo({
        isOpen: true,
        title,
        description: desc,
        winner
      });
      return;
    }

    // Capture Black (AI) Turn trigger
    const turn = chessRef.turn();
    if (turn === 'b' && !isThinking) {
      triggerAIMove(chessRef);
    }
  }, [fenState, chessRef, isThinking, triggerAIMove, soundOn]);

  // Handle Player Moves
  const handlePlayerMove = (from: string, to: string, promotion?: string) => {
    if (isThinking) return;

    try {
      const moveDetails = chessRef.move({
        from,
        to,
        promotion: promotion || undefined
      });

      const playedSan = moveDetails.san;

      // Play retro tone
      if (soundOn) {
        if (moveDetails.captured) {
          customAudioEngine.playCapture();
        } else if (chessRef.inCheck()) {
          customAudioEngine.playCheck();
        } else {
          customAudioEngine.playMove();
        }
      }

      setLastMove({ from: moveDetails.from, to: moveDetails.to });
      setFenState(chessRef.fen());

      // Write Move history log
      const newMoveLog: MoveLog = {
        id: Math.random().toString(36).substring(4),
        san: playedSan,
        from: moveDetails.from,
        to: moveDetails.to,
        color: 'w',
        piece: moveDetails.piece,
        captured: moveDetails.captured ? moveDetails.captured : undefined,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      };
      
      setMoveHistory((prev) => [...prev, newMoveLog]);
      setStatusMessage(`You played ${playedSan}! Let's see how Gemma responds... 🍡`);

    } catch (moveErr) {
      // Catch bad actions
      setStatusMessage("Beep! Handshake error. That move isn't legal! 🌸");
    }
  };

  const handleSoundOnToggle = () => {
    const val = !soundOn;
    setSoundOn(val);
    customAudioEngine.toggleSound(val);
  };

  return (
    <div className="min-h-screen bg-[#FFDEF2] text-black flex flex-col font-mono select-none pb-12 antialiased">
      {/* Import Press Start 2P Google Font and Fredoka */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@300..700&family=Press+Start+2P&display=swap');
        
        .font-pixel {
          font-family: 'Press Start 2P', monospace;
        }
        
        /* 8-bit button shadows */
        .btn-pixel-shadow {
          box-shadow: 2px 2px 0px 0px #000000;
        }
        .btn-pixel-shadow:active {
          transform: translateY(2px);
          box-shadow: 0px 0px 0px 0px #000000;
        }
      `}</style>

      {/* cute dessert header bar */}
      <header className="bg-[#FF80BF] border-b-4 border-black py-4 px-6 shrink-0 relative shadow-[0_4px_0_0_rgba(0,0,0,0.1)]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white border-2 border-black flex items-center justify-center text-xl shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
              ✨
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-white uppercase tracking-tighter drop-shadow-[2px_2px_0_rgba(0,0,0,1)]">
                Gemma's Pixel Quest
              </h1>
            </div>
          </div>

          {/* Active status panel ticker */}
          <div className="bg-black px-4 py-2 border-2 border-black max-w-md w-full flex items-center justify-center text-center shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
            <span className="font-mono text-[10px] text-[#B2FFD6] leading-relaxed font-bold animate-pulse">
              {statusMessage}
            </span>
          </div>

          {/* Sound & reset control strip */}
          <div className="flex gap-2.5 flex-wrap items-center justify-center">
            <button
              id="help-deploy-btn"
              onClick={() => setShowDeploymentHelp(true)}
              className="px-3 py-1.5 bg-white border-2 border-black text-black hover:bg-pink-50 transition cursor-pointer btn-pixel-shadow flex items-center justify-center gap-1 text-xs font-black"
              title="Show local PC setup & deployment guide"
            >
              <HelpCircle className="w-4 h-4 text-black shrink-0" />
              <span>Deploy Info</span>
            </button>

            <button
              id="sound-switch-top"
              onClick={handleSoundOnToggle}
              className="p-2 bg-white border-2 border-black text-black hover:bg-pink-50 transition cursor-pointer btn-pixel-shadow flex items-center justify-center"
              title="Toggle sound"
            >
              {soundOn ? <Volume2 className="w-4 h-4 text-black" /> : <VolumeX className="w-4 h-4 text-gray-400" />}
            </button>

            <button
              id="reset-top-btn"
              onClick={handleResetGame}
              className="px-4 py-1.5 bg-[#B2FFD6] text-black border-2 border-black font-black text-xs uppercase hover:bg-emerald-300 transition-all cursor-pointer btn-pixel-shadow flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset game
            </button>
          </div>
        </div>
      </header>

      {/* Core game dashboard */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 flex-1 w-full font-mono">
        {/* Top Active stats bar */}
        <div className="max-w-7xl mx-auto mb-6 flex flex-wrap gap-4 items-center justify-between bg-white border-4 border-black p-3 shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
          <div className="flex gap-4 items-center">
            <div className="bg-[#7D5A94] text-white px-4 py-1 text-xs border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] flex items-center gap-2 font-bold uppercase">
              <span className="w-2 h-2 bg-[#B2FFD6] rounded-full animate-pulse"></span> 
              LM STUDIO: {aiSettings.enabled ? "CONNECTED" : "OFFLINE"}
            </div>
            <div className="bg-white text-black px-4 py-1 text-xs border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] font-bold uppercase">
              TURN: {chessRef.turn() === 'w' ? 'PLAYER' : 'GEMMA'}
            </div>
          </div>
          <div className="text-xs font-bold text-gray-500 uppercase">
            Sweets Match Edition 🍬
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          
          {/* Column Left (Contains board, players details) */}
          <div className="lg:col-span-7 flex flex-col gap-6 items-center">
            
            {/* Player 2: GemmaBot black */}
            <div className="w-full max-w-[450px] bg-white border-4 border-black p-4 flex flex-col items-center shadow-[4px_4px_0_0_rgba(0,0,0,1)] text-black">
              <div className="text-[10px] font-black text-[#FF80BF] uppercase mb-2 self-start font-mono tracking-wider">Opponent Profile</div>
              <div className="flex w-full items-center justify-between gap-4">
                <div className="w-24 h-24 bg-[#B2FFD6] border-4 border-black flex items-center justify-center relative overflow-hidden shrink-0 shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                  <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle,black_1px,transparent_1px)] [background-size:10px_10px]"></div>
                  {/* Bobbing animated piece */}
                  <div className={isThinking ? "animate-bounce" : ""}>
                    <ChessPiece type="k" color="b" size={56} isThinking={isThinking} />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-black text-lg uppercase tracking-widest text-black">Gemma Bot v4</div>
                  
                  {/* Thinking Power display */}
                  <div className="w-full bg-gray-200 h-3 mt-2 border-2 border-black relative overflow-hidden bg-white">
                    <div 
                      className="bg-[#FF80BF] h-full transition-all duration-500 border-r-2 border-black" 
                      style={{ width: isThinking ? '95%' : '75%' }} 
                    />
                  </div>
                  <div className="text-[9px] mt-1 text-gray-500 uppercase font-black flex justify-between">
                    <span>Thinking: {isThinking ? '95%' : '75%'}</span>
                    <span>{aiSettings.enabled ? "Gemma v4" : "Minimax"}</span>
                  </div>
                </div>
              </div>

              {/* Captured piece tray (held by Black) */}
              <div className="w-full mt-3 pt-3 border-t-2 border-dashed border-gray-200">
                <span className="text-[9px] font-mono font-black uppercase text-gray-400 block mb-1 text-left">Captured (held by Gemma)</span>
                <div className="flex items-center gap-1 bg-gray-50 border-2 border-black p-1.5 min-h-[42px] overflow-x-auto bg-white">
                  {capturedWhite.length === 0 ? (
                    <span className="text-[9px] font-mono uppercase tracking-widest text-gray-400 px-2 select-none">No captures</span>
                  ) : (
                    capturedWhite.map((type, idx) => (
                      <div key={`captured-w-${idx}`} className="shrink-0 bg-[#FFD1DC] border border-black p-0.5">
                        <ChessPiece type={type} color="w" size={16} isCaptured={true} />
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Chess Board widget */}
            <div className="relative">
              {isThinking && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 bg-black text-white text-[9px] font-mono px-3 py-1 border-2 border-[#FFD1DC] tracking-widest uppercase shadow-[2px_2px_0_0_rgba(0,0,0,1)] animate-pulse">
                  Gemma Thinking...
                </div>
              )}
              <ChessBoard
                chess={chessRef}
                isThinking={isThinking}
                onMove={handlePlayerMove}
                selectedTheme={boardTheme}
                lastMove={lastMove}
                playerColor="w"
              />
            </div>

            {/* Player 1: Strawberry Sweetness User */}
            <div className="w-full max-w-[450px] bg-white border-4 border-black p-4 flex flex-col items-center shadow-[4px_4px_0_0_rgba(0,0,0,1)] text-black">
              <div className="text-[10px] font-black text-[#FF80BF] uppercase mb-2 self-start font-mono tracking-wider">Player Profile</div>
              <div className="flex w-full items-center justify-between gap-4">
                <div className="w-24 h-24 bg-[#FFDEF2] border-4 border-black flex items-center justify-center relative overflow-hidden shrink-0 shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                  <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle,black_1px,transparent_1px)] [background-size:10px_10px]"></div>
                  <ChessPiece type="k" color="w" size={56} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-black text-lg uppercase tracking-widest text-[#333]">Human (You)</div>
                  
                  {/* Vital Sweetness display */}
                  <div className="w-full bg-gray-200 h-3 mt-2 border-2 border-black relative overflow-hidden bg-white">
                    <div className="bg-[#B2FFD6] h-full w-full border-r-2 border-black" />
                  </div>
                  <div className="text-[9px] mt-1 text-gray-500 uppercase font-black flex justify-between">
                    <span>Sweet vitality: 100%</span>
                    <span>Cotton Candy Team 🍓</span>
                  </div>
                </div>
              </div>

              {/* Captured piece tray (held by White USER) */}
              <div className="w-full mt-3 pt-3 border-t-2 border-dashed border-gray-200">
                <span className="text-[9px] font-mono font-black uppercase text-gray-400 block mb-1 text-left">Captured (held by You)</span>
                <div className="flex items-center gap-1 bg-gray-50 border-2 border-black p-1.5 min-h-[42px] overflow-x-auto bg-white">
                  {capturedBlack.length === 0 ? (
                    <span className="text-[9px] font-mono uppercase tracking-widest text-gray-400 px-2 select-none">No captures</span>
                  ) : (
                    capturedBlack.map((type, idx) => (
                      <div key={`captured-b-${idx}`} className="shrink-0 bg-[#FFD1DC] border border-black p-0.5">
                        <ChessPiece type={type} color="b" size={16} isCaptured={true} />
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Board Theme Switcher buttons */}
            <div className="w-full max-w-[450px] p-4 bg-white border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] flex flex-col gap-2 text-black">
              <span className="text-[10px] font-mono font-black text-black uppercase tracking-wider block mb-1 text-left">🍭 Theme Switcher</span>
              <div className="grid grid-cols-2 gap-2">
                {BOARD_THEMES.map((theme) => (
                  <button
                    key={theme.name}
                    id={`theme-btn-${theme.name}`}
                    onClick={() => setBoardTheme(theme)}
                    className={`px-3 py-2 text-xs uppercase font-black border-2 transition-all cursor-pointer ${
                      boardTheme.name === theme.name
                        ? 'bg-[#FF80BF] border-black text-white shadow-[2px_2px_0_0_rgba(0,0,0,1)]'
                        : 'bg-white border-gray-300 text-black hover:border-black'
                    }`}
                  >
                    {theme.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Chess Piece Codex Panel */}
            <div className="w-full max-w-[450px] p-4 bg-white border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] flex flex-col gap-2.5 text-black">
              <span className="text-[10px] font-mono font-black text-black uppercase tracking-wider block mb-1 text-left">👾 8-Bit Chess Piece Codex</span>
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                <div className="flex items-center gap-2 p-1.5 border-2 border-black bg-[#FFDEF2]/25 shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                  <ChessPiece type="p" color="w" size={28} />
                  <div>
                    <div className="font-extrabold text-black uppercase text-[10px]">Pawn</div>
                    <div className="text-[9px] text-[#FF80BF] font-black uppercase tracking-tight leading-none">Bubble Pawn</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-1.5 border-2 border-black bg-[#FFDEF2]/25 shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                  <ChessPiece type="r" color="w" size={28} />
                  <div>
                    <div className="font-extrabold text-black uppercase text-[10px]">Rook</div>
                    <div className="text-[9px] text-[#FF80BF] font-black uppercase tracking-tight leading-none">Fortress Rook</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-1.5 border-2 border-black bg-[#FFDEF2]/25 shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                  <ChessPiece type="n" color="w" size={28} />
                  <div>
                    <div className="font-extrabold text-black uppercase text-[10px]">Knight</div>
                    <div className="text-[9px] text-[#FF80BF] font-black uppercase tracking-tight leading-none">Chibi Knight</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-1.5 border-2 border-black bg-[#FFDEF2]/25 shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                  <ChessPiece type="b" color="w" size={28} />
                  <div>
                    <div className="font-extrabold text-black uppercase text-[10px]">Bishop</div>
                    <div className="text-[9px] text-[#FF80BF] font-black uppercase tracking-tight leading-none">Wizard Bishop</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-1.5 border-2 border-black bg-[#FFDEF2]/25 shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                  <ChessPiece type="q" color="w" size={28} />
                  <div>
                    <div className="font-extrabold text-black uppercase text-[10px]">Queen</div>
                    <div className="text-[9px] text-[#FF80BF] font-black uppercase tracking-tight leading-none">Cupcake Queen</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-1.5 border-2 border-black bg-[#FFDEF2]/25 shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                  <ChessPiece type="k" color="w" size={28} />
                  <div>
                    <div className="font-extrabold text-black uppercase text-[10px]">King</div>
                    <div className="text-[9px] text-[#FF80BF] font-black uppercase tracking-tight leading-none">Teddy King</div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Column Right (Contains setup logs panel and mind logs tab) */}
          <div className="lg:col-span-5 space-y-6 flex flex-col justify-between">
            
            {/* Connection settings Panel */}
            <AISettingsPanel
              settings={aiSettings}
              onChange={setAiSettings}
            />

            {/* Minds Prompt Logs & Moves chronicles */}
            <GemmaLogPanel
              logs={promptLogs}
              moves={moveHistory}
            />

          </div>

        </div>
      </main>

      {/* Game Over Dialogue Modal */}
      <Dialog open={gameOverInfo !== null && gameOverInfo.isOpen} onOpenChange={(open) => {
        if (!open) setGameOverInfo(null);
      }}>
        <DialogContent className="border-4 border-black bg-white rounded-none p-6 text-center max-w-sm flex flex-col items-center shadow-[8px_8px_0_0_rgba(0,0,0,1)]">
          <DialogHeader className="flex flex-col items-center">
            <div className="w-20 h-20 bg-pink-100 rounded-full flex items-center justify-center p-2 mb-4 border-4 border-black animate-pulse shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
              <Crown className="w-10 h-10 text-yellow-500 fill-yellow-400" />
            </div>
            <DialogTitle className="font-mono text-sm leading-relaxed uppercase tracking-wider font-black text-[#FF80BF]">
              {gameOverInfo?.title}
            </DialogTitle>
            <DialogDescription className="font-mono text-xs text-black pt-3 leading-relaxed">
              {gameOverInfo?.description}
            </DialogDescription>
          </DialogHeader>

          <button
            id="play-again-modal"
            onClick={handleResetGame}
            className="mt-6 px-6 py-2 bg-[#B2FFD6] text-black border-2 border-black font-black text-xs uppercase hover:bg-emerald-300 transition-all cursor-pointer btn-pixel-shadow flex items-center gap-2"
          >
            Play Again! 🍭
          </button>
        </DialogContent>
      </Dialog>

      {/* Deployment & Guide Info Dialogue Modal */}
      <Dialog open={showDeploymentHelp} onOpenChange={setShowDeploymentHelp}>
        <DialogContent className="border-4 border-black bg-white rounded-none p-6 max-w-lg flex flex-col shadow-[8px_8px_0_0_rgba(0,0,0,1)] text-black">
          <DialogHeader className="border-b-2 border-dashed border-gray-300 pb-3">
            <DialogTitle className="font-mono text-sm uppercase tracking-wider font-black text-[#FF80BF] flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-[#FF80BF]" />
              🍭 Local PC Setup & Play Guide
            </DialogTitle>
            <DialogDescription className="font-mono text-[10px] text-gray-500 uppercase font-bold pt-1">
              Instructions to run locally & sync with desktop LLMs
            </DialogDescription>
          </DialogHeader>

          <div className="font-mono text-xs space-y-4 max-h-[380px] overflow-y-auto pr-1 py-1.5 leading-relaxed">
            {/* Sec 1 */}
            <div>
              <h4 className="font-black text-black uppercase text-[11px] border-b-2 border-black pb-1 mb-2">
                1. Local Environment Setup:
              </h4>
              <ol className="list-decimal list-inside space-y-1.5 text-gray-800">
                <li>Export this codebase using the top-right settings Menu of AI Studio, and unzip it.</li>
                <li>Ensure you have <strong className="text-black">Node.js (v18+)</strong> and terminal capabilities installed.</li>
                <li>In your terminal workspace path, run: <code className="bg-gray-100 border border-gray-300 px-1 py-0.5 rounded text-[11px] font-black">npm install</code></li>
                <li>To boot up the desktop game locally, run: <code className="bg-gray-100 border border-gray-300 px-1 py-0.5 rounded text-[11px] font-black">npm run dev</code></li>
                <li>Access the game locally at <a href="http://localhost:3000" target="_blank" rel="noreferrer" className="text-pink-600 underline font-black">http://localhost:3000</a>!</li>
              </ol>
            </div>

            {/* Sec 2 */}
            <div>
              <h4 className="font-black text-black uppercase text-[11px] border-b-2 border-black pb-1 mb-2">
                2. Pairing with Local Gemma (LM Studio):
              </h4>
              <p className="text-[11px] text-gray-700 mb-2">
                By default, you fight against our clever lookahead MiniMax engine. To activate the customized Gemma commentary bot:
              </p>
              <ol className="list-decimal list-inside space-y-1.5 text-gray-800">
                <li>Download & launch <a href="https://lmstudio.ai" target="_blank" rel="noreferrer" className="text-pink-600 underline">LM Studio</a> on your machine.</li>
                <li>Search and download <strong className="text-black">Gemma 2 2B Instruct</strong> (GGUF format).</li>
                <li>Go to the <strong className="text-black">Developer Tab (Local Server)</strong>, load your loaded model, and press <strong className="text-black">"Start Server"</strong>.</li>
                <li>In LM Studio local server developer parameters, verify that <strong className="text-black">CORS</strong> is enabled.</li>
                <li>In the game interface's <strong className="text-pink-600">LM Studio Settings</strong>, adjust your api link / model name, and hit the <strong className="text-black">"Test"</strong> button. Once successful, turn on the <span className="font-black text-[#FF80BF]">"USE LOCAL GEMMA OPPONENT"</span> switch!</li>
              </ol>
            </div>

            {/* Sec 3 */}
            <div>
              <h4 className="font-black text-black uppercase text-[11px] border-b-2 border-black pb-1 mb-2">
                3. Compiling production distribution:
              </h4>
              <p className="text-gray-800">
                Generate compressed, standalone assets: <code className="bg-gray-100 border border-gray-300 px-1.5 py-0.5 rounded text-[11px] font-black">npm run build</code>. Your production-ready folder will be outputted under <code className="font-bold text-black">/dist</code>.
              </p>
            </div>
          </div>

          <div className="border-t-2 border-dashed border-gray-300 pt-3 mt-3 flex justify-end">
            <button
              id="close-deploy-dialog"
              onClick={() => setShowDeploymentHelp(false)}
              className="px-6 py-1.5 bg-[#B2FFD6] text-black border-2 border-black font-black text-xs uppercase hover:bg-emerald-300 transition-all cursor-pointer btn-pixel-shadow"
            >
              Sweet, Got It! 🍭
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
