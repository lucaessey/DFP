export class Sound {
  constructor() { this.context = null; }
  unlock() { try { this.context ||= new (window.AudioContext || window.webkitAudioContext)(); this.context.resume(); } catch { /* Sound is optional. */ } }
  play(kind, enabled) {
    if (!enabled || !this.context || this.context.state !== 'running') return;
    if(kind==='pickup'&&this.context.currentTime-(this.lastPickup||0)<.18)return;
    if(kind==='pickup')this.lastPickup=this.context.currentTime;
    const notes = kind === 'money' ? [523, 659, 784] : kind === 'purchase' ? [392, 523, 659] : kind==='pickup' ? [650] : [420];
    notes.forEach((frequency, i) => { const t = this.context.currentTime + i * 0.075, o = this.context.createOscillator(), g = this.context.createGain(); o.type = 'sine'; o.frequency.value = frequency; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.045, t + 0.015); g.gain.exponentialRampToValueAtTime(0.001, t + 0.16); o.connect(g); g.connect(this.context.destination); o.start(t); o.stop(t + 0.18); });
  }
}
