/**
 * Procedural "chiptune" background loop played while answering a quiz/exam.
 * Synthesized with the Web Audio API (same approach as feedbackSound.ts) so
 * no audio file needs to be shipped or downloaded.
 */

const TEMPO_BPM = 132;
const STEP_SEC = 60 / TEMPO_BPM / 2; // 8th notes
const ROOT_FREQ = 220; // A3
// Two-bar arpeggio, semitone offsets from the root.
const PATTERN = [0, 4, 7, 12, 7, 4, 0, 4, 3, 7, 10, 12, 10, 7, 3, 7];

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let schedulerTimer: ReturnType<typeof setInterval> | null = null;
let nextStepTime = 0;
let stepIndex = 0;
let playing = false;

function getCtx(): AudioContext {
  if (!ctx) {
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new Ctx();
    masterGain = ctx.createGain();
    masterGain.gain.value = 0.05;
    masterGain.connect(ctx.destination);
  }
  return ctx;
}

function scheduleStep(c: AudioContext, gainOut: GainNode, time: number) {
  const semis = PATTERN[stepIndex % PATTERN.length];
  const freq = ROOT_FREQ * Math.pow(2, semis / 12);

  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = 'square';
  osc.frequency.value = freq;
  osc.connect(gain);
  gain.connect(gainOut);
  gain.gain.setValueAtTime(0, time);
  gain.gain.linearRampToValueAtTime(0.7, time + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.001, time + STEP_SEC * 0.9);
  osc.start(time);
  osc.stop(time + STEP_SEC);

  // Soft bass pulse on the downbeat of every bar-quarter.
  if (stepIndex % 4 === 0) {
    const bass = c.createOscillator();
    const bassGain = c.createGain();
    bass.type = 'triangle';
    bass.frequency.value = ROOT_FREQ / 2;
    bass.connect(bassGain);
    bassGain.connect(gainOut);
    bassGain.gain.setValueAtTime(0, time);
    bassGain.gain.linearRampToValueAtTime(0.5, time + 0.01);
    bassGain.gain.exponentialRampToValueAtTime(0.001, time + STEP_SEC * 3.6);
    bass.start(time);
    bass.stop(time + STEP_SEC * 4);
  }

  stepIndex++;
}

function scheduler() {
  if (!ctx || !masterGain) return;
  while (nextStepTime < ctx.currentTime + 0.1) {
    scheduleStep(ctx, masterGain, nextStepTime);
    nextStepTime += STEP_SEC;
  }
}

/** Starts the loop (or resumes it if it was only suspended by the browser). */
export function startBackgroundMusic() {
  try {
    const c = getCtx();
    if (c.state === 'suspended') c.resume();
    if (playing) return;
    playing = true;
    stepIndex = 0;
    nextStepTime = c.currentTime + 0.05;
    schedulerTimer = setInterval(scheduler, 50);
  } catch {}
}

export function stopBackgroundMusic() {
  playing = false;
  if (schedulerTimer) {
    clearInterval(schedulerTimer);
    schedulerTimer = null;
  }
}

export function isBackgroundMusicPlaying() {
  return playing;
}
