// High-performance Web Audio API Sound Engine (No external audio files required)

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  private getContext(): AudioContext | null {
    if (this.isMuted) return null;
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  // Metallic sparkling ruby coin clink
  public playCoinPass() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const freqs = [1318.5, 1975.5, 2637.0]; // E6, B6, E7 crystal chime
    freqs.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + idx * 0.035);

      gain.gain.setValueAtTime(0.16, now + idx * 0.035);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.035 + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.035);
      osc.stop(now + idx * 0.035 + 0.26);
    });
  }

  // Satisfying card take + multiple coin cascade
  public playCardTake(coinCount: number = 0) {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    // Deep thud / snap for card
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(240, now);
    osc.frequency.exponentialRampToValueAtTime(75, now + 0.14);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.16);

    // Bonus coin cascade if coins were stacked
    const cascades = Math.min(coinCount, 6);
    for (let i = 0; i < cascades; i++) {
      const cOsc = ctx.createOscillator();
      const cGain = ctx.createGain();
      cOsc.type = 'sine';
      cOsc.frequency.setValueAtTime(1400 + i * 180, now + 0.06 + i * 0.04);

      cGain.gain.setValueAtTime(0.12, now + 0.06 + i * 0.04);
      cGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06 + i * 0.04 + 0.18);

      cOsc.connect(cGain);
      cGain.connect(ctx.destination);
      cOsc.start(now + 0.06 + i * 0.04);
      cOsc.stop(now + 0.06 + i * 0.04 + 0.19);
    }
  }

  // Dice rolling rattle + landing chime
  public playDiceRoll() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    for (let i = 0; i < 6; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(300 + Math.random() * 450, now + i * 0.055);

      gain.gain.setValueAtTime(0.08, now + i * 0.055);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.055 + 0.045);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.055);
      osc.stop(now + i * 0.055 + 0.05);
    }
  }

  // Alert when it becomes MY turn
  public playMyTurnAlert() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
    notes.forEach((n, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(n, now + i * 0.07);

      gain.gain.setValueAtTime(0.18, now + i * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.07);
      osc.stop(now + i * 0.07 + 0.26);
    });
  }

  // Fun expressive sound for emojis
  public playEmojiPop(emojiType: string) {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (emojiType === '😱' || emojiType === '😭') {
      // Descending dramatic slide
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(620, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.32);
    } else if (emojiType === '😍' || emojiType === '😎') {
      // Bouncy upward pop
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(920, now + 0.22);
    } else {
      // Quirky boing
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(350, now);
      osc.frequency.linearRampToValueAtTime(700, now + 0.12);
      osc.frequency.linearRampToValueAtTime(480, now + 0.25);
    }

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.33);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.35);
  }

  // Grand fanfare on game finish
  public playVictoryFanfare() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const chord = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    chord.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      const start = now + idx * 0.11;
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.22, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.65);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.66);
    });
  }
}

export const soundEngine = new SoundEngine();
