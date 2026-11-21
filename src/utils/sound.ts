class SoundEngine {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;

  private getContext(): AudioContext | null {
    if (this.muted || typeof window === 'undefined') return null;
    if (!this.ctx) {
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
    this.muted = muted;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  private playTone(
    freq: number,
    duration: number,
    type: OscillatorType = 'sine',
    volume: number = 0.12,
    delay: number = 0,
    endFreq?: number
  ) {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (endFreq !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(endFreq, now + duration);
    }

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  public playClick() {
    this.playTone(520, 0.06, 'triangle', 0.08);
  }

  public playSnap() {
    this.playTone(340, 0.08, 'triangle', 0.11, 0, 520);
  }

  public playSplit() {
    this.playTone(480, 0.16, 'sine', 0.09, 0, 320);
    this.playTone(640, 0.14, 'triangle', 0.07, 0.06, 440);
  }

  public playCorrect() {
    this.playTone(523.25, 0.11, 'triangle', 0.12, 0);
    this.playTone(659.25, 0.16, 'triangle', 0.12, 0.08);
  }

  public playWrong() {
    this.playTone(220, 0.16, 'sine', 0.1, 0, 175);
  }

  public playVictory() {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((n, idx) => {
      this.playTone(n, 0.22, 'triangle', 0.12, idx * 0.09);
    });
  }

  public playAchievement() {
    const notes = [659.25, 783.99, 987.77, 1318.51];
    notes.forEach((n, idx) => {
      this.playTone(n, 0.18, 'sine', 0.11, idx * 0.07);
    });
  }
}

export const soundEngine = new SoundEngine();
