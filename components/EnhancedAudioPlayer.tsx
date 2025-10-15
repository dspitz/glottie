'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useSession, signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { SpotifyWebPlayer, useSpotifyPlayer } from '@/components/SpotifyWebPlayer'
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  ExternalLink,
  Music,
  AlertCircle,
  Shield,
  LogIn,
  Crown
} from 'lucide-react'

interface Track {
  id: string
  title: string
  artist: string
  album?: string
  spotifyId?: string
  spotifyUrl?: string
  previewUrl?: string
  albumArt?: string
  albumArtSmall?: string
}

export interface AudioPlayerState {
  isPlaying: boolean
  currentTime: number
  duration: number
  playbackMode: 'preview' | 'spotify' | 'unavailable'
  playbackRate?: number
}

export interface AudioPlayerControls {
  play: () => Promise<void>
  pause: () => Promise<void>
  togglePlayPause: () => Promise<void>
  seek: (timeInMs: number) => void
  seekSilent: (timeInMs: number) => Promise<void> // Seek without playing
  playFromTime: (timeInMs: number) => Promise<boolean>
  playLine: (startTimeMs: number, endTimeMs: number) => Promise<boolean>
  setPlaybackRate: (rate: number) => void
  getState: () => AudioPlayerState
  preload: () => Promise<boolean> // Preload track without playing
  savePlaybackPosition: () => void // Save current position
  restorePlaybackPosition: () => Promise<void> // Restore saved position
}

export interface AudioPlayerCallbacks {
  onSongComplete?: () => void
}

interface EnhancedAudioPlayerProps {
  track: Track
  className?: string
  onStateChange?: (state: AudioPlayerState) => void
  onControlsReady?: (controls: AudioPlayerControls) => void
  onSongComplete?: () => void
  // Legacy callbacks - will be deprecated
  onTimeSeek?: (seekFn: (time: number) => void, playFromTimeFn?: (time: number) => Promise<boolean>) => void
  onPlaybackRateChange?: (changeFn: (rate: number) => void) => void
  onPlayPauseReady?: (fn: () => void) => void
}

type PlaybackMode = 'preview' | 'spotify' | 'unavailable'

export function EnhancedAudioPlayer({ track, className = '', onStateChange, onControlsReady, onSongComplete, onTimeSeek, onPlaybackRateChange, onPlayPauseReady }: EnhancedAudioPlayerProps) {
  const { data: session } = useSession()
  const { isAuthenticated, hasSpotifyError } = useSpotifyPlayer()
  
  // Determine playback mode based on authentication and track availability
  const getPlaybackMode = (): PlaybackMode => {
    if (isAuthenticated && track.spotifyId) return 'spotify'
    if (track.previewUrl) return 'preview'
    return 'unavailable'
  }
  
  const [playbackMode, setPlaybackMode] = useState<PlaybackMode>(getPlaybackMode())
  
  // Update playback mode when authentication or track changes
  useEffect(() => {
    const newMode = getPlaybackMode()
    setPlaybackMode(newMode)
  }, [isAuthenticated, track.spotifyId, track.previewUrl])
  
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [playbackRate, setPlaybackRate] = useState(1.0)
  const [hasEverPlayed, setHasEverPlayed] = useState(false)
  const [isInitializing, setIsInitializing] = useState(false)

  // Saved playback position (for modal open/close)
  const savedPlaybackPositionRef = useRef<number>(0) // Store last actual playback position

  // Track if we're currently preloading to prevent duplicate preload attempts
  const isPreloadingRef = useRef<boolean>(false)

  // Preview mode refs
  const audioRef = useRef<HTMLAudioElement>(null)

  // Spotify mode state
  const [spotifyDeviceId, setSpotifyDeviceId] = useState<string>('')
  const [spotifyPlayerState, setSpotifyPlayerState] = useState<Spotify.PlaybackState | null>(null)
  const spotifyPlayerRef = useRef<any>(null)
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Cleanup function for line monitoring
  const cleanupLineMonitoring = useCallback(() => {
    if (lineMonitorIntervalRef.current) {
      clearInterval(lineMonitorIntervalRef.current)
      lineMonitorIntervalRef.current = null
    }
    if (lineEndTimeoutRef.current) {
      clearTimeout(lineEndTimeoutRef.current)
      lineEndTimeoutRef.current = null
    }
    lineEndTimeRef.current = null
  }, [])

  // Notify parent of state changes
  useEffect(() => {
    if (onStateChange) {
      onStateChange({
        isPlaying,
        currentTime,
        duration,
        playbackMode,
        playbackRate
      })
    }
  }, [isPlaying, currentTime, duration, playbackMode, playbackRate, onStateChange])

  // Track song progress for authenticated users
  const lastProgressUpdateRef = useRef<number>(0)
  const maxProgressReachedRef = useRef<number>(0)

  useEffect(() => {
    if (!session?.user || duration === 0) return

    // Calculate progress percentage
    const progressPercent = (currentTime / duration) * 100

    // Track the maximum progress reached (don't go backwards if user seeks back)
    if (progressPercent > maxProgressReachedRef.current) {
      maxProgressReachedRef.current = progressPercent
    }

    // Only update every 10% or when reaching 90% threshold
    const shouldUpdate =
      maxProgressReachedRef.current >= 90 && lastProgressUpdateRef.current < 90 || // Hit 90% threshold
      Math.floor(maxProgressReachedRef.current / 10) > Math.floor(lastProgressUpdateRef.current / 10) // Every 10%

    if (shouldUpdate && isPlaying) {
      lastProgressUpdateRef.current = maxProgressReachedRef.current

      // Send progress update to API
      fetch(`/api/song/${track.id}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playProgress: maxProgressReachedRef.current })
      }).catch(err => console.error('Failed to update song progress:', err))
    }
  }, [currentTime, duration, isPlaying, session, track.id])

  // Reset progress tracking when track changes
  useEffect(() => {
    lastProgressUpdateRef.current = 0
    maxProgressReachedRef.current = 0
  }, [track.id])

  // This useEffect needs to be moved after playFromTime is defined
  // We'll move it later in the component

  // Apply playback rate to audio element
  useEffect(() => {
    if (playbackMode === 'preview' && audioRef.current) {
      audioRef.current.playbackRate = playbackRate
    }
  }, [playbackMode, playbackRate])

  // Provide playback rate change function to parent
  useEffect(() => {
    if (onPlaybackRateChange) {
      const handleRateChange = (rate: number) => {
        if (playbackMode === 'preview') {
          setPlaybackRate(rate)
        }
      }
      onPlaybackRateChange(handleRateChange)
    }
  }, [onPlaybackRateChange, playbackMode])

  // Preload track on mount or when track changes
  useEffect(() => {
    const preloadTrack = () => {
      // console.log('🎬 Preloading track:', {
      //   title: track?.title,
      //   playbackMode,
      //   hasSpotifyId: !!track?.spotifyId,
      //   hasPreviewUrl: !!track?.previewUrl,
      //   hasAudioElement: !!audioRef.current
      // })

      if (playbackMode === 'preview' && audioRef.current && track?.previewUrl) {
        // The audio element already has src set and preload="auto"
        // Just ensure it starts loading
        if (!audioRef.current.src || audioRef.current.src !== track.previewUrl) {
          audioRef.current.src = track.previewUrl
        }
        // Force the browser to start loading the audio
        audioRef.current.load()
        // console.log('✅ Preview track preloading initiated')
      } else if (playbackMode === 'spotify' && track?.spotifyId && spotifyPlayerRef.current) {
        // For Spotify, preload by playing then immediately pausing (with volume muted)
        const preloadSpotifyTrack = async () => {
          // Prevent duplicate preload attempts
          if (isPreloadingRef.current) {
            console.log('🎵 [Preload] Already preloading, skipping duplicate attempt')
            return
          }

          // Only preload if track hasn't been played yet
          if (hasEverPlayed) {
            console.log('🎵 [Preload] Track already loaded, skipping preload')
            return
          }

          isPreloadingRef.current = true

          try {
            console.log('🎵 [Preload] Starting Spotify track preload for:', track.title)

            // Step 1: Mute volume completely to prevent audible playback
            console.log('🔇 [Preload] Muting volume...')
            const savedVolume = volume
            const savedMuted = isMuted
            await spotifyPlayerRef.current.setVolume?.(0)

            // Step 2: Play the track (this loads it into the player)
            console.log('▶️ [Preload] Calling playTrack...')
            const trackUri = `spotify:track:${track.spotifyId}`
            const result = await spotifyPlayerRef.current.playTrack?.(trackUri)

            if (result === true) {
              console.log('✅ [Preload] PlayTrack succeeded, waiting for playback state...')
              setHasEverPlayed(true)

              // Step 3: Subscribe to state changes and pause when track starts playing
              console.log('👂 [Preload] Subscribing to state changes...')

              const unsubscribe = await new Promise<() => void>((resolve) => {
                let callbackFired = false

                const unsub = spotifyPlayerRef.current?.subscribeToStateChanges?.((state) => {
                  console.log('📊 [Preload] State change:', {
                    hasState: !!state,
                    paused: state?.paused,
                    hasTrack: !!state?.track_window?.current_track,
                    position: state?.position
                  })

                  if (state && !state.paused && state.track_window?.current_track) {
                    if (callbackFired) return // Only fire once
                    callbackFired = true

                    console.log('🎵 [Preload] Track is now playing, pausing immediately...')

                    // Pause the track
                    spotifyPlayerRef.current?.pause?.().then((pauseResult) => {
                      console.log('🛑 [Preload] Pause result:', pauseResult)
                      setIsPlaying(false)
                      console.log('⏸️ [Preload] Paused successfully, isPlaying set to false')

                      // Restore original volume
                      spotifyPlayerRef.current?.setVolume?.(savedMuted ? 0 : savedVolume).then(() => {
                        console.log('🔊 [Preload] Volume restored. Track ready for seeking/playback.')
                        resolve(unsub)
                      })
                    })
                  }
                })

                // Safety timeout in case state change never fires
                setTimeout(() => {
                  if (!callbackFired) {
                    console.log('⏱️ [Preload] Timeout reached, forcing pause...')
                    spotifyPlayerRef.current?.pause?.().then(() => {
                      setIsPlaying(false)
                      spotifyPlayerRef.current?.setVolume?.(savedMuted ? 0 : savedVolume)
                    })
                    resolve(unsub)
                  }
                }, 2000) // 2 second safety timeout
              })

              // Unsubscribe from state changes
              if (unsubscribe) {
                unsubscribe()
              }
            } else {
              console.log('⚠️ [Preload] PlayTrack returned:', result)
              // Restore volume even if preload failed
              await spotifyPlayerRef.current.setVolume?.(savedMuted ? 0 : savedVolume)
            }
          } catch (error) {
            console.error('❌ [Preload] Error preloading Spotify track:', error)
            // Restore volume on error
            await spotifyPlayerRef.current.setVolume?.(isMuted ? 0 : volume)
          } finally {
            // Reset the preloading flag
            isPreloadingRef.current = false
          }
        }

        preloadSpotifyTrack()
      }
    }

    if (track) {
      preloadTrack()
    }
  }, [track?.id, track?.previewUrl, track?.spotifyId, playbackMode])

  // Preview mode audio handling
  useEffect(() => {
    if (playbackMode !== 'preview' || !audioRef.current) return

    const audio = audioRef.current

    const handleLoadedMetadata = () => {
      setDuration(audio.duration)
      setError(null)
    }

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
    }

    const handleEnded = () => {
      console.log('🎵 Preview track ended, calling onSongComplete')
      setIsPlaying(false)
      setCurrentTime(0)
      onSongComplete?.()
    }

    const handleError = () => {
      setError('Unable to load audio preview')
      setIsLoading(false)
    }

    const handleLoadStart = () => setIsLoading(true)
    const handleCanPlay = () => {
      setIsLoading(false)
      setIsInitializing(false)
    }
    const handlePlaying = () => {
      setIsInitializing(false)
    }

    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('error', handleError)
    audio.addEventListener('loadstart', handleLoadStart)
    audio.addEventListener('canplay', handleCanPlay)
    audio.addEventListener('playing', handlePlaying)

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('error', handleError)
      audio.removeEventListener('loadstart', handleLoadStart)
      audio.removeEventListener('canplay', handleCanPlay)
      audio.removeEventListener('playing', handlePlaying)
    }
  }, [playbackMode, track.previewUrl, onSongComplete])

  // Spotify mode state handling
  useEffect(() => {
    if (spotifyPlayerState) {
      const isNowPlaying = !spotifyPlayerState.paused
      setIsPlaying(isNowPlaying)
      // Track if the song has ever been played
      if (isNowPlaying) {
        setHasEverPlayed(true)
      }
      setCurrentTime(spotifyPlayerState.position)
      setDuration(spotifyPlayerState.track_window.current_track ? spotifyPlayerState.track_window.current_track.duration_ms : 0)
    }
  }, [spotifyPlayerState])

  // Spotify progress timer - Poll actual player state instead of fixed increments
  useEffect(() => {
    // console.log('⏰ Progress timer effect:', {
    //   playbackMode,
    //   isPlaying,
    //   duration,
    //   hasSpotifyPlayer: !!spotifyPlayerRef.current,
    //   willStartPolling: playbackMode === 'spotify' && isPlaying && duration > 0 && spotifyPlayerRef.current
    // })

    if (playbackMode === 'spotify' && isPlaying && duration > 0 && spotifyPlayerRef.current) {
      // console.log('✅ Starting Spotify progress polling')
      progressTimerRef.current = setInterval(async () => {
        try {
          // Get actual player state from Spotify Web SDK
          const player = spotifyPlayerRef.current?.player
          if (player) {
            const state = await player.getCurrentState()
            if (state && !state.paused) {
              // Use actual position from Spotify (already in milliseconds)
              setCurrentTime(state.position)

              // Log when we're close to the end
              const remainingMs = state.duration - state.position
              if (remainingMs < 5000) {
                console.log('⏰ Approaching end of song:', {
                  position: state.position,
                  duration: state.duration,
                  remainingMs,
                  hasCallback: !!onSongComplete
                })
              }

              // Check if song has ended (position reached duration)
              // Increased tolerance to 2 seconds to catch the end before Spotify auto-advances
              if (state.position >= state.duration - 2000) {
                console.log('🎵 Spotify track ended, calling onSongComplete', {
                  position: state.position,
                  duration: state.duration,
                  hasCallback: !!onSongComplete
                })
                setIsPlaying(false)
                setCurrentTime(0)
                if (onSongComplete) {
                  console.log('🎉 Calling onSongComplete callback')
                  onSongComplete()
                } else {
                  console.warn('⚠️ No onSongComplete callback provided!')
                }
              }
            } else if (state && state.paused) {
              // Track is paused, update playing state
              setIsPlaying(false)
            }
          } else if (spotifyPlayerRef.current?.playerState) {
            // Fallback: Use last known player state
            // console.log('📍 Fallback position:', spotifyPlayerRef.current.playerState.position)
            setCurrentTime(spotifyPlayerRef.current.playerState.position)
          }
        } catch (error) {
          console.error('Error getting Spotify player state:', error)
          // Fallback to increment-based update if state fetch fails
          setCurrentTime(prev => {
            const increment = 1000 * playbackRate // Account for playback rate
            const newTime = prev + increment
            return newTime >= duration ? duration : newTime
          })
        }
      }, 250) // Poll every 250ms for smoother updates
    } else {
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current)
        progressTimerRef.current = null
      }
    }

    return () => {
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current)
        progressTimerRef.current = null
      }
    }
  }, [playbackMode, isPlaying, duration, playbackRate, onSongComplete])

  // Volume handling for both modes
  useEffect(() => {
    if (playbackMode === 'preview' && audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume
    }
    if (playbackMode === 'spotify' && spotifyPlayerRef.current) {
      spotifyPlayerRef.current.setVolume?.(isMuted ? 0 : volume)
    }
  }, [volume, isMuted, playbackMode])

  // Playback controls - using useCallback for stability
  const togglePlayPause = useCallback(async () => {
    // console.log('🔄 [togglePlayPause] START', {
    //   playbackMode,
    //   isPlaying,
    //   trackTitle: track?.title,
    //   hasAudioRef: !!audioRef.current,
    //   audioCurrentTime: audioRef.current?.currentTime,
    //   audioPaused: audioRef.current?.paused
    // })

    // Show mini-player immediately when play is first pressed
    if (!hasEverPlayed) {
      setHasEverPlayed(true)
    }

    if (playbackMode === 'preview' && audioRef.current) {
      try {
        if (isPlaying) {
          // console.log('⏸️ [togglePlayPause] Pausing preview audio')
          audioRef.current.pause()
          setIsPlaying(false)
          // console.log('✅ [togglePlayPause] Preview paused successfully')
        } else {
          // console.log('▶️ [togglePlayPause] Starting preview playback')
          // Switch button to pause immediately and show loading
          setIsPlaying(true)
          setIsInitializing(true)
          await audioRef.current.play()
          setIsInitializing(false)
          // console.log('✅ [togglePlayPause] Preview playing successfully')
        }
      } catch (error) {
        console.error('❌ [togglePlayPause] Preview playback error:', error)
        setError('Failed to play audio preview')
      }
    }

    if (playbackMode === 'spotify' && spotifyPlayerRef.current && track.spotifyId) {
      try {
        // Show mini-player immediately when play is first pressed
        if (!hasEverPlayed) {
          setHasEverPlayed(true)
        }

        if (!spotifyPlayerState) {
          // Start playback - switch button immediately
          setIsPlaying(true)
          setIsLoading(true)
          setIsInitializing(true)
          const trackUri = `spotify:track:${track.spotifyId}`
          const result = await spotifyPlayerRef.current.playTrack?.(trackUri)

          if (result === 'PREMIUM_REQUIRED') {
            setError('Spotify Premium required for full playback')
          } else if (result === 'DEVICE_NOT_READY') {
            setError('Spotify player is initializing... Please wait and try again')
          } else if (result === 'PLAYER_NOT_READY') {
            setError('Spotify player is connecting... Please wait and try again')
          } else if (result === false) {
            setError('Failed to start playback - device may not be active')
          } else {
            setError(null)
          }
          setIsLoading(false)
          setIsInitializing(false)
        } else {
          // Toggle existing playback - switch button immediately
          const newState = !isPlaying
          setIsPlaying(newState)
          await spotifyPlayerRef.current.togglePlayPause?.()
        }
      } catch (error) {
        console.error('Spotify playback error:', error)
        setError('Failed to control Spotify playback')
        setIsLoading(false)
      }
    }
  }, [playbackMode, isPlaying, track, spotifyPlayerState])

  // Store the toggle function in a ref for stable reference
  const togglePlayPauseRef = useRef(togglePlayPause)
  togglePlayPauseRef.current = togglePlayPause

  // Store line end monitoring state
  const lineEndTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lineEndTimeRef = useRef<number | null>(null)
  const lineMonitorIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Create a function to play from a specific time
  const playFromTime = useCallback(async (timeInMs: number) => {

    // For preview mode
    if (playbackMode === 'preview' && audioRef.current) {
      audioRef.current.currentTime = timeInMs / 1000 // Convert to seconds
      if (!isPlaying) {
        await audioRef.current.play()
        setIsPlaying(true)
      }
      return true
    }

    // For Spotify mode
    if (playbackMode === 'spotify' && spotifyPlayerRef.current && track.spotifyId) {
      // Check if we need to load the track
      // Use hasEverPlayed as more reliable indicator than spotifyPlayerState
      if (!hasEverPlayed || !spotifyPlayerState) {
        console.log('🎵 Track not loaded yet, loading and seeking to:', timeInMs)
        const trackUri = `spotify:track:${track.spotifyId}`
        const result = await spotifyPlayerRef.current.playTrack?.(trackUri)
        if (result !== true) {
          console.error('❌ Failed to load track')
          return false
        }

        // Mark as played
        setHasEverPlayed(true)

        // Wait for Spotify player to get the current state
        // This is more reliable than arbitrary delays
        return new Promise<boolean>((resolve) => {
          let attempts = 0
          const maxAttempts = 30 // 30 * 100ms = 3 second timeout

          const checkInterval = setInterval(async () => {
            attempts++

            // Try to get current state from the Spotify player
            try {
              const player = spotifyPlayerRef.current?.player
              if (player) {
                const state = await player.getCurrentState()
                if (state && state.track_window?.current_track) {
                  console.log('✅ Track loaded (via getCurrentState), seeking to:', timeInMs)
                  clearInterval(checkInterval)

                  // Now seek to the desired position
                  await spotifyPlayerRef.current.seek?.(timeInMs)
                  setIsPlaying(true)
                  resolve(true)
                  return
                }
              }
            } catch (error) {
              console.log('⏳ Waiting for track to load...', attempts)
            }

            if (attempts >= maxAttempts) {
              // Timeout - try to seek anyway as fallback
              console.warn('⚠️ Track load timeout after', attempts * 100, 'ms, seeking anyway to:', timeInMs)
              clearInterval(checkInterval)
              await spotifyPlayerRef.current.seek?.(timeInMs)
              setIsPlaying(true)
              resolve(true)
            }
          }, 100) // Check every 100ms
        })
      }

      // Track is already loaded, just seek immediately
      console.log('✅ Track already loaded, seeking to:', timeInMs)
      await spotifyPlayerRef.current.seek?.(timeInMs)

      // Ensure playback is active
      if (!isPlaying) {
        await spotifyPlayerRef.current.resume?.()
        setIsPlaying(true)
      }

      return true
    }

    return false
  }, [playbackMode, isPlaying, track, spotifyPlayerState, hasEverPlayed])

  // Helper function to get current time directly from source
  const getCurrentTimeDirectly = useCallback(() => {
    if (playbackModeRef.current === 'preview' && audioRef.current) {
      // For preview mode, get directly from audio element (in seconds)
      return audioRef.current.currentTime * 1000 // Convert to ms
    } else if (playbackModeRef.current === 'spotify' && spotifyPlayerRef.current) {
      // For Spotify, we need to get from the player state
      // Check if we can get the current state
      if (spotifyPlayerRef.current.getCurrentState) {
        // This is async but we need sync, so use the last known state
        return currentTimeRef.current // This is already in ms for Spotify
      }
    }
    return 0
  }, [])

  // Play a single line with automatic pause at end
  const playLine = useCallback(async (startTimeMs: number, endTimeMs: number) => {
    console.log('🎵 [playLine] Starting line playback', {
      startTimeMs,
      endTimeMs,
      duration: endTimeMs - startTimeMs,
      durationSec: ((endTimeMs - startTimeMs) / 1000).toFixed(2)
    })

    // Clear any existing line monitoring
    cleanupLineMonitoring()

    // Start playback from line start
    const success = await playFromTime(startTimeMs)
    if (!success) {
      console.error('❌ [playLine] Failed to start playback')
      return false
    }

    console.log('✅ [playLine] Playback started, setting up monitoring for end time:', endTimeMs)

    // Store the end time
    lineEndTimeRef.current = endTimeMs

    let checkCount = 0
    // Start monitoring playhead position
    lineMonitorIntervalRef.current = setInterval(() => {
      checkCount++

      // Get current time directly from the audio source
      let currentTimeMs = 0

      // Always check the actual audio element/player, not React state
      if (audioRef.current && playbackModeRef.current === 'preview') {
        currentTimeMs = audioRef.current.currentTime * 1000
      } else if (playbackModeRef.current === 'spotify') {
        // For Spotify, use the most recent currentTime from state
        // This gets updated by the Spotify state change handler
        currentTimeMs = currentTimeRef.current
      }

      // Log every 5 checks (250ms) for debugging
      if (checkCount % 5 === 0) {
        console.log('🔍 [playLine] Monitor check', {
          checkCount,
          currentTimeMs,
          currentTimeSec: (currentTimeMs / 1000).toFixed(2),
          targetEndMs: lineEndTimeRef.current,
          targetEndSec: lineEndTimeRef.current ? (lineEndTimeRef.current / 1000).toFixed(2) : 'none',
          remaining: lineEndTimeRef.current ? lineEndTimeRef.current - currentTimeMs : 0,
          remainingSec: lineEndTimeRef.current ? ((lineEndTimeRef.current - currentTimeMs) / 1000).toFixed(2) : '0'
        })
      }

      // Check if we've reached or passed the end time
      if (lineEndTimeRef.current && currentTimeMs >= lineEndTimeRef.current) {
        console.log('🛑 [playLine] Reached line end, pausing', {
          currentTimeMs,
          endTimeMs: lineEndTimeRef.current,
          overshoot: currentTimeMs - lineEndTimeRef.current,
          overshootMs: currentTimeMs - lineEndTimeRef.current
        })

        // Clear monitoring FIRST to prevent multiple triggers
        if (lineMonitorIntervalRef.current) {
          clearInterval(lineMonitorIntervalRef.current)
          lineMonitorIntervalRef.current = null
        }
        lineEndTimeRef.current = null

        // Now pause playback
        if (audioRef.current && playbackModeRef.current === 'preview') {
          // console.log('⏸️ Pausing preview audio', {
          //   audioElement: !!audioRef.current,
          //   isPaused: audioRef.current.paused,
          //   currentTime: audioRef.current.currentTime
          // })
          audioRef.current.pause()
          setIsPlaying(false)
          // console.log('✅ Preview audio paused', {
          //   isPaused: audioRef.current.paused
          // })
        } else if (spotifyPlayerRef.current && playbackModeRef.current === 'spotify') {
          // console.log('⏸️ Pausing Spotify')
          spotifyPlayerRef.current.pause?.()
          setIsPlaying(false)
        } else {
          // console.log('⚠️ No audio element to pause', {
          //   hasAudioRef: !!audioRef.current,
          //   hasSpotifyRef: !!spotifyPlayerRef.current,
          //   playbackMode: playbackModeRef.current
          // })
        }
      }
    }, 50) // Check every 50ms for accurate timing

    // console.log('✅ [playLine] Monitoring started')
    return true
  }, [playFromTime, getCurrentTimeDirectly, cleanupLineMonitoring])

  // Provide seek function to parent (including playFromTime)
  useEffect(() => {

    if (onTimeSeek) {
      const handleSeek = async (timeInMs: number) => {
        if (playbackMode === 'preview' && audioRef.current && duration > 0) {
          const timeInSeconds = Math.min(Math.max(0, timeInMs / 1000), duration)
          audioRef.current.currentTime = timeInSeconds
          setCurrentTime(timeInSeconds)
        }

        if (playbackMode === 'spotify' && spotifyPlayerRef.current) {
          // Check if track is loaded by checking if we have ever played
          // If not, we need to load it first by calling play(), then seek
          if (!hasEverPlayed || !spotifyPlayerState) {
            console.log('🎵 [seek] Track not loaded, loading first before seeking to:', timeInMs)
            const trackUri = `spotify:track:${track.spotifyId}`
            const result = await spotifyPlayerRef.current.playTrack?.(trackUri)
            if (result === true) {
              setHasEverPlayed(true)
              // Wait for track to load
              await new Promise(resolve => setTimeout(resolve, 500))
              // Now seek
              spotifyPlayerRef.current.seek?.(Math.floor(timeInMs))
            }
          } else {
            // Track already loaded, seek directly
            spotifyPlayerRef.current.seek?.(Math.floor(timeInMs))
          }
        }
      }

      // Pass both the seek function and playFromTime function
      onTimeSeek(handleSeek, playFromTime)
    }
  }, [onTimeSeek, playbackMode, duration, playFromTime, hasEverPlayed, spotifyPlayerState, track])

  // Cleanup line monitoring on unmount or when track changes
  useEffect(() => {
    return () => {
      cleanupLineMonitoring()
    }
  }, [track?.id, cleanupLineMonitoring])

  // Also cleanup when playback stops
  useEffect(() => {
    if (!isPlaying) {
      // Don't cleanup immediately - give it a moment in case it's just a pause/resume
      const cleanupTimeout = setTimeout(() => {
        if (!isPlayingRef.current) {
          // console.log('🧹 Cleaning up line monitoring (playback stopped)')
          cleanupLineMonitoring()
        }
      }, 1000)
      return () => clearTimeout(cleanupTimeout)
    }
  }, [isPlaying, cleanupLineMonitoring])

  // Provide play/pause function to parent
  useEffect(() => {
    if (onPlayPauseReady && typeof onPlayPauseReady === 'function') {
      // Create a stable wrapper that always calls the latest function
      const stableToggle = () => {
        togglePlayPauseRef.current()
      }
      onPlayPauseReady(stableToggle)
    }
  }, [onPlayPauseReady, playbackMode, track?.title])

  // NEW: Provide unified controls object to parent (ONCE, with stable functions using refs)
  const isPlayingRef = useRef(isPlaying)
  const currentTimeRef = useRef(currentTime)
  const durationRef = useRef(duration)
  const playbackRateRef = useRef(playbackRate)
  const playbackModeRef = useRef(playbackMode)

  // Keep refs up to date
  useEffect(() => { isPlayingRef.current = isPlaying }, [isPlaying])
  useEffect(() => { currentTimeRef.current = currentTime }, [currentTime])
  useEffect(() => { durationRef.current = duration }, [duration])
  useEffect(() => { playbackRateRef.current = playbackRate }, [playbackRate])
  useEffect(() => { playbackModeRef.current = playbackMode }, [playbackMode])

  useEffect(() => {
    if (onControlsReady) {
      // Create stable control functions that always use latest refs
      const controls: AudioPlayerControls = {
        play: async () => {
          if (!isPlayingRef.current) {
            await togglePlayPauseRef.current()
          }
        },
        pause: async () => {
          // Check the actual playing state, not just the ref
          let actuallyPlaying = false
          if (playbackModeRef.current === 'preview' && audioRef.current) {
            actuallyPlaying = !audioRef.current.paused
          } else if (playbackModeRef.current === 'spotify') {
            actuallyPlaying = isPlayingRef.current
          }

          // console.log('🛑 [EnhancedAudioPlayer] pause() called', {
          //   playbackMode: playbackModeRef.current,
          //   actuallyPlaying,
          //   isPlayingRef: isPlayingRef.current,
          //   willPause: actuallyPlaying
          // })

          if (actuallyPlaying) {
            // console.log('🔄 Audio is playing, calling togglePlayPauseRef.current() to pause')
            await togglePlayPauseRef.current()
            // console.log('✅ Pause completed')
          } else {
            // console.log('⚠️ Already paused, no action needed')
          }
        },
        togglePlayPause: async () => {
          await togglePlayPauseRef.current()
        },
        seek: async (timeInMs: number) => {
          // Clear any line monitoring when manually seeking
          cleanupLineMonitoring()

          if (playbackModeRef.current === 'preview' && audioRef.current) {
            audioRef.current.currentTime = timeInMs / 1000
            setCurrentTime(timeInMs / 1000)
          }
          if (playbackModeRef.current === 'spotify' && spotifyPlayerRef.current) {
            // Check if track is loaded by checking if we have ever played
            // If not, we need to load it first by calling play(), then seek
            if (!hasEverPlayed || !spotifyPlayerState) {
              console.log('🎵 [controls.seek] Track not loaded, loading first before seeking to:', timeInMs)
              const trackUri = `spotify:track:${track.spotifyId}`
              const result = await spotifyPlayerRef.current.playTrack?.(trackUri)
              if (result === true) {
                setHasEverPlayed(true)
                // Wait for track to load
                await new Promise(resolve => setTimeout(resolve, 500))
                // Now seek
                spotifyPlayerRef.current.seek?.(Math.floor(timeInMs))
              }
            } else {
              // Track already loaded, seek directly
              spotifyPlayerRef.current.seek?.(Math.floor(timeInMs))
            }
          }
        },
        playFromTime: async (timeInMs: number) => {
          return await playFromTime(timeInMs)
        },
        playLine: async (startTimeMs: number, endTimeMs: number) => {
          return await playLine(startTimeMs, endTimeMs)
        },
        setPlaybackRate: (rate: number) => {
          setPlaybackRate(rate)
          if (playbackModeRef.current === 'preview' && audioRef.current) {
            audioRef.current.playbackRate = rate
          }
        },
        getState: () => {
          // Get the actual current time and playing state from the audio source, not from React state
          let actualCurrentTime = 0
          let actualIsPlaying = false

          if (playbackModeRef.current === 'preview' && audioRef.current) {
            // For preview, get directly from audio element and convert to ms
            actualCurrentTime = audioRef.current.currentTime * 1000  // Convert seconds to ms
            actualIsPlaying = !audioRef.current.paused
          } else if (playbackModeRef.current === 'spotify') {
            // For Spotify, use refs which are already in ms
            actualCurrentTime = currentTimeRef.current  // already in ms
            actualIsPlaying = isPlayingRef.current
          }

          return {
            isPlaying: actualIsPlaying,
            currentTime: actualCurrentTime,  // Always in milliseconds
            duration: durationRef.current,
            playbackMode: playbackModeRef.current,
            playbackRate: playbackRateRef.current
          }
        },
        seekSilent: async (timeInMs: number) => {
          // Seek to position without playing - used for modal previews
          console.log('🔇 [seekSilent] Moving playhead to:', timeInMs, 'ms')

          if (playbackModeRef.current === 'preview' && audioRef.current) {
            audioRef.current.currentTime = timeInMs / 1000
            setCurrentTime(timeInMs / 1000)
          }

          if (playbackModeRef.current === 'spotify' && spotifyPlayerRef.current) {
            // Ensure track is loaded first (silently if needed)
            if (!hasEverPlayed || !spotifyPlayerState) {
              console.log('🎵 [seekSilent] Track not loaded, loading silently first')

              // Save current volume and mute to prevent audible playback
              const savedVolume = volume
              const savedMuted = isMuted
              await spotifyPlayerRef.current.setVolume?.(0)

              const trackUri = `spotify:track:${track.spotifyId}`
              const result = await spotifyPlayerRef.current.playTrack?.(trackUri)

              if (result === true) {
                setHasEverPlayed(true)
                // Pause as quickly as possible
                await new Promise(resolve => setTimeout(resolve, 50))
                await spotifyPlayerRef.current.pause?.()
                setIsPlaying(false)

                // Restore volume after pausing
                await spotifyPlayerRef.current.setVolume?.(savedMuted ? 0 : savedVolume)
                console.log('✅ [seekSilent] Track loaded silently and paused')
              } else {
                // Restore volume even if load failed
                await spotifyPlayerRef.current.setVolume?.(savedMuted ? 0 : savedVolume)
              }
            }

            // Now seek to the position
            await spotifyPlayerRef.current.seek?.(Math.floor(timeInMs))
            console.log('✅ [seekSilent] Playhead moved to:', timeInMs, 'ms (paused)')
          }
        },
        preload: async () => {
          // Preload track without playing
          console.log('🎬 [preload] Preloading track')

          if (playbackModeRef.current === 'preview' && audioRef.current && track?.previewUrl) {
            if (!audioRef.current.src || audioRef.current.src !== track.previewUrl) {
              audioRef.current.src = track.previewUrl
            }
            audioRef.current.load()
            return true
          }

          if (playbackModeRef.current === 'spotify' && spotifyPlayerRef.current && track?.spotifyId) {
            if (!hasEverPlayed) {
              try {
                console.log('🎵 [preload] Loading Spotify track')
                const trackUri = `spotify:track:${track.spotifyId}`
                const result = await spotifyPlayerRef.current.playTrack?.(trackUri)

                if (result === true) {
                  setHasEverPlayed(true)
                  await new Promise(resolve => setTimeout(resolve, 300))
                  await spotifyPlayerRef.current.pause?.()
                  console.log('✅ [preload] Track preloaded successfully')
                  return true
                }
              } catch (error) {
                console.error('❌ [preload] Error:', error)
                return false
              }
            }
            return true // Already preloaded
          }

          return false
        },
        savePlaybackPosition: () => {
          // Save current position for later restoration
          const state = controls.getState()
          savedPlaybackPositionRef.current = state.currentTime
          console.log('💾 [savePlaybackPosition] Saved position:', savedPlaybackPositionRef.current, 'ms')
        },
        restorePlaybackPosition: async () => {
          // Restore saved position
          const savedPos = savedPlaybackPositionRef.current
          console.log('🔄 [restorePlaybackPosition] Restoring position:', savedPos, 'ms')

          if (savedPos === 0) {
            // If saved position is 0:00, just seek to start silently
            await controls.seekSilent(0)
          } else {
            // Otherwise restore to saved position
            await controls.seekSilent(savedPos)
          }
        }
      }

      onControlsReady(controls)
    }
  }, [onControlsReady, playFromTime, playLine, hasEverPlayed, spotifyPlayerState, track]) // Include hasEverPlayed and spotifyPlayerState for seek logic

  const handleSeek = (value: number[]) => {
    const newTime = (value[0] / 100) * duration
    
    if (playbackMode === 'preview' && audioRef.current && duration > 0) {
      audioRef.current.currentTime = newTime
      setCurrentTime(newTime)
    }
    
    if (playbackMode === 'spotify' && spotifyPlayerRef.current) {
      // Spotify expects time in milliseconds
      spotifyPlayerRef.current.seek?.(Math.floor(newTime))
    }
  }

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0] / 100
    setVolume(newVolume)
    setIsMuted(newVolume === 0)
  }


  const toggleMute = () => setIsMuted(!isMuted)

  const formatTime = (time: number) => {
    if (!isFinite(time)) return '0:00'
    // Convert milliseconds to seconds for Spotify tracks
    const timeInSeconds = playbackMode === 'spotify' ? time / 1000 : time
    const minutes = Math.floor(timeInSeconds / 60)
    const seconds = Math.floor(timeInSeconds % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0

  // Handle Spotify player events
  const handleSpotifyPlayerReady = (deviceId: string) => {
    setSpotifyDeviceId(deviceId)
  }

  const handleSpotifyPlayerStateChange = (state: Spotify.PlaybackState | null) => {
    setSpotifyPlayerState(state)
  }

  // Sign in with Spotify
  const handleSpotifySignIn = () => {
    signIn('spotify')
  }

  // Don't show sign-in prompt anymore - just proceed with unavailable state

  // Render unavailable state
  if (playbackMode === 'unavailable') {
    return (
      <div className={`bg-muted/50 rounded-lg p-4 ${className}`}>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
            <Music className="w-6 h-6 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-sm">{track.title}</p>
            <p className="text-sm text-muted-foreground">{track.artist}</p>
            <p className="text-xs text-muted-foreground mt-1">
              No preview available for this song
            </p>
          </div>
          {track.spotifyUrl && (
            <Button variant="outline" size="sm" asChild>
              <a href={track.spotifyUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-3 h-3 mr-1" />
                Spotify
              </a>
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div
      className={`fixed left-4 right-4 border pt-4 px-4 pb-1 z-[60] transition-transform duration-300 ease-in-out backdrop-blur-lg rounded-[20px] shadow-xl ${
        hasEverPlayed ? 'bottom-4 translate-y-0' : 'bottom-4 translate-y-[calc(100%+32px)]'
      } ${className}`}
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.12)',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        boxShadow: 'rgba(0, 0, 0, 0.12) 0px 12px 28px'
      }}>
      {/* Spotify Web Player (hidden, only renders when authenticated) */}
      {playbackMode === 'spotify' && (
        <SpotifyWebPlayer
          ref={spotifyPlayerRef}
          track={track}
          onPlayerReady={handleSpotifyPlayerReady}
          onPlayerStateChange={handleSpotifyPlayerStateChange}
        />
      )}

      {/* Hidden audio element for preview mode */}
      {playbackMode === 'preview' && track.previewUrl && (
        <audio
          ref={audioRef}
          src={track.previewUrl}
          preload="auto"
        />
      )}
      
      {/* Track Info with Play Button */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center overflow-hidden">
          {track.albumArtSmall ? (
            <img
              src={track.albumArtSmall}
              alt={`${track.album || track.title} cover`}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
                e.currentTarget.nextElementSibling?.classList.remove('hidden')
              }}
            />
          ) : null}
          <Music className={`w-6 h-6 text-primary ${track.albumArtSmall ? 'hidden' : ''}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate text-white">{track.title}</p>
          <div className="flex items-center gap-2">
            <p className="text-sm truncate text-white/80">{track.artist}</p>
            {isInitializing && (
              <div className="flex gap-1">
                <span className="w-1 h-1 bg-white/60 rounded-full animate-pulse" />
                <span className="w-1 h-1 bg-white/60 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                <span className="w-1 h-1 bg-white/60 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
              </div>
            )}
          </div>
        </div>

        {/* Play/Pause button in upper right */}
        <Button
          variant="ghost"
          size="sm"
          onClick={togglePlayPause}
          disabled={isLoading}
          className="w-10 h-10 hover:bg-white/20"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.12)' }}
        >
          {isLoading || isInitializing ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : isPlaying ? (
            <Pause className="w-4 h-4 text-white" />
          ) : (
            <Play className="w-4 h-4 text-white" />
          )}
        </Button>
      </div>

      {/* Error State */}
      {error && (
        <div className="flex items-center gap-2 mb-4 p-3 bg-destructive/10 rounded-lg">
          <AlertCircle className="w-4 h-4 text-destructive" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Progress Bar */}
      <div className="mb-4">
        <Slider
          value={[progressPercentage]}
          onValueChange={handleSeek}
          max={100}
          step={0.1}
          className="w-full [&>span[data-orientation]]:h-1 [&>span[data-orientation]]:bg-white/[0.12] [&>span>span]:bg-white [&_[role=slider]]:bg-white [&_[role=slider]]:border-0 [&_[role=slider]]:rounded-full [&_[role=slider]]:shadow-md [&_[role=slider]]:w-3 [&_[role=slider]]:h-3"
          disabled={!duration}
        />
        <div className="flex justify-between text-xs text-white mt-1">
          <span>{formatTime(currentTime)}</span>
          {playbackMode === 'preview' && (
            <span className="text-white/60">30s Preview</span>
          )}
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Preview indicator */}
      {playbackMode === 'preview' && (
        <div className="flex items-center justify-center">
          <span className="text-xs text-white/60">30s preview</span>
        </div>
      )}

      {/* Spotify Premium Notice */}
      {playbackMode === 'spotify' && hasSpotifyError && (
        <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-orange-600" />
            <p className="text-sm text-orange-700">
              Full song playback requires Spotify Premium
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export type { AudioPlayerState }