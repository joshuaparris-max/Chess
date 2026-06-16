type SoundName = 'pawn' | 'piece' | 'capture' | 'check' | 'checkmate' | 'fairyQueen';

let audioContext: AudioContext | null = null;
let enabled = true;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtor) return null;
  if (!audioContext) audioContext = new AudioCtor();
  if (audioContext.state === 'suspended') void audioContext.resume();
  return audioContext;
}

function playTone(
  ctx: AudioContext,
  {
    type,
    frequency,
    durationMs,
    gain,
    startOffsetMs = 0,
    endFrequency,
  }: {
    type: OscillatorType;
    frequency: number;
    durationMs: number;
    gain: number;
    startOffsetMs?: number;
    endFrequency?: number;
  },
) {
  const start = ctx.currentTime + startOffsetMs / 1000;
  const end = start + durationMs / 1000;
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  if (endFrequency) oscillator.frequency.exponentialRampToValueAtTime(endFrequency, end);

  gainNode.gain.setValueAtTime(0.0001, start);
  gainNode.gain.exponentialRampToValueAtTime(gain, start + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, end);

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);
  oscillator.start(start);
  oscillator.stop(end + 0.02);
}

export function initAudio() {
  return getAudioContext();
}

export function setChessSoundsEnabled(value: boolean) {
  enabled = value;
}

function play(name: SoundName) {
  if (!enabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  if (name === 'pawn') playTone(ctx, { type: 'sine', frequency: 300, durationMs: 80, gain: 0.3 });
  if (name === 'piece') playTone(ctx, { type: 'triangle', frequency: 520, durationMs: 150, gain: 0.25 });
  if (name === 'capture') playTone(ctx, { type: 'sine', frequency: 400, endFrequency: 800, durationMs: 200, gain: 0.35 });
  if (name === 'check') playTone(ctx, { type: 'square', frequency: 220, durationMs: 300, gain: 0.2 });
  if (name === 'checkmate') {
    [400, 500, 600].forEach((frequency, index) => {
      playTone(ctx, { type: 'sine', frequency, durationMs: 150, gain: 0.4, startOffsetMs: index * 160 });
    });
  }
  if (name === 'fairyQueen') playTone(ctx, { type: 'sine', frequency: 760, endFrequency: 1180, durationMs: 180, gain: 0.18 });
}

export function playPawnMove() {
  play('pawn');
}

export function playPieceMove() {
  play('piece');
}

export function playCapture() {
  play('capture');
}

export function playCheck() {
  play('check');
}

export function playCheckmate() {
  play('checkmate');
}

export function playFairyQueenLayer() {
  play('fairyQueen');
}

