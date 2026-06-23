/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { PromptLog, MoveLog } from '../types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Terminal, Clock, Hash, CheckCircle, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface GemmaLogPanelProps {
  logs: PromptLog[];
  moves: MoveLog[];
}

export function GemmaLogPanel({ logs, moves }: GemmaLogPanelProps) {
  const [activeTab, setActiveTab] = useState<'thoughts' | 'moves'>('thoughts');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const logScrollRef = useRef<HTMLDivElement>(null);
  const moveScrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll the move list to the bottom when new moves arrive
  useEffect(() => {
    if (activeTab === 'moves' && moveScrollRef.current) {
      moveScrollRef.current.scrollTop = moveScrollRef.current.scrollHeight;
    }
  }, [moves, activeTab]);

  useEffect(() => {
    if (activeTab === 'thoughts' && logScrollRef.current) {
      logScrollRef.current.scrollTop = logScrollRef.current.scrollHeight;
    }
  }, [logs, activeTab]);

  // Read clean move names
  const getPieceLabel = (p: string) => {
    const labels: Record<string, string> = {
      p: 'Pawn (Bubble Pawn)',
      r: 'Rook (Fortress Rook)',
      n: 'Knight (Chibi Knight)',
      b: 'Bishop (Wizard Bishop)',
      q: 'Queen (Cupcake Queen)',
      k: 'King (Teddy King)'
    };
    return labels[p.toLowerCase()] || p;
  };

  return (
    <Card className="border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] overflow-hidden rounded-none flex flex-col h-[480px] bg-white">
      <CardHeader className="p-0 border-b-4 border-black select-none shrink-0 bg-white">
        <div className="flex">
          <button
            id="tab-thoughts-btn"
            onClick={() => setActiveTab('thoughts')}
            className={`flex-1 py-3 px-4 font-mono text-xs uppercase font-black tracking-wider transition-all duration-150 flex items-center justify-center gap-2 border-r-4 border-black cursor-pointer ${
              activeTab === 'thoughts' ? 'bg-[#FF80BF] text-white' : 'bg-white text-black hover:bg-pink-50'
            }`}
          >
            <Terminal className="w-4 h-4" />
            Gemma Mind ({logs.length})
          </button>
          
          <button
            id="tab-moves-btn"
            onClick={() => setActiveTab('moves')}
            className={`flex-1 py-3 px-4 font-mono text-xs uppercase font-black tracking-wider transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'moves' ? 'bg-[#FF80BF] text-white' : 'bg-white text-black hover:bg-pink-50'
            }`}
          >
            <Hash className="w-4 h-4" />
            Moves Log ({moves.length})
          </button>
        </div>
      </CardHeader>

      <CardContent className="p-4 flex-1 overflow-hidden min-h-0 bg-[#FFDEF2]/35">
        {activeTab === 'thoughts' ? (
          /* thoughts tab */
          <div className="flex flex-col h-full">
            {logs.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-400 font-mono animate-pulse">
                <MessageSquare className="w-8 h-8 text-slate-300 mb-2 stroke-[1.5]" />
                <p className="text-xs">No thinking files accumulated yet.</p>
                <p className="text-[10px] text-muted-foreground mt-1 max-w-[200px]">Moves made by Gemma will stream system prompt computations here!</p>
              </div>
            ) : (
              <div ref={logScrollRef} className="flex-1 overflow-y-auto space-y-3.5 pr-1.5 scrollbar-thin scrollbar-thumb-slate-300">
                {logs.map((log, index) => {
                  let parsedRemark = "Let's do this! *happy chime*";
                  let parsedReasoning = "Calculating optimal 8-bit grid moves...";
                  
                  try {
                    const block = JSON.parse(log.responseText.match(/\{[\s\S]*\}/)?.[0] || log.responseText);
                    parsedRemark = block.remark || parsedRemark;
                    parsedReasoning = block.reasoning || parsedReasoning;
                  } catch (e) {
                    // Fallback string manipulation
                    if (log.responseText && !log.responseText.includes('Error')) {
                      parsedReasoning = log.responseText.substring(0, 100) + '...';
                    }
                  }

                  const isExpanded = expandedLogId === log.id;

                  return (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 bg-white border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] flex flex-col space-y-2 relative overflow-hidden"
                    >
                      {/* Badge status bar */}
                      <div className="flex items-center justify-between text-[10px] font-mono border-b-2 border-black pb-1.5 leading-none">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2.5 h-2.5 border border-black ${log.isValid ? 'bg-emerald-400' : 'bg-red-400'}`} />
                          <span className="font-bold uppercase text-[#333]">Turn #{index + 1}</span>
                          <span className="text-gray-500 font-normal">({log.timestamp})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="text-[8px] px-1 py-0.5 uppercase tracking-wider bg-[#B2FFD6] text-black border border-black rounded-none">
                            {log.mode === 'gemma' ? 'LM-Studio Gemma' : 'MiniMax Fallback'}
                          </Badge>
                          <span className="text-gray-600 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-black" />
                            {log.elapsedMs}ms
                          </span>
                        </div>
                      </div>

                      {/* Cute Speech Bubble remark */}
                      <div className="bg-[#FFDEF2] p-2.5 border border-black text-xs text-black leading-relaxed font-mono relative">
                        <span className="text-pink-600 font-black block mb-1">GemmaBot:</span>
                        <p className="italic text-[11px] font-bold">"{parsedRemark}"</p>
                      </div>

                      {/* Compact reasoning snippet */}
                      <div className="text-xs text-slate-600 font-mono pl-1 leading-relaxed">
                        <span className="text-slate-400 uppercase font-bold text-[9px] block">MIND LOG RATIONALE:</span>
                        {parsedReasoning}
                      </div>

                      {/* Selected move result indicator */}
                      <div className="flex items-center gap-1.5 p-1.5 bg-gray-50 border-2 border-black text-[10px] font-mono justify-between text-black">
                        <span>Chosen FEN action:</span>
                        <span className="font-bold text-black bg-[#B2FFD6] border border-black px-1.5 py-0.5 uppercase tracking-wider">{log.parsedMove || 'None'}</span>
                      </div>

                      {/* Expandable technical details toggle */}
                      <div className="pt-1 border-t border-dashed border-slate-200 flex justify-end">
                        <button
                          id={`expand-log-${log.id}`}
                          onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                          className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                        >
                          {isExpanded ? (
                            <>
                              <EyeOff className="w-3 h-3" /> Hide Raw Prompt Code
                            </>
                          ) : (
                            <>
                              <Eye className="w-3 h-3" /> Inspect Prompt Specs
                            </>
                          )}
                        </button>
                      </div>

                      {/* Technical block display */}
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="bg-slate-950 p-2.5 rounded-lg text-[9px] text-slate-300 font-mono overflow-x-auto space-y-2 mt-1 leading-tight shrink-0 select-text max-h-[150px] overflow-y-auto"
                        >
                          <div>
                            <span className="text-pink-400">=== SENT INSTRUCTION PROMPT ===</span>
                            <pre className="mt-1 text-slate-400 whitespace-pre-wrap">{log.prompt}</pre>
                          </div>
                          <div className="pt-1 border-t border-slate-800">
                            <span className="text-violet-400">=== RAW MODEL REPLY ===</span>
                            <pre className="mt-1 text-slate-300 whitespace-pre-wrap">{log.responseText}</pre>
                          </div>
                        </motion.div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* moves tab */
          <div className="flex flex-col h-full">
            {moves.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-400 font-mono animate-pulse">
                <Hash className="w-8 h-8 text-slate-300 mb-2" />
                <p className="text-xs">Battle field stands silent.</p>
                <p className="text-[10px] text-muted-foreground mt-1 max-w-[200px]">Make your opening chess move on the Cotton Candy board to write history!</p>
              </div>
            ) : (
              <div ref={moveScrollRef} className="flex-1 overflow-y-auto space-y-2 pr-1.5 max-h-[400px]">
                <div className="grid grid-cols-12 gap-1 px-2 py-1 text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200">
                  <div className="col-span-2">No.</div>
                  <div className="col-span-3">Chibi Foe</div>
                  <div className="col-span-3">Coordinates</div>
                  <div className="col-span-2">SAN</div>
                  <div className="col-span-2 text-right">Time</div>
                </div>

                {moves.map((move, index) => {
                  const isWhite = move.color === 'w';
                  return (
                    <motion.div
                      key={move.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`grid grid-cols-12 gap-1 items-center px-2 py-2 text-[11px] font-mono border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] ${
                        isWhite ? 'bg-[#FFDEF2] text-black font-bold' : 'bg-white text-black font-bold'
                      }`}
                    >
                      <div className="col-span-2 text-slate-400 font-semibold">#{index + 1}</div>
                      
                      <div className="col-span-3 flex items-center gap-1 font-bold">
                        <span className={`w-1.5 h-1.5 rounded-full ${isWhite ? 'bg-pink-400' : 'bg-indigo-300'}`} />
                        {getPieceLabel(move.piece)}
                      </div>
                      
                      <div className="col-span-3 text-[10px] font-semibold text-slate-600">
                        {move.from} → {move.to}
                        {move.captured && (
                          <span className="text-red-400 font-bold ml-1 text-[9px]">xCAPT</span>
                        )}
                      </div>
                      
                      <div className={`col-span-2 font-black ${isWhite ? 'text-pink-600' : 'text-slate-800'}`}>
                        {move.san}
                      </div>

                      <div className="col-span-2 text-right text-[9px] text-muted-foreground">
                        {move.timestamp}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
