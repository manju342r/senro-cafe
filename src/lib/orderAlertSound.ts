/** Staff-side loud alarm when a new customer order lands in the live queue. */

let audioCtx: AudioContext | null = null
let unlocked = false

function getCtx(): AudioContext {
  if (!audioCtx) {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
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

function blare(
  ctx: AudioContext,
  frequency: number,
  start: number,
  duration: number,
  gain: number,
  type: OscillatorType = 'square',
) {
  const osc = ctx.createOscillator()
  const amp = ctx.createGain()
  // Soft clip / limit a bit so multiple layers stay loud without harsh DC
  const limiter = ctx.createDynamicsCompressor()
  limiter.threshold.setValueAtTime(-8, start)
  limiter.knee.setValueAtTime(4, start)
  limiter.ratio.setValueAtTime(12, start)
  limiter.attack.setValueAtTime(0.003, start)
  limiter.release.setValueAtTime(0.08, start)

  osc.type = type
  osc.frequency.setValueAtTime(frequency, start)
  amp.gain.setValueAtTime(0.0001, start)
  amp.gain.exponentialRampToValueAtTime(Math.max(0.001, gain), start + 0.012)
  amp.gain.setValueAtTime(gain, start + duration * 0.75)
  amp.gain.exponentialRampToValueAtTime(0.0001, start + duration)

  osc.connect(amp)
  amp.connect(limiter)
  limiter.connect(ctx.destination)
  osc.start(start)
  osc.stop(start + duration + 0.03)
}

/**
 * Loud repeating alarm siren for new orders (kitchen-attention volume).
 * Three urgent two-tone blasts.
 */
export async function playNewOrderRing(): Promise<void> {
  try {
    const ctx = getCtx()
    if (ctx.state === 'suspended') await ctx.resume()
    unlocked = ctx.state === 'running'
    const t0 = ctx.currentTime + 0.02

    // Three alarm cycles — high/low square blasts, very loud
    for (let i = 0; i < 3; i++) {
      const base = t0 + i * 0.85
      // High siren tone
      blare(ctx, 980, base, 0.28, 0.72, 'square')
      blare(ctx, 980 * 2, base, 0.28, 0.35, 'sawtooth')
      // Low answer tone
      blare(ctx, 620, base + 0.32, 0.28, 0.75, 'square')
      blare(ctx, 620 * 2, base + 0.32, 0.28, 0.32, 'sawtooth')
    }
  } catch {
    /* autoplay / audio policy — ignore */
  }
}
