class SoundEffects {
    private audioCtx: AudioContext | null = null;

    private init() {
        if (!this.audioCtx) {
            this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
    }

    public playNotification() {
        try {
            this.init();
            if (!this.audioCtx) return;

            const t = this.audioCtx.currentTime;
            
            // Oscillator for the beep
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();

            osc.type = "sine";
            // A short, pleasant high-pitched double beep
            osc.frequency.setValueAtTime(800, t);
            osc.frequency.exponentialRampToValueAtTime(1200, t + 0.1);
            
            // Envelope
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(0.3, t + 0.05); // Volume
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);

            osc.connect(gain);
            gain.connect(this.audioCtx.destination);

            osc.start(t);
            osc.stop(t + 0.2);
            
            // Second beep
            const osc2 = this.audioCtx.createOscillator();
            const gain2 = this.audioCtx.createGain();
            
            osc2.type = "sine";
            osc2.frequency.setValueAtTime(1200, t + 0.2);
            osc2.frequency.exponentialRampToValueAtTime(1600, t + 0.3);
            
            gain2.gain.setValueAtTime(0, t + 0.2);
            gain2.gain.linearRampToValueAtTime(0.3, t + 0.25);
            gain2.gain.exponentialRampToValueAtTime(0.01, t + 0.4);
            
            osc2.connect(gain2);
            gain2.connect(this.audioCtx.destination);
            
            osc2.start(t + 0.2);
            osc2.stop(t + 0.4);

        } catch (e) {
            console.error("Audio playback failed", e);
        }
    }
}

export const sounds = new SoundEffects();
