/**
 * Procedural Web Audio API Sound Design Engine
 * Disabled by default as required by the specification.
 * Generates subtle, low-amplitude architectural ticks and harmonic resonances when enabled by the user.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private enabled = false;

  public isEnabled(): boolean {
    return this.enabled;
  }

  public setEnabled(next: boolean): boolean {
    this.enabled = next;
    if (this.enabled && !this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.enabled && this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    if (this.enabled) {
      this.playTick(520, 0.035);
    }
    return this.enabled;
  }

  public playTick(freq = 440, duration = 0.025): void {
    if (!this.enabled || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.65, now + duration);

      gain.gain.setValueAtTime(0.025, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + duration);
    } catch {
      // Ignore audio errors if blocked by browser autoplay policy
    }
  }

  public playPortalOpen(): void {
    if (!this.enabled || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(360, now + 0.14);

      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.15);
    } catch {
      // Ignore
    }
  }
}

export const soundEngine = new SoundEngine();
