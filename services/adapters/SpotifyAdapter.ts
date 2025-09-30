import type { AudioAdapter, Track } from '@/types/audio'
import { SpotifyPlayerManager } from '@/components/SpotifyWebPlayer'

/**
 * Adapter for Spotify Web Playback SDK
 * Handles all Spotify-specific playback operations and normalizes to standard interface
 */
export class SpotifyAdapter implements AudioAdapter {
  private manager: SpotifyPlayerManager
  private currentTrack: Track | null = null
  private stateChangeCallbacks: Set<(state: any) => void> = new Set()
  private errorCallbacks: Set<(error: Error) => void> = new Set()
  private spotifyState: Spotify.PlaybackState | null = null
  private volume: number = 1
  private playbackRate: number = 1 // Note: Spotify doesn't support playback rate changes

  constructor() {
    this.manager = SpotifyPlayerManager.getInstance()

    // Subscribe to Spotify state changes
    this.manager.subscribeToStateChanges((state) => {
      this.spotifyState = state
      this.notifyStateChange(state)
    })
  }

  /**
   * Check if Spotify is available (authenticated and ready)
   */
  isAvailable(): boolean {
    return this.manager.isReady()
  }

  /**
   * Play current track
   */
  async play(): Promise<void> {
    const player = this.manager.getPlayer()
    if (!player) {
      throw new Error('Spotify player not initialized')
    }

    try {
      await player.resume()
    } catch (error) {
      const err = new Error('Failed to play Spotify track')
      this.notifyError(err)
      throw err
    }
  }

  /**
   * Pause playback
   */
  async pause(): Promise<void> {
    const player = this.manager.getPlayer()
    if (!player) {
      throw new Error('Spotify player not initialized')
    }

    try {
      await player.pause()
    } catch (error) {
      const err = new Error('Failed to pause Spotify track')
      this.notifyError(err)
      throw err
    }
  }

  /**
   * Seek to position (in milliseconds)
   */
  async seek(timeMs: number): Promise<void> {
    const player = this.manager.getPlayer()
    if (!player) {
      throw new Error('Spotify player not initialized')
    }

    try {
      // Spotify seek expects milliseconds
      await player.seek(Math.floor(timeMs))
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
    // Spotify state position is already in milliseconds
    return this.spotifyState?.position || 0
  }

  /**
   * Get track duration in milliseconds
   */
  getDurationMs(): number {
    // Spotify duration is already in milliseconds
    const track = this.spotifyState?.track_window?.current_track
    return track?.duration_ms || 0
  }

  /**
   * Get current volume (0-1)
   */
  getVolume(): number {
    return this.volume
  }

  /**
   * Get playback rate (always 1 for Spotify)
   */
  getPlaybackRate(): number {
    return this.playbackRate
  }

  /**
   * Set volume (0-1)
   */
  setVolume(volume: number): void {
    const player = this.manager.getPlayer()
    if (!player) return

    this.volume = volume
    // Spotify expects volume as 0-1
    player.setVolume(volume).catch((error) => {
      const err = new Error('Failed to set volume')
      this.notifyError(err)
    })
  }

  /**
   * Set playback rate (not supported by Spotify)
   */
  setPlaybackRate(rate: number): void {
    // Spotify doesn't support playback rate changes
    console.warn('Playback rate control is not supported by Spotify')
    this.playbackRate = 1 // Always 1 for Spotify
  }

  /**
   * Load a track for playback
   */
  async loadTrack(track: Track): Promise<void> {
    if (!track.spotifyId) {
      throw new Error('Track does not have a Spotify ID')
    }

    const player = this.manager.getPlayer()
    if (!player) {
      throw new Error('Spotify player not initialized')
    }

    this.currentTrack = track

    try {
      // Get access token (this would come from your auth system)
      const accessToken = await this.getAccessToken()
      if (!accessToken) {
        throw new Error('No Spotify access token available')
      }

      // Use Spotify Web API to start playback
      const deviceId = this.manager.getDeviceId()
      if (!deviceId) {
        throw new Error('No Spotify device ID available')
      }

      // Start playback via Web API
      const response = await fetch('https://api.spotify.com/v1/me/player/play', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          uris: [`spotify:track:${track.spotifyId}`],
          device_id: deviceId,
          position_ms: 0
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to load track: ${response.statusText}`)
      }

      // Pause immediately after loading (we just want to load, not auto-play)
      await new Promise(resolve => setTimeout(resolve, 500))
      await this.pause()
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to load Spotify track')
      this.notifyError(err)
      throw err
    }
  }

  /**
   * Unload current track
   */
  unloadTrack(): void {
    this.currentTrack = null
    // Spotify doesn't have a specific unload, just pause
    this.pause().catch(() => {})
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
    this.stateChangeCallbacks.clear()
    this.errorCallbacks.clear()
    this.currentTrack = null
  }

  // Private helper methods

  private notifyStateChange(state: any): void {
    this.stateChangeCallbacks.forEach(callback => callback(state))
  }

  private notifyError(error: Error): void {
    this.errorCallbacks.forEach(callback => callback(error))
  }

  private async getAccessToken(): Promise<string | null> {
    // This should integrate with your auth system
    // For now, try to get from session storage or wherever you store it
    if (typeof window !== 'undefined') {
      const session = window.localStorage.getItem('spotify-session')
      if (session) {
        try {
          const parsed = JSON.parse(session)
          return parsed.accessToken || null
        } catch {
          return null
        }
      }
    }
    return null
  }
}