/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Simple, cutesy 8-bit retro sound synthesizers via Web Audio API.
class RetroAudioEngine {
  private ctx: AudioContext | null = null;
  private enabled: boolean = true;

  toggleSound(enabled: boolean) {
    this.enabled = enabled;
  }

  isEnabled() {
    return this.enabled;
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        this.ctx = new AudioCtxClass();
      }
    }
    // Resume context if suspended (common in browsers until user gesture)
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  playMove() {
    if (!this.enabled) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square'; // Classic NES chiptune square wave
    osc.frequency.setValueAtTime(329.63, ctx.currentTime); // E4
    osc.frequency.setValueAtTime(523.25, ctx.currentTime + 0.08); // C5 (pleasant cute jump)

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  }

  playCapture() {
    if (!this.enabled) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle'; // Smoother triangle wave + slight vibrato/noise
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(196.00, ctx.currentTime + 0.2); // G3 descending crunch

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  }

  playCheck() {
    if (!this.enabled) return;
    const ctx = this.initContext();
    if (!ctx) return;

    // Pulse warning notes
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();

    osc1.type = 'sawtooth'; // Slightly buzzy retro warning
    osc1.frequency.setValueAtTime(220.00, ctx.currentTime); // A3
    osc1.frequency.setValueAtTime(196.00, ctx.currentTime + 0.1); 

    gain1.gain.setValueAtTime(0.07, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);

    osc1.start();
    osc1.stop(ctx.currentTime + 0.3);
  }

  playWin() {
    if (!this.enabled) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 1046.50]; // C Major arpeggio fan-fare
    const duration = 0.12;

    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + (index * 0.08));

      gain.gain.setValueAtTime(0.05, ctx.currentTime + (index * 0.08));
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (index * 0.08) + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + (index * 0.08));
      osc.stop(ctx.currentTime + (index * 0.08) + duration);
    });
  }

  playLose() {
    if (!this.enabled) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const notes = [311.13, 293.66, 277.18, 220.00]; // Sad descending minor notes
    const duration = 0.22;

    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + (index * 0.18));

      gain.gain.setValueAtTime(0.07, ctx.currentTime + (index * 0.18));
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (index * 0.18) + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + (index * 0.18));
      osc.stop(ctx.currentTime + (index * 0.18) + duration);
    });
  }
}

export const customAudioEngine = new RetroAudioEngine();
