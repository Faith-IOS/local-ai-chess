/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AISettings } from '../types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { customAudioEngine } from '../utils/audio';
import { Info, Wifi, WifiOff, Terminal, Volume2, VolumeX, Cpu, ToyBrick } from 'lucide-react';

interface AISettingsPanelProps {
  settings: AISettings;
  onChange: (settings: AISettings) => void;
}

export function AISettingsPanel({ settings, onChange }: AISettingsPanelProps) {
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'connected' | 'failed'>('idle');
  const [detectedModel, setDetectedModel] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Connection tester
  const testConnection = async () => {
    setTestStatus('testing');
    setErrorMessage(null);
    setDetectedModel(null);
    try {
      const endpoint = `${settings.apiUrl.replace(/\/$/, '')}/models`;
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(4000)
      });
      if (response.ok) {
        const data = await response.json();
        const models = data?.data || [];
        if (models.length > 0) {
          const firstModel = models[0].id;
          setDetectedModel(firstModel);
          // Suggest loaded model
          onChange({ ...settings, model: firstModel });
        }
        setTestStatus('connected');
        customAudioEngine.playMove(); // cute success beep
      } else {
        throw new Error(`LM Studio returned status ${response.status}`);
      }
    } catch (err: any) {
      setTestStatus('failed');
      setErrorMessage(err?.message || 'Could not reach server. Verify that LM Studio is open and CORS is allowed.');
      customAudioEngine.playCheck(); // error buzz
    }
  };

  const handleSoundToggle = (val: boolean) => {
    setSoundEnabled(val);
    customAudioEngine.toggleSound(val);
    if (val) {
      customAudioEngine.playMove();
    }
  };

  return (
    <Card className="border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] overflow-hidden rounded-none bg-white">
      <CardHeader className="bg-[#FF80BF] p-4 border-b-4 border-black">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ToyBrick className="w-5 h-5 text-white stroke-[2.5] drop-shadow-[1px_1px_0_rgba(0,0,0,1)]" />
            <CardTitle className="font-mono text-sm uppercase text-white tracking-widest drop-shadow-[2px_2px_0_rgba(0,0,0,1)]">LM Studio Settings</CardTitle>
          </div>
          <Badge className={`font-mono text-[9px] uppercase tracking-wider rounded-none border border-black ${settings.enabled ? 'bg-[#B2FFD6] text-black font-black' : 'bg-white text-black'}`}>
            {settings.enabled ? 'Gemma Mode ACTIVE' : 'Offline MiniMax Bot'}
          </Badge>
        </div>
        <CardDescription className="text-white text-xs mt-1 font-mono">
          Hook up your cutesy chess board to your local desktop LLM.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-5 space-y-4 bg-[#FFDEF2]/30">
        {/* Toggle active / offline minimax bot */}
        <div className="flex items-center justify-between p-3 border-2 border-black bg-white shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
          <div className="flex flex-col">
            <span className="text-xs font-black leading-none text-black flex items-center gap-1.5 font-mono">
              <Cpu className="w-3.5 h-3.5 text-[#FF80BF]" />
              USE LOCAL GEMMA OPPONENT
            </span>
            <span className="text-[10px] text-gray-700 mt-1 font-mono">If disabled, a clean local MiniMax engine acts as Black!</span>
          </div>
          <Switch
            id="gemma-enable-switch"
            checked={settings.enabled}
            onCheckedChange={(checked) => onChange({ ...settings, enabled: checked })}
          />
        </div>

        {settings.enabled ? (
          <div className="space-y-3.5 animate-fadeIn">
             {/* API BASE URL */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <Label htmlFor="api-url" className="text-xs font-black font-mono text-black uppercase">LM Studio Server URL</Label>
                <span className="text-[10px] font-mono text-gray-500">Default: http://localhost:1234/v1</span>
              </div>
              <div className="flex gap-2">
                <Input
                  id="api-url"
                  type="text"
                  className="font-mono text-xs bg-white text-black border-2 border-black rounded-none shadow-[2px_2px_0_0_rgba(0,0,0,1)]"
                  placeholder="http://localhost:1234/v1"
                  value={settings.apiUrl}
                  onChange={(e) => onChange({ ...settings, apiUrl: e.target.value })}
                />
                
                <Button
                  id="test-conn-btn"
                  size="sm"
                  variant="outline"
                  className="font-mono text-xs bg-[#7D5A94] text-white border-2 border-black hover:bg-[#6c4c81] cursor-pointer rounded-none shadow-[2px_2px_0_0_rgba(0,0,0,1)] active:translate-y-0.5"
                  onClick={testConnection}
                  disabled={testStatus === 'testing'}
                >
                  {testStatus === 'testing' ? 'Testing...' : 'Test'}
                </Button>
              </div>
            </div>

            {/* API CONNECTION STATUS FEEDBACK */}
            {testStatus !== 'idle' && (
              <div className={`p-3 border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] ${
                testStatus === 'connected' ? 'bg-[#B2FFD6] text-black' :
                testStatus === 'failed' ? 'bg-red-50 text-red-800' : 'bg-gray-50'
              } text-[11px]`}>
                <div className="flex items-center gap-1.5 font-mono font-black uppercase tracking-wider mb-1">
                  {testStatus === 'connected' ? (
                    <>
                      <Wifi className="w-3.5 h-3.5 text-black animate-pulse" />
                      CONNECTED SUCCESSFULLY!
                    </>
                  ) : testStatus === 'failed' ? (
                    <>
                      <WifiOff className="w-3.5 h-3.5 text-red-600" />
                      CONNECTION TIMEOUT
                    </>
                  ) : (
                    <>
                      <span className="w-2.5 h-2.5 bg-black animate-ping inline-block" />
                      PINGING LM STUDIO...
                    </>
                  )}
                </div>
                {testStatus === 'connected' && (
                  <p className="font-mono text-[10px]">
                    Loaded Model: <span className="font-bold underline">{detectedModel || settings.model}</span>
                  </p>
                )}
                {testStatus === 'failed' && (
                  <p className="font-mono text-[9px] leading-relaxed text-red-600">
                    {errorMessage}
                  </p>
                )}
              </div>
            )}

            {/* Model Name */}
            <div className="grid grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <Label htmlFor="model-name" className="text-xs font-black font-mono text-black uppercase">Model Identifier</Label>
                <Input
                  id="model-name"
                  type="text"
                  className="font-mono text-xs bg-white text-black border-2 border-black rounded-none shadow-[2px_2px_0_0_rgba(0,0,0,1)]"
                  placeholder="gemma"
                  value={settings.model}
                  onChange={(e) => onChange({ ...settings, model: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="temp-slider" className="text-xs font-black font-mono text-black uppercase flex justify-between">
                  <span>Temp</span>
                  <span className="font-mono text-[11px] text-[#FF80BF] font-black">{settings.temperature}</span>
                </Label>
                <input
                  id="temp-slider"
                  type="range"
                  min="0.0"
                  max="1.2"
                  step="0.1"
                  className="w-full accent-[#FF80BF] mt-1.5 h-2 bg-slate-200 border-2 border-black rounded-none appearance-none cursor-pointer"
                  value={settings.temperature}
                  onChange={(e) => onChange({ ...settings, temperature: parseFloat(e.target.value) })}
                />
              </div>
            </div>

            {/* Instructions box */}
            <div className="p-3 bg-white border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] text-[10px] text-black leading-relaxed shrink-0">
              <div className="flex items-center gap-1 font-black text-black font-mono mb-1 uppercase text-[10px]">
                <Info className="w-3.5 h-3.5 text-[#FF80BF] shrink-0" />
                How to play with LM Studio:
              </div>
              <ol className="list-decimal list-inside space-y-1 mt-1 font-mono">
                <li>Launch <span className="font-bold underline text-black">LM Studio</span> on your desktop.</li>
                <li>Search & download a Gemma model (e.g. <span className="font-bold">Gemma 2 2B</span>).</li>
                <li>Go to the <span className="font-bold">Developer Tab</span> (plug icon 🔌) in LM Studio.</li>
                <li>Launch the local server. Make sure CORS is enabled!</li>
                <li>Press <span className="font-black">"Test"</span> above to sync with our cute pixel board!</li>
              </ol>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-white border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] text-xs text-black leading-relaxed font-mono">
            <div className="flex items-center gap-1.5 font-black uppercase tracking-wider mb-2 text-[#FF80BF] drop-shadow-[1px_1px_0_rgba(0,0,0,1)]">
              <Cpu className="w-4 h-4 text-[#FF80BF] animate-pulse" />
              Offline 8-bit AI Engine Active
            </div>
            Your play experience is fully configured locally! The AI moves are solved on-device using our high-speed minimax alpha-beta lookahead routines. No local server required! Turn on the toggle when you are ready to unleash Gemma.
          </div>
        )}

        {/* Dynamic Sounds Toggle */}
        <div className="flex items-center justify-between pt-2 border-t-2 border-black">
          <span className="text-xs font-black leading-none text-black flex items-center gap-1.5 font-mono uppercase">
            {soundEnabled ? (
              <Volume2 className="w-3.5 h-3.5 text-[#FF80BF] shrink-0" />
            ) : (
              <VolumeX className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            )}
            Chiptune Sound FX
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-black font-bold uppercase">{soundEnabled ? "Enabled" : "Muted"}</span>
            <Switch
              id="sound-toggle-switch"
              checked={soundEnabled}
              onCheckedChange={handleSoundToggle}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
