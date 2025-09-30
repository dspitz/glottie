import type { AudioState, PlaybackMode, LineEndBehavior } from '@/contexts/AudioContext'
import type { Track, AudioAdapter } from '@/types/audio'
import { SpotifyAdapter } from '@/services/adapters/SpotifyAdapter'
import { HTML5Adapter } from '@/services/adapters/HTML5Adapter'
import { LinePlaybackMonitor } from '@/services/LinePlaybackMonitor'

// State update callback
type StateUpdateCallback = (state: AudioState) => void

export class AudioEngine {
  private state: AudioState
  private stateUpdateCallback: StateUpdateCallback
  private adapter: AudioAdapter | null = null
  private lineMonitor: LinePlaybackMonitor
  private playheadMonitorInterval: NodeJS.Timer | null = null
  private spotifyAdapter: SpotifyAdapter
  private html5Adapter: HTML5Adapter

  constructor(onStateUpdate: StateUpdateCallback) {
    this.stateUpdateCallback = onStateUpdate

    // Initialize state
    this.state = {
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      volume: 1,
      playbackRate: 1,
      currentTrack: null,
      playbackMode: 'unavailable',
      isPlayingLine: false,
      currentLineIndex: -1,
      lineEndBehavior: 'pause',
      isLoading: false,
      isBuffering: false,
      error: null
    }

    // Initialize adapters
    this.spotifyAdapter = new SpotifyAdapter()
    this.html5Adapter = new HTML5Adapter()

    // Initialize line monitor
    this.lineMonitor = new LinePlaybackMonitor(this)

    // Set up adapter event handlers
    this.setupAdapterHandlers()
  }

  // Setup adapter event handlers
  private setupAdapterHandlers() {
    // Spotify adapter events
    this.spotifyAdapter.onStateChange((spotifyState) => {
      if (this.adapter === this.spotifyAdapter) {
        this.updateState({
          currentTime: this.spotifyAdapter.getCurrentTimeMs(),
          duration: this.spotifyAdapter.getDurationMs(),
          isBuffering: false
        })
      }
    })

    this.spotifyAdapter.onError((error) => {
      this.updateState({ error: error.message })
    })

    // HTML5 adapter events
    this.html5Adapter.onStateChange((html5State) => {
      if (this.adapter === this.html5Adapter) {
        this.updateState({
          currentTime: this.html5Adapter.getCurrentTimeMs(),
          duration: this.html5Adapter.getDurationMs(),
          isBuffering: false
        })
      }
    })

    this.html5Adapter.onError((error) => {
      this.updateState({ error: error.message })
    })
  }

  // Update state and notify listeners
  private updateState(updates: Partial<AudioState>) {
    this.state = { ...this.state, ...updates }
    this.stateUpdateCallback(this.state)
  }

  // Determine which adapter to use
  private selectAdapter(track: Track): AudioAdapter {
    // Check if Spotify is available and track has Spotify ID
    if (this.spotifyAdapter.isAvailable() && track.spotifyId) {
      return this.spotifyAdapter
    }
    // Fall back to HTML5 if preview URL is available
    if (track.previewUrl) {
      return this.html5Adapter
    }
    // No adapter available
    throw new Error('No suitable audio adapter available for this track')
  }

  // Start monitoring playhead position
  private startPlayheadMonitoring() {
    this.stopPlayheadMonitoring()

    this.playheadMonitorInterval = setInterval(() => {
      if (this.adapter && this.state.isPlaying) {
        const currentTime = this.adapter.getCurrentTimeMs()
        const duration = this.adapter.getDurationMs()

        // Only update if values have changed significantly (more than 100ms difference)
        if (Math.abs(currentTime - this.state.currentTime) > 100 ||
            Math.abs(duration - this.state.duration) > 100) {
          this.updateState({ currentTime, duration })
        }
      }
    }, 100) // Update every 100ms
  }

  // Stop monitoring playhead position
  private stopPlayheadMonitoring() {
    if (this.playheadMonitorInterval) {
      clearInterval(this.playheadMonitorInterval)
      this.playheadMonitorInterval = null
    }
  }

  // Public methods

  async play(): Promise<void> {
    if (!this.adapter || !this.state.currentTrack) {
      throw new Error('No track loaded')
    }

    this.updateState({ isLoading: true })
    try {
      await this.adapter.play()
      this.updateState({ isPlaying: true, isLoading: false, error: null })
      this.startPlayheadMonitoring()
    } catch (error) {
      this.updateState({
        isPlaying: false,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to play'
      })
      throw error
    }
  }

  async pause(): Promise<void> {
    if (!this.adapter) {
      return
    }

    try {
      await this.adapter.pause()
      this.updateState({ isPlaying: false, error: null })
      this.stopPlayheadMonitoring()
    } catch (error) {
      this.updateState({
        error: error instanceof Error ? error.message : 'Failed to pause'
      })
      throw error
    }
  }

  async togglePlayPause(): Promise<void> {
    if (this.state.isPlaying) {
      await this.pause()
    } else {
      await this.play()
    }
  }

  async seek(timeMs: number): Promise<void> {
    if (!this.adapter) {
      return
    }

    try {
      await this.adapter.seek(timeMs)
      this.updateState({ currentTime: timeMs, error: null })
    } catch (error) {
      this.updateState({
        error: error instanceof Error ? error.message : 'Failed to seek'
      })
      throw error
    }
  }

  async playFromTime(timeMs: number): Promise<void> {
    await this.seek(timeMs)
    if (!this.state.isPlaying) {
      await this.play()
    }
  }

  async playLine(
    lineIndex: number,
    startMs: number,
    endMs: number | undefined,
    behavior?: LineEndBehavior
  ): Promise<void> {
    // Stop any existing line playback
    this.stopLinePlayback()

    // Update state
    this.updateState({
      isPlayingLine: true,
      currentLineIndex: lineIndex,
      lineEndBehavior: behavior || this.state.lineEndBehavior
    })

    // Start playback from line start
    await this.playFromTime(startMs)

    // Set up line end monitoring if we have an end time
    if (endMs !== undefined) {
      this.lineMonitor.start(endMs, () => {
        this.handleLineEnd()
      })
    }
  }

  private handleLineEnd() {
    const behavior = this.state.lineEndBehavior

    switch (behavior) {
      case 'pause':
        this.pause()
        this.updateState({ isPlayingLine: false })
        break

      case 'advance':
        // Just clear the line playing state, let audio continue
        this.updateState({ isPlayingLine: false })
        break

      case 'loop':
        // Restart the same line
        const currentLine = this.state.currentLineIndex
        // Note: We'd need to store line timing info to properly loop
        // For now, just clear the state
        this.updateState({ isPlayingLine: false })
        break
    }
  }

  stopLinePlayback(): void {
    this.lineMonitor.stop()
    this.updateState({
      isPlayingLine: false,
      currentLineIndex: -1
    })
  }

  setVolume(volume: number): void {
    const clampedVolume = Math.max(0, Math.min(1, volume))
    if (this.adapter) {
      this.adapter.setVolume(clampedVolume)
    }
    this.updateState({ volume: clampedVolume })
  }

  setPlaybackRate(rate: number): void {
    const clampedRate = Math.max(0.5, Math.min(2, rate))
    if (this.adapter) {
      this.adapter.setPlaybackRate(clampedRate)
    }
    this.updateState({ playbackRate: clampedRate })
  }

  setLineEndBehavior(behavior: LineEndBehavior): void {
    this.updateState({ lineEndBehavior: behavior })
  }

  async loadTrack(track: Track): Promise<void> {
    // Stop current playback
    if (this.state.isPlaying) {
      await this.pause()
    }

    // Clean up current adapter
    if (this.adapter) {
      this.adapter.unloadTrack()
    }

    // Stop line monitoring
    this.stopLinePlayback()

    this.updateState({ isLoading: true, error: null })

    try {
      // Select appropriate adapter
      this.adapter = this.selectAdapter(track)
      const playbackMode: PlaybackMode =
        this.adapter === this.spotifyAdapter ? 'spotify' :
        this.adapter === this.html5Adapter ? 'preview' :
        'unavailable'

      // Load track into adapter
      await this.adapter.loadTrack(track)

      // Update state
      this.updateState({
        currentTrack: track,
        playbackMode,
        isLoading: false,
        currentTime: 0,
        duration: this.adapter.getDurationMs(),
        error: null
      })
    } catch (error) {
      this.updateState({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load track',
        playbackMode: 'unavailable'
      })
      throw error
    }
  }

  unloadTrack(): void {
    // Stop playback
    if (this.state.isPlaying) {
      this.pause()
    }

    // Clean up adapter
    if (this.adapter) {
      this.adapter.unloadTrack()
      this.adapter = null
    }

    // Stop monitoring
    this.stopPlayheadMonitoring()
    this.stopLinePlayback()

    // Reset state
    this.updateState({
      currentTrack: null,
      playbackMode: 'unavailable',
      currentTime: 0,
      duration: 0,
      isPlaying: false,
      isPlayingLine: false,
      currentLineIndex: -1,
      error: null
    })
  }

  // Get current time in milliseconds
  getCurrentTimeMs(): number {
    return this.adapter?.getCurrentTimeMs() || 0
  }

  // Clean up
  destroy(): void {
    this.stopPlayheadMonitoring()
    this.lineMonitor.stop()

    if (this.adapter) {
      this.adapter.destroy()
    }

    this.spotifyAdapter.destroy()
    this.html5Adapter.destroy()
  }
}