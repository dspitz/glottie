// Track interface for audio playback
export interface Track {
  id: string
  title: string
  artist: string
  album?: string
  spotifyId?: string
  spotifyUrl?: string
  previewUrl?: string
  albumArt?: string
  albumArtSmall?: string
  duration?: number  // Duration in milliseconds
}

// Audio adapter interface for different playback sources
export interface AudioAdapter {
  // Playback controls
  play(): Promise<void>
  pause(): Promise<void>
  seek(timeMs: number): Promise<void>

  // State getters (always return milliseconds)
  getCurrentTimeMs(): number
  getDurationMs(): number
  getVolume(): number
  getPlaybackRate(): number

  // Settings
  setVolume(volume: number): void
  setPlaybackRate(rate: number): void

  // Track management
  loadTrack(track: Track): Promise<void>
  unloadTrack(): void

  // Events
  onStateChange(callback: (state: any) => void): void
  onError(callback: (error: Error) => void): void

  // Cleanup
  destroy(): void
}

// Audio command for command pattern
export interface AudioCommand {
  execute(): Promise<void>
  undo?(): Promise<void>
}