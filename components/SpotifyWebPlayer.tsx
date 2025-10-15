'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import Script from 'next/script'

// Enhanced global singleton with better lifecycle management
class SpotifyPlayerManager {
  private static instance: SpotifyPlayerManager | null = null
  private player: Spotify.Player | null = null
  private deviceId: string = ''
  private initializationPromise: Promise<void> | null = null
  private scriptLoaded = false
  private isInitializing = false
  private stateSubscribers = new Set<(state: Spotify.PlaybackState | null) => void>()
  private readySubscribers = new Set<(deviceId: string) => void>()
  private currentAccessToken: string | null = null

  static getInstance(): SpotifyPlayerManager {
    if (!SpotifyPlayerManager.instance) {
      SpotifyPlayerManager.instance = new SpotifyPlayerManager()
    }
    return SpotifyPlayerManager.instance
  }

  setScriptLoaded(loaded: boolean) {
    this.scriptLoaded = loaded
  }

  isScriptLoaded(): boolean {
    return this.scriptLoaded
  }

  getPlayer(): Spotify.Player | null {
    return this.player
  }

  getDeviceId(): string {
    return this.deviceId
  }

  isReady(): boolean {
    return !!(this.player && this.deviceId)
  }

  subscribeToStateChanges(callback: (state: Spotify.PlaybackState | null) => void) {
    this.stateSubscribers.add(callback)
    return () => this.stateSubscribers.delete(callback)
  }

  subscribeToReady(callback: (deviceId: string) => void) {
    this.readySubscribers.add(callback)
    // If already ready, call immediately
    if (this.deviceId) {
      callback(this.deviceId)
    }
    return () => this.readySubscribers.delete(callback)
  }

  private broadcastStateChange(state: Spotify.PlaybackState | null) {
    this.stateSubscribers.forEach(callback => callback(state))
  }

  private broadcastReady(deviceId: string) {
    this.readySubscribers.forEach(callback => callback(deviceId))
  }

  async initialize(accessToken: string): Promise<void> {
    // console.log('[SpotifyPlayerManager] Initialize called:', {
    //   hasAccessToken: !!accessToken,
    //   scriptLoaded: this.scriptLoaded,
    //   hasPlayer: !!this.player,
    //   isInitializing: this.isInitializing,
    //   deviceId: this.deviceId
    // })

    if (!accessToken || !this.scriptLoaded) {
      // console.log('[SpotifyPlayerManager] Missing requirements for initialization')
      return
    }

    // If already initialized with same token, return existing
    if (this.player && this.deviceId && this.currentAccessToken === accessToken) {
      // console.log('[SpotifyPlayerManager] Already initialized, broadcasting ready')
      this.broadcastReady(this.deviceId)
      return
    }

    // If initialization in progress, wait for it
    if (this.initializationPromise) {
      // console.log('[SpotifyPlayerManager] Initialization in progress, waiting...')
      return await this.initializationPromise
    }

    // Start new initialization
    this.initializationPromise = this.doInitialize(accessToken)
    await this.initializationPromise
    this.initializationPromise = null
  }

  private async doInitialize(accessToken: string): Promise<void> {
    try {
      this.isInitializing = true
      this.currentAccessToken = accessToken

      // console.log('[SpotifyPlayerManager] Starting player initialization...')
      
      if (typeof window === 'undefined' || !window.Spotify) {
        throw new Error('Spotify SDK not available')
      }

      // Clean up existing player if any
      if (this.player) {
        // console.log('[SpotifyPlayerManager] Cleaning up existing player')
        await this.player.disconnect()
        this.player = null
        this.deviceId = ''
      }

      const player = new window.Spotify.Player({
        name: 'Glottie Web Player',
        getOAuthToken: (cb: (token: string) => void) => {
          cb(accessToken)
        },
        volume: 0.8
      })

      // Error handling
      player.addListener('initialization_error', ({ message }) => {
        console.error('[SpotifyPlayerManager] Initialization error:', message)
      })

      player.addListener('authentication_error', ({ message }) => {
        console.error('[SpotifyPlayerManager] Authentication error:', message)
      })

      player.addListener('account_error', ({ message }) => {
        console.error('[SpotifyPlayerManager] Account error:', message)
      })

      player.addListener('playback_error', ({ message }) => {
        console.error('[SpotifyPlayerManager] Playback error:', message)
      })

      // State changes
      player.addListener('player_state_changed', (state) => {
        // console.log('[SpotifyPlayerManager] Player state changed:', state)
        this.broadcastStateChange(state)
      })

      // Ready
      player.addListener('ready', ({ device_id }) => {
        // console.log('[SpotifyPlayerManager] Player ready with device ID:', device_id)
        this.deviceId = device_id
        this.player = player
        this.broadcastReady(device_id)
      })

      player.addListener('not_ready', ({ device_id }) => {
        // console.log('[SpotifyPlayerManager] Player not ready:', device_id)
      })

      // Connect
      // console.log('[SpotifyPlayerManager] Connecting to Spotify...')
      const success = await player.connect()
      if (!success) {
        throw new Error('Failed to connect to Spotify')
      }
      
      // console.log('[SpotifyPlayerManager] Successfully connected to Spotify')
    } catch (error) {
      console.error('[SpotifyPlayerManager] Initialization failed:', error)
      this.player = null
      this.deviceId = ''
      throw error
    } finally {
      this.isInitializing = false
    }
  }

  async cleanup() {
    // console.log('[SpotifyPlayerManager] Cleaning up player')
    if (this.player) {
      await this.player.disconnect()
      this.player = null
    }
    this.deviceId = ''
    this.currentAccessToken = null
    this.stateSubscribers.clear()
    this.readySubscribers.clear()
    this.initializationPromise = null
    this.isInitializing = false
  }

  static reset() {
    if (SpotifyPlayerManager.instance) {
      SpotifyPlayerManager.instance.cleanup()
      SpotifyPlayerManager.instance = null
    }
  }
}

// Enhanced device activation with progressive retry
class SpotifyDeviceManager {
  private static deviceActivationPromise: Promise<boolean> | null = null
  private static isDeviceActive = false
  private static lastActiveDeviceId = ''
  
  static async ensureDeviceActive(deviceId: string, accessToken: string): Promise<boolean> {
    // If device hasn't changed and is already active, return quickly
    if (this.isDeviceActive && this.lastActiveDeviceId === deviceId) {
      // console.log('[SpotifyDeviceManager] Device already active, skipping activation')
      return true
    }
    
    // If activation in progress for same device, wait for it
    if (this.deviceActivationPromise) {
      // console.log('[SpotifyDeviceManager] Device activation in progress, waiting...')
      return await this.deviceActivationPromise
    }
    
    this.deviceActivationPromise = this.activateDevice(deviceId, accessToken)
    const result = await this.deviceActivationPromise
    this.deviceActivationPromise = null
    
    if (result) {
      this.isDeviceActive = true
      this.lastActiveDeviceId = deviceId
    }
    
    return result
  }
  
  private static async activateDevice(deviceId: string, accessToken: string): Promise<boolean> {
    try {
      // console.log('[SpotifyDeviceManager] Activating device:', deviceId)
      
      // First check if device is already active
      const currentStateResponse = await fetch('https://api.spotify.com/v1/me/player', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        }
      })
      
      if (currentStateResponse.ok) {
        const responseText = await currentStateResponse.text()
        if (responseText) {
          const currentState = JSON.parse(responseText)
          if (currentState?.device?.id === deviceId && currentState.device.is_active) {
            // console.log('[SpotifyDeviceManager] Device already active')
            return true
          }
        } else {
          // console.log('[SpotifyDeviceManager] No current playback state')
        }
      }
      
      // Transfer playback to our device
      // console.log('[SpotifyDeviceManager] Transferring playback to device')
      const transferResponse = await fetch('https://api.spotify.com/v1/me/player', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          device_ids: [deviceId],
          play: false
        })
      })
      
      if (transferResponse.ok || transferResponse.status === 202) {
        // console.log('[SpotifyDeviceManager] Device transfer successful')
        // Give time for transfer to complete
        await new Promise(resolve => setTimeout(resolve, 2000))
        return true
      } else {
        const errorText = await transferResponse.text()
        // console.warn('[SpotifyDeviceManager] Device transfer failed:', transferResponse.status, errorText)
        return false
      }
    } catch (error) {
      console.error('[SpotifyDeviceManager] Device activation error:', error)
      return false
    }
  }
  
  static resetDeviceState() {
    this.isDeviceActive = false
    this.lastActiveDeviceId = ''
    this.deviceActivationPromise = null
  }
}

interface Track {
  id: string
  title: string
  artist: string
  album?: string
  spotifyId: string
  spotifyUrl?: string
  previewUrl?: string
  albumArt?: string
  albumArtSmall?: string
}

interface SpotifyWebPlayerProps {
  track?: Track
  onPlayerReady?: (deviceId: string) => void
  onPlayerStateChange?: (state: Spotify.PlaybackState | null) => void
}

export const SpotifyWebPlayer = React.forwardRef<any, SpotifyWebPlayerProps>(({ 
  track, 
  onPlayerReady, 
  onPlayerStateChange 
}, ref) => {
  const { data: session, status } = useSession()
  const [isReady, setIsReady] = useState(false)
  const [isActive, setIsActive] = useState(false)
  const [playerState, setPlayerState] = useState<Spotify.PlaybackState | null>(null)
  const playerManager = SpotifyPlayerManager.getInstance()

  // Initialize using singleton manager
  useEffect(() => {
    if (!session?.accessToken) return

    const initializeAsync = async () => {
      try {
        await playerManager.initialize(session.accessToken!)
        if (playerManager.isReady()) {
          setIsReady(true)
          onPlayerReady?.(playerManager.getDeviceId())
        }
      } catch (error) {
        console.error('[SpotifyWebPlayer] Initialization failed:', error)
      }
    }

    if (playerManager.isScriptLoaded()) {
      initializeAsync()
    }
  }, [session?.accessToken, playerManager, onPlayerReady])

  // Subscribe to state changes and ready events
  useEffect(() => {
    const unsubscribeState = playerManager.subscribeToStateChanges((state) => {
      setPlayerState(state)
      onPlayerStateChange?.(state)
    })
    
    const unsubscribeReady = playerManager.subscribeToReady((deviceId) => {
      setIsReady(true)
      onPlayerReady?.(deviceId)
    })
    
    return () => {
      unsubscribeState()
      unsubscribeReady()
    }
  }, [playerManager, onPlayerStateChange, onPlayerReady])

  // Component cleanup - don't disconnect global player
  useEffect(() => {
    return () => {
      setIsReady(false)
      setIsActive(false)
    }
  }, [])

  // Play a specific track with progressive retry
  const playTrack = useCallback(async (trackUri: string) => {
    // console.log('[SpotifyWebPlayer] PlayTrack called:', {
    //   hasAccessToken: !!session?.accessToken,
    //   isReady,
    //   trackUri,
    //   deviceId: playerManager.getDeviceId()
    // })

    if (!session?.accessToken) {
      console.error('[SpotifyWebPlayer] No access token available')
      return false
    }

    if (!playerManager.isReady()) {
      console.error('[SpotifyWebPlayer] Player not ready yet')
      return 'PLAYER_NOT_READY'
    }

    const deviceId = playerManager.getDeviceId()
    // console.log('[SpotifyWebPlayer] Attempting to play track:', trackUri, 'on device:', deviceId)

    try {
      // Ensure device is active first
      const deviceActivated = await SpotifyDeviceManager.ensureDeviceActive(deviceId, session.accessToken)
      if (!deviceActivated) {
        // console.warn('[SpotifyWebPlayer] Device activation failed, attempting playback anyway')
      }

      // Progressive retry strategy for playback
      const retryDelays = [0, 1000, 2000, 4000] // Immediate, 1s, 2s, 4s
      let lastError: any = null

      for (let attempt = 0; attempt < retryDelays.length; attempt++) {
        if (attempt > 0) {
          // console.log(`[SpotifyWebPlayer] Retry attempt ${attempt} after ${retryDelays[attempt]}ms delay...`)
          await new Promise(resolve => setTimeout(resolve, retryDelays[attempt]))
        }

        try {
          const response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${session.accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              uris: [trackUri]
            })
          })

          if (response.ok || response.status === 204) {
            // console.log(`[SpotifyWebPlayer] Playback started successfully on attempt ${attempt + 1}`)
            setIsActive(true)
            return true
          }

          // Parse error response
          const errorText = await response.text()
          let error: any = { status: response.status }
          if (errorText) {
            try {
              error = JSON.parse(errorText)
            } catch {
              error.message = errorText
            }
          }

          lastError = error
          // console.warn(`[SpotifyWebPlayer] Attempt ${attempt + 1} failed:`, response.status, error)

          // Check for specific error types that don't need retry
          if (error.error?.reason === 'PREMIUM_REQUIRED') {
            return 'PREMIUM_REQUIRED'
          }

          // For 404 and some other errors, continue retrying
          if (response.status === 404 || response.status === 502 || response.status === 503) {
            continue
          }

          // For other errors, don't retry
          break

        } catch (fetchError) {
          console.error(`[SpotifyWebPlayer] Network error on attempt ${attempt + 1}:`, fetchError)
          lastError = fetchError
          // Continue to retry on network errors
        }
      }

      console.error('[SpotifyWebPlayer] All playback attempts failed:', lastError)
      return false

    } catch (error) {
      console.error('[SpotifyWebPlayer] Unexpected error during playback:', error)
      return false
    }
  }, [session?.accessToken, playerManager, isReady])

  // Control functions using singleton manager
  const togglePlayPause = useCallback(async () => {
    const player = playerManager.getPlayer()
    if (!player) return false
    
    try {
      await player.togglePlay()
      return true
    } catch (error) {
      console.error('[SpotifyWebPlayer] Error toggling play/pause:', error)
      return false
    }
  }, [playerManager])

  const seek = useCallback(async (positionMs: number) => {
    const player = playerManager.getPlayer()
    if (!player) return false
    
    try {
      await player.seek(positionMs)
      return true
    } catch (error) {
      console.error('[SpotifyWebPlayer] Error seeking:', error)
      return false
    }
  }, [playerManager])

  const setVolume = useCallback(async (volume: number) => {
    const player = playerManager.getPlayer()
    if (!player) return false

    try {
      await player.setVolume(volume)
      return true
    } catch (error) {
      console.error('[SpotifyWebPlayer] Error setting volume:', error)
      return false
    }
  }, [playerManager])

  const pause = useCallback(async () => {
    const player = playerManager.getPlayer()
    if (!player) return false

    try {
      await player.pause()
      return true
    } catch (error) {
      console.error('[SpotifyWebPlayer] Error pausing:', error)
      return false
    }
  }, [playerManager])

  const resume = useCallback(async () => {
    const player = playerManager.getPlayer()
    if (!player) return false

    try {
      await player.resume()
      return true
    } catch (error) {
      console.error('[SpotifyWebPlayer] Error resuming:', error)
      return false
    }
  }, [playerManager])

  // Expose player methods for parent components
  React.useImperativeHandle(ref, () => ({
    playTrack,
    togglePlayPause,
    pause,
    resume,
    seek,
    setVolume,
    isReady,
    isActive,
    playerState,
    deviceId: playerManager.getDeviceId(),
    player: playerManager.getPlayer() // Expose the actual player instance
  }))

  // Debug session status
  // console.log('SpotifyWebPlayer session check:', {
  //   hasSession: !!session,
  //   hasAccessToken: !!session?.accessToken,
  //   sessionStatus: status,
  //   isClient: typeof window !== 'undefined'
  // })

  // Don't render anything if user is not authenticated
  if (status === 'loading') {
    // console.log('SpotifyWebPlayer: Session loading...')
    return null
  }

  if (!session?.accessToken) {
    // console.log('SpotifyWebPlayer: No access token, not rendering')
    return null
  }

  // console.log('SpotifyWebPlayer: Rendering with access token:', !!session.accessToken)

  return (
    <>
      <Script
        src="https://sdk.scdn.co/spotify-player.js"
        onLoad={() => {
          // console.log('[SpotifyWebPlayer] Spotify Player SDK loaded')
          playerManager.setScriptLoaded(true)
          
          // Initialize if we have a session
          if (session?.accessToken) {
            playerManager.initialize(session.accessToken).catch(error => {
              console.error('[SpotifyWebPlayer] Auto-initialization failed:', error)
            })
          }
        }}
        onError={(e) => {
          console.error('[SpotifyWebPlayer] Failed to load Spotify Player SDK:', e)
        }}
      />
      
      {/* Hidden div for the player - it doesn't render any UI */}
      <div style={{ display: 'none' }}>
        {isReady && (
          <div>
            Spotify Web Player Ready (Device ID: {playerManager.getDeviceId()})
          </div>
        )}
      </div>
    </>
  )
})

SpotifyWebPlayer.displayName = 'SpotifyWebPlayer'

// Global cleanup function for when user signs out
export function cleanupSpotifyPlayer() {
  SpotifyPlayerManager.reset()
  SpotifyDeviceManager.resetDeviceState()
  // console.log('[SpotifyWebPlayer] Global Spotify player state cleaned up')
}

// Player control hook for easy access in other components
export function useSpotifyPlayer() {
  const { data: session } = useSession()
  const playerManager = SpotifyPlayerManager.getInstance()
  
  // Cleanup when session ends
  React.useEffect(() => {
    if (!session?.accessToken && playerManager.isReady()) {
      cleanupSpotifyPlayer()
    }
  }, [session?.accessToken, playerManager])
  
  return {
    session,
    playerManager,
    isAuthenticated: !!session?.accessToken,
    hasSpotifyError: session?.error === 'RefreshAccessTokenError'
  }
}