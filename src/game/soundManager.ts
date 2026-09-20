import { createFriendSoundKit, FriendSoundCue, FriendSoundKit } from '@rarefriends/friendsdk/sounds';

class SoundController {
  private kit: FriendSoundKit | null = null;
  private muted: boolean = false;
  private initialized: boolean = false;

  public init(initialMuted = false): void {
    if (this.initialized && this.kit) return;
    try {
      this.muted = initialMuted;
      this.kit = createFriendSoundKit({ muted: initialMuted, volume: 0.8 });
      this.initialized = true;
    } catch {
      // Audio context might fail in non-browser environments
    }
  }

  public async unlock(): Promise<boolean> {
    if (!this.kit) {
      this.init(this.muted);
    }
    if (!this.kit) return false;
    try {
      return await this.kit.unlock();
    } catch {
      return false;
    }
  }

  public play(cue: FriendSoundCue): void {
    if (!this.kit || this.muted) return;
    try {
      this.kit.play(cue);
    } catch {
      // Ignore audio failure
    }
  }

  public playHoHoHo(): void {
    if (this.muted) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      // 3 descending jolly chuckles: "HO! HO! HO!"
      const pitches = [180, 160, 140];
      pitches.forEach((freq, idx) => {
        const startTime = now + idx * 0.26;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.85, startTime + 0.18);

        gain.gain.setValueAtTime(0.001, startTime);
        gain.gain.linearRampToValueAtTime(0.25, startTime + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.22);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + 0.23);
      });
    } catch {
      // Fallback
      this.play('reward');
    }
  }

  public playJingleBells(): void {
    if (this.muted) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      // Jingle Bells tune opening: E5, E5, E5, E5, E5, E5, E5, G5, C5, D5, E5
      const notes = [
        { f: 659.25, d: 0.15 }, // E5
        { f: 659.25, d: 0.15 }, // E5
        { f: 659.25, d: 0.3 },  // E5
        { f: 659.25, d: 0.15 }, // E5
        { f: 659.25, d: 0.15 }, // E5
        { f: 659.25, d: 0.3 },  // E5
        { f: 659.25, d: 0.15 }, // E5
        { f: 783.99, d: 0.15 }, // G5
        { f: 523.25, d: 0.2 },  // C5
        { f: 587.33, d: 0.15 }, // D5
        { f: 659.25, d: 0.45 }, // E5
      ];

      let t = now;
      notes.forEach(({ f, d }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, t);

        // Bell chime overtone
        const overtone = ctx.createOscillator();
        const overGain = ctx.createGain();
        overtone.type = 'triangle';
        overtone.frequency.setValueAtTime(f * 2, t);

        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + d * 0.9);

        overGain.gain.setValueAtTime(0.08, t);
        overGain.gain.exponentialRampToValueAtTime(0.001, t + d * 0.6);

        osc.connect(gain);
        gain.connect(ctx.destination);
        overtone.connect(overGain);
        overGain.connect(ctx.destination);

        osc.start(t);
        osc.stop(t + d);
        overtone.start(t);
        overtone.stop(t + d);

        t += d * 1.05;
      });
    } catch {
      this.play('reveal-legendary');
    }
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.kit) {
      this.kit.setMuted(muted);
      if (!muted) {
        void this.unlock();
      }
    }
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public dispose(): void {
    if (this.kit) {
      this.kit.dispose();
      this.kit = null;
    }
    this.initialized = false;
  }
}

export const soundManager = new SoundController();
