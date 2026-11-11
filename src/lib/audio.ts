class ErootAudioEngine {
  private ctx: AudioContext | null = null;
  private lobbyTimer: number | null = null;
  private step = 0;
  private volume = 0.4;
  private muted = false;

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;
    if (!this.ctx) {
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  setVolume(volume: number): void {
    this.volume = Math.min(1, Math.max(0, volume));
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (muted) {
      this.stopLobbyMusic();
    }
  }

  private playTone(freq: number, durationSec: number, type: OscillatorType = 'sine', gainMult = 1) {
    if (this.muted || this.volume <= 0) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);

    const peak = 0.08 * this.volume * gainMult;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + durationSec + 0.03);
  }

  startLobbyMusic(preset: string): void {
    if (this.muted || preset === 'silent' || this.lobbyTimer !== null) return;
    const notes =
      preset === 'arcade-focus'
        ? [261.63, 329.63, 392.0, 523.25]
        : preset === 'bright-synth'
          ? [293.66, 369.99, 440.0, 587.33]
          : [220.0, 277.18, 329.63, 440.0];

    this.lobbyTimer = window.setInterval(() => {
      const freq = notes[this.step % notes.length] ?? 261.63;
      this.step += 1;
      this.playTone(freq, 0.35, 'triangle', 0.6);
    }, 550);
  }

  stopLobbyMusic(): void {
    if (this.lobbyTimer !== null) {
      window.clearInterval(this.lobbyTimer);
      this.lobbyTimer = null;
    }
  }

  playRevealChime(): void {
    this.playTone(523.25, 0.18, 'sine', 1);
    window.setTimeout(() => this.playTone(659.25, 0.25, 'sine', 1), 110);
  }

  playPodiumFanfare(): void {
    [392.0, 523.25, 659.25, 783.99].forEach((freq, idx) => {
      window.setTimeout(() => this.playTone(freq, 0.28, 'triangle', 1.1), idx * 140);
    });
  }
}

export const erootAudio = new ErootAudioEngine();

