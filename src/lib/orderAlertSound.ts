/** Staff-side ring when a new customer order lands in the live queue. */

let audioCtx: AudioContext | null = null
let unlocked = false

function getCtx(): AudioContext {
  if (!audioCtx) {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    audioCtx = new Ctx()
  }
  return audioCtx
}

/** Call from a user gesture so the browser allows later alert playback. */
export async function unlockOrderAlertSound(): Promise<void> {
  try {
    const ctx = getCtx()
    if (ctx.state === 'suspended') await ctx.resume()
    unlocked = true
  } catch {
    unlocked = false
  }
}

export function isOrderAlertSoundUnlocked(): boolean {
  return unlocked && audioCtx?.state === 'running'
}

function tone(
  ctx: AudioContext,
  frequency: number,
  start: number,
  duration: number,
  gain = 0.18,
) {
  const osc = ctx.createOscillator()
  const amp = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(frequency, start)
  amp.gain.setValueAtTime(0.0001, start)
  amp.gain.exponentialRampToValueAtTime(gain, start + 0.02)
  amp.gain.exponentialRampToValueAtTime(0.0001, start + duration)
  osc.connect(amp)
  amp.connect(ctx.destination)
  osc.start(start)
  osc.stop(start + duration + 0.02)
}

/** Short double-ring (phone-like) chime for a new order. */
export async function playNewOrderRing(): Promise<void> {
  try {
    const ctx = getCtx()
    if (ctx.state === 'suspended') await ctx.resume()
    unlocked = ctx.state === 'running'
    const t0 = ctx.currentTime + 0.02
    // First ring
    tone(ctx, 880, t0, 0.22, 0.2)
    tone(ctx, 1174.7, t0 + 0.05, 0.2, 0.14)
    // Second ring
    tone(ctx, 880, t0 + 0.45, 0.22, 0.2)
    tone(ctx, 1174.7, t0 + 0.5, 0.2, 0.14)
  } catch {
    /* autoplay / audio policy — ignore */
  }
}
