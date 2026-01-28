// Web Audio API procedural sound generation
// Keeping with the "No Assets" theme, we synthesize sounds on the fly.

let audioCtx: AudioContext | null = null;

const getCtx = () => {
  if (!audioCtx) {
    // Create AudioContext on demand (must be after user interaction to unlock audio)
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
};

export const playSound = (type: 'bang' | 'click' | 'open' | 'reload') => {
  try {
    const ctx = getCtx();
    if (ctx.state === 'suspended') ctx.resume();
    const t = ctx.currentTime;

    if (type === 'bang') {
      // 1. The Kick (Low frequency punch)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.frequency.setValueAtTime(150, t);
      osc.frequency.exponentialRampToValueAtTime(40, t + 0.15);
      
      gain.gain.setValueAtTime(0.7, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);

      osc.start(t);
      osc.stop(t + 0.3);

      // 2. The Blast (Noise)
      const bufferSize = ctx.sampleRate * 0.5; // 0.5 sec noise
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.8;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      // Lowpass filter to muffle the harsh white noise into a "boom"
      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'lowpass';
      noiseFilter.frequency.setValueAtTime(1200, t);
      noiseFilter.frequency.exponentialRampToValueAtTime(100, t + 0.3);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(1.0, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);

      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noise.start(t);
    }

    if (type === 'click') {
       // Mechanical Click - High pitch short burst
       const osc = ctx.createOscillator();
       const gain = ctx.createGain();
       osc.type = 'triangle';
       osc.connect(gain);
       gain.connect(ctx.destination);

       osc.frequency.setValueAtTime(1200, t);
       osc.frequency.exponentialRampToValueAtTime(600, t + 0.02);
       
       gain.gain.setValueAtTime(0.3, t);
       gain.gain.exponentialRampToValueAtTime(0.01, t + 0.02);
       
       osc.start(t);
       osc.stop(t + 0.03);
    }

    if (type === 'open') {
        // Sliding sound - Bandpass filtered noise
        const bufferSize = ctx.sampleRate * 0.3;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.Q.value = 2;
        filter.frequency.setValueAtTime(400, t);
        filter.frequency.linearRampToValueAtTime(800, t + 0.2);
        
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.05, t);
        gain.gain.linearRampToValueAtTime(0.15, t + 0.1);
        gain.gain.linearRampToValueAtTime(0, t + 0.3);
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        noise.start(t);
    }

    if (type === 'reload') {
        // Metallic Clink (simulating bullet dropping in)
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square'; // harsher metallic tone
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.frequency.setValueAtTime(1200, t);
        osc.frequency.exponentialRampToValueAtTime(800, t + 0.08);
        
        gain.gain.setValueAtTime(0.1, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);
        
        osc.start(t);
        osc.stop(t + 0.1);
    }
  } catch (e) {
    console.error("Audio playback error", e);
  }
};
