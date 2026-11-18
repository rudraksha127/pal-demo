// ── Tactical Audio Synthesizer (Web Audio API) ────────────────────
// Zero-asset procedural audio generation for Aftershock telemetry & UI

class TacticalAudioEngine {
  private ctx: AudioContext | null = null
  private muted: boolean = false
  private volume: number = 0.4

  constructor() {
    if (typeof window !== 'undefined') {
      const storedMute = window.localStorage.getItem('aftershock:audio:muted')
      this.muted = storedMute === 'true'
    }
  }

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (AudioCtx) {
        this.ctx = new AudioCtx()
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      void this.ctx.resume()
    }
  }

  public isMuted(): boolean {
    return this.muted
  }

  public setMuted(muted: boolean) {
    this.muted = muted
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('aftershock:audio:muted', String(muted))
    }
    if (!muted) {
      this.initContext()
      this.playClick()
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.muted)
    return this.muted
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol))
  }

  // Tactical subtle UI click
  public playClick() {
    if (this.muted) return
    this.initContext()
    if (!this.ctx) return

    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    const now = this.ctx.currentTime

    osc.type = 'sine'
    osc.frequency.setValueAtTime(1400, now)
    osc.frequency.exponentialRampToValueAtTime(700, now + 0.04)

    gain.gain.setValueAtTime(this.volume * 0.15, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04)

    osc.connect(gain)
    gain.connect(this.ctx.destination)

    osc.start(now)
    osc.stop(now + 0.04)
  }

  // Radar doppler sweep ping (high-tech frequency modulation)
  public playRadarPing() {
    if (this.muted) return
    this.initContext()
    if (!this.ctx) return

    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    const filter = this.ctx.createBiquadFilter()
    const now = this.ctx.currentTime

    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(1800, now)
    osc.frequency.exponentialRampToValueAtTime(3200, now + 0.08)
    osc.frequency.exponentialRampToValueAtTime(900, now + 0.22)

    filter.type = 'bandpass'
    filter.frequency.setValueAtTime(2200, now)
    filter.Q.value = 4

    gain.gain.setValueAtTime(this.volume * 0.18, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22)

    osc.connect(filter)
    filter.connect(gain)
    gain.connect(this.ctx.destination)

    osc.start(now)
    osc.stop(now + 0.22)
  }

  // Victim micro-motion heartbeat blip (low-frequency sub pulse)
  public playHeartbeat() {
    if (this.muted) return
    this.initContext()
    if (!this.ctx) return

    const now = this.ctx.currentTime

    // First thump (lub)
    const osc1 = this.ctx.createOscillator()
    const gain1 = this.ctx.createGain()
    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(85, now)
    osc1.frequency.exponentialRampToValueAtTime(45, now + 0.09)
    gain1.gain.setValueAtTime(this.volume * 0.45, now)
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.09)
    osc1.connect(gain1)
    gain1.connect(this.ctx.destination)
    osc1.start(now)
    osc1.stop(now + 0.09)

    // Second thump (dub) 120ms later
    const osc2 = this.ctx.createOscillator()
    const gain2 = this.ctx.createGain()
    osc2.type = 'sine'
    osc2.frequency.setValueAtTime(75, now + 0.12)
    osc2.frequency.exponentialRampToValueAtTime(38, now + 0.22)
    gain2.gain.setValueAtTime(this.volume * 0.35, now + 0.12)
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.22)
    osc2.connect(gain2)
    gain2.connect(this.ctx.destination)
    osc2.start(now + 0.12)
    osc2.stop(now + 0.22)
  }

  // Acoustic knocking resonance transient
  public playAcousticKnock() {
    if (this.muted) return
    this.initContext()
    if (!this.ctx) return

    const now = this.ctx.currentTime

    // Knock burst pattern (3 periodic strikes)
    for (let i = 0; i < 3; i++) {
      const strikeTime = now + i * 0.16
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()
      const filter = this.ctx.createBiquadFilter()

      osc.type = 'triangle'
      osc.frequency.setValueAtTime(340, strikeTime)
      osc.frequency.exponentialRampToValueAtTime(120, strikeTime + 0.07)

      filter.type = 'lowpass'
      filter.frequency.setValueAtTime(650, strikeTime)

      gain.gain.setValueAtTime(this.volume * 0.28, strikeTime)
      gain.gain.exponentialRampToValueAtTime(0.001, strikeTime + 0.07)

      osc.connect(filter)
      filter.connect(gain)
      gain.connect(this.ctx.destination)

      osc.start(strikeTime)
      osc.stop(strikeTime + 0.07)
    }
  }

  // Mission stage transition chime
  public playStageChime() {
    if (this.muted) return
    this.initContext()
    if (!this.ctx) return
    const ctx = this.ctx

    const notes = [587.33, 880, 1174.66] // D5, A5, D6
    const now = ctx.currentTime

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      const start = now + idx * 0.06

      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, start)

      gain.gain.setValueAtTime(this.volume * 0.2, start)
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.28)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(start)
      osc.stop(start + 0.28)
    })
  }

  // Rescue confirmed triumphal telemetry chord
  public playRescueConfirmed() {
    if (this.muted) return
    this.initContext()
    if (!this.ctx) return
    const ctx = this.ctx

    const chord = [440, 554.37, 659.25, 880] // A Major
    const now = ctx.currentTime

    chord.forEach((freq, idx) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      const start = now + idx * 0.08

      osc.type = 'triangle'
      osc.frequency.setValueAtTime(freq, start)

      gain.gain.setValueAtTime(this.volume * 0.22, start)
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.6)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(start)
      osc.stop(start + 0.6)
    })
  }
}

export const tacticalAudio = new TacticalAudioEngine()
