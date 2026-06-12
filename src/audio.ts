export class AlarmSynth {
  private ctx: AudioContext | null = null;
  private intervalId: number | null = null;
  private currentLevel: 'normal' | 'attention' | 'danger' = 'normal';
  private enabled: boolean = false;

  public init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (enabled) {
      this.init();
      this.applyLevel();
    } else {
      this.stop();
    }
  }

  public setLevel(level: 'normal' | 'attention' | 'danger') {
    if (this.currentLevel === level) return;
    this.currentLevel = level;
    if (this.enabled) {
      this.applyLevel();
    }
  }

  private playSequence(notes: {freq: number, type: OscillatorType, duration: number, delay: number}[], vol: number = 0.1) {
    if (!this.ctx || !this.enabled) return;
    try {
      const now = this.ctx.currentTime;
      notes.forEach(note => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.frequency.value = note.freq;
        osc.type = note.type;
        
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        
        gain.gain.setValueAtTime(vol, now + note.delay);
        gain.gain.exponentialRampToValueAtTime(0.001, now + note.delay + note.duration);
        
        osc.start(now + note.delay);
        osc.stop(now + note.delay + note.duration);
      });
    } catch(e) {
      console.error('Audio playback failed', e);
    }
  }

  private applyLevel() {
    this.stop();
    if (this.currentLevel === 'danger') {
      this.playSequence([
        { freq: 800, type: 'square', duration: 0.15, delay: 0 },
        { freq: 800, type: 'square', duration: 0.3, delay: 0.2 },
      ], 0.15); // play immediately
      this.intervalId = window.setInterval(() => {
        this.playSequence([
          { freq: 800, type: 'square', duration: 0.15, delay: 0 },
          { freq: 800, type: 'square', duration: 0.3, delay: 0.2 },
        ], 0.15);
      }, 1000);
    } else if (this.currentLevel === 'attention') {
      this.playSequence([
        { freq: 400, type: 'triangle', duration: 0.4, delay: 0 }
      ], 0.05); // play immediately
      this.intervalId = window.setInterval(() => {
        this.playSequence([
          { freq: 400, type: 'triangle', duration: 0.4, delay: 0 }
        ], 0.05);
      }, 2000);
    }
  }

  private stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}
