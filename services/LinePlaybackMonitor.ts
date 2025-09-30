import type { AudioEngine } from '@/services/AudioEngine'

/**
 * Service responsible for monitoring line playback and triggering actions at line end.
 * Uses interval-based monitoring of actual playhead position instead of timers
 * to avoid issues with loading delays and ensure accurate timing.
 */
export class LinePlaybackMonitor {
  private monitorInterval: NodeJS.Timer | null = null
  private targetEndTime: number | null = null
  private onLineEndCallback: (() => void) | null = null
  private audioEngine: AudioEngine
  private checkCount: number = 0
  private isDebugMode: boolean = false

  constructor(audioEngine: AudioEngine, debugMode: boolean = false) {
    this.audioEngine = audioEngine
    this.isDebugMode = debugMode
  }

  /**
   * Start monitoring for line end
   * @param endTimeMs - The timestamp (in ms) when the line ends
   * @param onEnd - Callback to execute when line ends
   */
  start(endTimeMs: number, onEnd: () => void): void {
    // Clean up any existing monitor
    this.stop()

    this.targetEndTime = endTimeMs
    this.onLineEndCallback = onEnd
    this.checkCount = 0

    if (this.isDebugMode) {
      console.log('📍 LinePlaybackMonitor: Started monitoring', {
        targetEndTime: endTimeMs,
        targetEndTimeSec: (endTimeMs / 1000).toFixed(2)
      })
    }

    // Start interval to check playhead position
    this.monitorInterval = setInterval(() => {
      this.checkPlayhead()
    }, 50) // Check every 50ms for accurate timing
  }

  /**
   * Check current playhead position and trigger callback if reached end
   */
  private checkPlayhead(): void {
    if (!this.targetEndTime || !this.onLineEndCallback) {
      return
    }

    this.checkCount++

    // Get current playback time from audio engine
    const currentTimeMs = this.audioEngine.getCurrentTimeMs()

    // Debug logging every 500ms (10 checks)
    if (this.isDebugMode && this.checkCount % 10 === 0) {
      console.log('📊 LinePlaybackMonitor: Check', {
        checkCount: this.checkCount,
        currentTimeMs,
        currentTimeSec: (currentTimeMs / 1000).toFixed(2),
        targetEndTime: this.targetEndTime,
        targetEndTimeSec: (this.targetEndTime / 1000).toFixed(2),
        remaining: this.targetEndTime - currentTimeMs,
        remainingSec: ((this.targetEndTime - currentTimeMs) / 1000).toFixed(2)
      })
    }

    // Check if we've reached or passed the end time
    if (currentTimeMs >= this.targetEndTime) {
      const overshoot = currentTimeMs - this.targetEndTime

      if (this.isDebugMode) {
        console.log('🎯 LinePlaybackMonitor: Reached line end!', {
          currentTimeMs,
          targetEndTime: this.targetEndTime,
          overshoot,
          overshootMs: overshoot
        })
      }

      // Stop monitoring
      this.stop()

      // Execute callback
      if (this.onLineEndCallback) {
        this.onLineEndCallback()
      }
    }
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval)
      this.monitorInterval = null

      if (this.isDebugMode) {
        console.log('🛑 LinePlaybackMonitor: Stopped monitoring')
      }
    }

    this.targetEndTime = null
    this.onLineEndCallback = null
    this.checkCount = 0
  }

  /**
   * Check if monitor is active
   */
  isActive(): boolean {
    return this.monitorInterval !== null
  }

  /**
   * Get remaining time until line end (in milliseconds)
   * Returns null if not monitoring
   */
  getRemainingTime(): number | null {
    if (!this.targetEndTime) {
      return null
    }

    const currentTimeMs = this.audioEngine.getCurrentTimeMs()
    const remaining = this.targetEndTime - currentTimeMs
    return Math.max(0, remaining)
  }

  /**
   * Enable or disable debug mode
   */
  setDebugMode(enabled: boolean): void {
    this.isDebugMode = enabled
  }
}