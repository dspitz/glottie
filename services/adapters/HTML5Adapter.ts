import type { AudioAdapter, Track } from '@/types/audio'

/**
 * Adapter for HTML5 Audio API
 * Handles preview playback using standard browser audio capabilities
 */
export class HTML5Adapter implements AudioAdapter {
  private audio: HTMLAudioElement | null = null
  private currentTrack: Track | null = null
  private stateChangeCallbacks: Set<(state: any) => void> = new Set()
  private errorCallbacks: Set<(error: Error) => void> = new Set()
  private volume: number = 1
  private playbackRate: number = 1
  private isLoaded: boolean = false

  constructor() {
    // Create audio element if in browser
    if (typeof window !== 'undefined') {
      this.audio = new Audio()
      this.setupEventListeners()
    }
  }

  /**
   * Check if HTML5 audio is available
   */
  isAvailable(): boolean {
    return this.audio !== null
  }

  /**
   * Set up audio element event listeners
   */
  private setupEventListeners(): void {
    if (!this.audio) return

    // Playback state events
    this.audio.addEventListener('play', () => {
      this.notifyStateChange({ isPlaying: true })
    })

    this.audio.addEventListener('pause', () => {
      this.notifyStateChange({ isPlaying: false })
    })

    this.audio.addEventListener('ended', () => {
      this.notifyStateChange({ isPlaying: false, ended: true })
    })

    // Time updates
    this.audio.addEventListener('timeupdate', () => {
      this.notifyStateChange({
        currentTime: this.audio!.currentTime,
        duration: this.audio!.duration
      })
    })

    // Loading events
    this.audio.addEventListener('loadstart', () => {
      this.isLoaded = false
      this.notifyStateChange({ loading: true })
    })

    this.audio.addEventListener('loadeddata', () => {
      this.isLoaded = true
      this.notifyStateChange({ loading: false })
    })

    this.audio.addEventListener('canplay', () => {
      this.notifyStateChange({ canPlay: true })
    })

    // Error handling
    this.audio.addEventListener('error', (event) => {
      const error = new Error(`Audio playback error: ${this.audio?.error?.message || 'Unknown error'}`)
      this.notifyError(error)
    })

    // Volume change
    this.audio.addEventListener('volumechange', () => {
      this.volume = this.audio!.volume
      this.notifyStateChange({ volume: this.volume })
    })

    // Playback rate change
    this.audio.addEventListener('ratechange', () => {
      this.playbackRate = this.audio!.playbackRate
      this.notifyStateChange({ playbackRate: this.playbackRate })
    })
  }

  /**
   * Play current track
   */
  async play(): Promise<void> {
    if (!this.audio) {
      throw new Error('Audio element not initialized')
    }

    if (!this.isLoaded) {
      throw new Error('No track loaded')
    }

    try {
      await this.audio.play()
    } catch (error) {
      const err = new Error(`Failed to play: ${error instanceof Error ? error.message : 'Unknown error'}`)
      this.notifyError(err)
      throw err
    }
  }

  /**
   * Pause playback
   */
  async pause(): Promise<void> {
    if (!this.audio) {
      throw new Error('Audio element not initialized')
    }

    try {
      this.audio.pause()
    } catch (error) {
      const err = new Error('Failed to pause audio')
      this.notifyError(err)
      throw err
    }
  }

  /**
   * Seek to position (in milliseconds)
   */
  async seek(timeMs: number): Promise<void> {
    if (!this.audio) {
      throw new Error('Audio element not initialized')
    }

    if (!this.isLoaded) {
      throw new Error('No track loaded')
    }

    try {
      // HTML5 audio currentTime is in seconds
      const timeInSeconds = timeMs / 1000
      this.audio.currentTime = timeInSeconds
    } catch (error) {
      const err = new Error(`Failed to seek to ${timeMs}ms`)
      this.notifyError(err)
      throw err
    }
  }

  /**
   * Get current playback time in milliseconds
   */
  getCurrentTimeMs(): number {
    if (!this.audio) return 0
    // Convert from seconds to milliseconds
    return this.audio.currentTime * 1000
  }

  /**
   * Get track duration in milliseconds
   */
  getDurationMs(): number {
    if (!this.audio || !isFinite(this.audio.duration)) return 0
    // Convert from seconds to milliseconds
    return this.audio.duration * 1000
  }

  /**
   * Get current volume (0-1)
   */
  getVolume(): number {
    return this.volume
  }

  /**
   * Get playback rate
   */
  getPlaybackRate(): number {
    return this.playbackRate
  }

  /**
   * Set volume (0-1)
   */
  setVolume(volume: number): void {
    if (!this.audio) return

    const clampedVolume = Math.max(0, Math.min(1, volume))
    this.audio.volume = clampedVolume
    this.volume = clampedVolume
  }

  /**
   * Set playback rate
   */
  setPlaybackRate(rate: number): void {
    if (!this.audio) return

    const clampedRate = Math.max(0.5, Math.min(2, rate))
    this.audio.playbackRate = clampedRate
    this.playbackRate = clampedRate
  }

  /**
   * Load a track for playback
   */
  async loadTrack(track: Track): Promise<void> {
    if (!track.previewUrl) {
      throw new Error('Track does not have a preview URL')
    }

    if (!this.audio) {
      throw new Error('Audio element not initialized')
    }

    this.currentTrack = track
    this.isLoaded = false

    return new Promise((resolve, reject) => {
      if (!this.audio) {
        reject(new Error('Audio element not initialized'))
        return
      }

      // Set up one-time load handlers
      const handleLoaded = () => {
        this.isLoaded = true
        cleanup()
        resolve()
      }

      const handleError = () => {
        const error = new Error(`Failed to load audio: ${this.audio?.error?.message || 'Unknown error'}`)
        this.notifyError(error)
        cleanup()
        reject(error)
      }

      const cleanup = () => {
        this.audio?.removeEventListener('loadeddata', handleLoaded)
        this.audio?.removeEventListener('error', handleError)
      }

      this.audio.addEventListener('loadeddata', handleLoaded, { once: true })
      this.audio.addEventListener('error', handleError, { once: true })

      // Set source and load
      this.audio.src = track.previewUrl
      this.audio.load()

      // Set initial volume and playback rate
      this.audio.volume = this.volume
      this.audio.playbackRate = this.playbackRate
    })
  }

  /**
   * Unload current track
   */
  unloadTrack(): void {
    if (this.audio) {
      this.audio.pause()
      this.audio.src = ''
      this.audio.load()
    }
    this.currentTrack = null
    this.isLoaded = false
  }

  /**
   * Subscribe to state changes
   */
  onStateChange(callback: (state: any) => void): void {
    this.stateChangeCallbacks.add(callback)
  }

  /**
   * Subscribe to errors
   */
  onError(callback: (error: Error) => void): void {
    this.errorCallbacks.add(callback)
  }

  /**
   * Clean up adapter
   */
  destroy(): void {
    if (this.audio) {
      this.audio.pause()
      this.audio.src = ''

      // Remove all event listeners
      const events = [
        'play', 'pause', 'ended', 'timeupdate',
        'loadstart', 'loadeddata', 'canplay',
        'error', 'volumechange', 'ratechange'
      ]
      events.forEach(event => {
        this.audio?.removeEventListener(event, () => {})
      })
    }

    this.stateChangeCallbacks.clear()
    this.errorCallbacks.clear()
    this.currentTrack = null
    this.audio = null
  }

  // Private helper methods

  private notifyStateChange(state: any): void {
    this.stateChangeCallbacks.forEach(callback => callback(state))
  }

  private notifyError(error: Error): void {
    this.errorCallbacks.forEach(callback => callback(error))
  }
}