/**
 * GALACTIC MESSENGER - AUDIO ENGINE
 * Synthesizes a deep space ambient hum and transmission pings.
 */

const SpaceAudio = {
    ctx: null,
    oscillator: null,
    gain: null,

    init() {
        if (this.ctx) return;
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        
        this.oscillator = this.ctx.createOscillator();
        this.gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        // High-Vibe Space Shimmer
        this.oscillator.type = 'sawtooth'; 
        this.oscillator.frequency.setValueAtTime(110, this.ctx.currentTime); 

        filter.type = "lowpass";
        filter.frequency.value = 400;

        // Correct connection chain: Osc -> Filter -> Gain -> Speakers
        this.oscillator.connect(filter);
        filter.connect(this.gain);
        this.gain.connect(this.ctx.destination);
        
        this.gain.gain.setValueAtTime(0, this.ctx.currentTime);
        this.gain.gain.linearRampToValueAtTime(0.03, this.ctx.currentTime + 2); // Subtle volume
        
        this.oscillator.start();
        console.log("Observatory audio initialized.");
    },

    playSuccess() {
        if (!this.ctx) return;
        const ping = this.ctx.createOscillator();
        const pingGain = this.ctx.createGain();
        
        ping.type = 'triangle';
        ping.frequency.setValueAtTime(880, this.ctx.currentTime);
        ping.frequency.exponentialRampToValueAtTime(440, this.ctx.currentTime + 0.5);
        
        pingGain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        pingGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);
        
        ping.connect(pingGain);
        pingGain.connect(this.ctx.destination);
        ping.start();
        ping.stop(this.ctx.currentTime + 0.5);
    }
};

window.addEventListener('click', () => SpaceAudio.init(), { once: true });