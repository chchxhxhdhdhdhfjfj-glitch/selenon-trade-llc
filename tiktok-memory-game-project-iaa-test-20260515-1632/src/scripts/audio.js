export function beep(state, type = 'flip') {
  if (!state.soundOn) return;
  try {
    const ctx = window.__ac || (window.__ac = new (window.AudioContext || window.webkitAudioContext)());
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    const map = { flip: 430, ok: 720, bad: 170, win: 920, reward: 660, hint: 520 };
    osc.frequency.value = map[type] || 440;
    gain.gain.setValueAtTime(.07, t);
    gain.gain.exponentialRampToValueAtTime(.001, t + (type === 'win' ? .30 : .16));
    osc.start(t);
    osc.stop(t + (type === 'win' ? .30 : .16));
  } catch (e) {}
}
