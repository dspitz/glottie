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
  playFromTime: (timeInMs: number) => Promise<boolean>
  playLine: (startTimeMs: number, endTimeMs: number) => Promise<boolean>
  setPlaybackRate: (rate: number) => void
  getState: () => AudioPlayerState
}

interface EnhancedAudioPlayerProps {
  track: Track
  className?: string
  onStateChange?: (state: AudioPlayerState) => void
  onControlsReady?: (controls: AudioPlayerControls) => void
  // Legacy callbacks - will be deprecated
  onTimeSeek?: (seekFn: (time: number) => void, playFromTimeFn?: (time: number) => Promise<boolean>) => void
  onPlaybackRateChange?: (changeFn: (rate: number) => void) => void
  onPlayPauseReady?: (fn: () => void) => void
}

type PlaybackMode = 'preview' | 'spotify' | 'unavailable'

export function EnhancedAudioPlayer({ track, className = '', onStateChange, onControlsReady, onTimeSeek, onPlaybackRateChange, onPlayPauseReady }: EnhancedAudioPlayerProps) {
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
  }, [isPlaying, currentTime, duration, playbackMode, onStateChange])

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
      } else if (playbackMode === 'spotify' && track?.spotifyId) {
        // For Spotify, we'll load on first interaction
        // console.log('🎵 Spotify track will load on first interaction')
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
      setIsPlaying(false)
      setCurrentTime(0)
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
  }, [playbackMode, track.previewUrl])

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

  // Smooth progress updates for Spotify playback
  useEffect(() => {
    if (playbackMode === 'spotify' && isPlaying && duration > 0) {
      progressTimerRef.current = setInterval(() => {
        setCurrentTime(prev => {
          const newTime = prev + 1000 // Increment by 1 second
          return newTime >= duration ? duration : newTime
        })
      }, 1000)
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
  }, [playbackMode, isPlaying, duration])

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
      // If track isn't loaded, load it first
      if (!spotifyPlayerState) {
        // console.log('🎵 Track not loaded, loading now...')
        const trackUri = `spotify:track:${track.spotifyId}`
        const result = await spotifyPlayerRef.current.playTrack?.(trackUri)
        if (result !== true) {
          return false
        }
        // Small delay for track to initialize (only when loading)
        await new Promise(resolve => setTimeout(resolve, 100))
        // Track is now loaded and playing, seek to position
        await spotifyPlayerRef.current.seek?.(timeInMs)
        // Playback should already be active after playTrack
        setIsPlaying(true)
        return true
      }

      // Track is already loaded, just seek immediately
      // console.log('✅ Track already loaded, seeking immediately')
      await spotifyPlayerRef.current.seek?.(timeInMs)

      // Ensure playback is active
      if (!isPlaying) {
        await spotifyPlayerRef.current.resume?.()
        // No delay needed when track is already loaded
        setIsPlaying(true)
      }

      return true
    }

    return false
  }, [playbackMode, isPlaying, track, spotifyPlayerState])

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
    // console.log('🎵 [playLine] Starting line playback', {
    //   startTimeMs,
    //   endTimeMs,
    //   duration: endTimeMs - startTimeMs,
    //   durationSec: ((endTimeMs - startTimeMs) / 1000).toFixed(2)
    // })

    // Clear any existing line monitoring
    cleanupLineMonitoring()

    // Start playback from line start
    const success = await playFromTime(startTimeMs)
    if (!success) {
      console.error('❌ [playLine] Failed to start playback')
      return false
    }

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

      // Log every 10 checks (500ms) for debugging
      if (checkCount % 10 === 0) {
        // console.log('🔍 [playLine] Monitor check', {
        //   checkCount,
        //   currentTimeMs,
        //   currentTimeSec: (currentTimeMs / 1000).toFixed(2),
        //   targetEndMs: lineEndTimeRef.current,
        //   targetEndSec: lineEndTimeRef.current ? (lineEndTimeRef.current / 1000).toFixed(2) : 'none',
        //   remaining: lineEndTimeRef.current ? lineEndTimeRef.current - currentTimeMs : 0,
        //   remainingSec: lineEndTimeRef.current ? ((lineEndTimeRef.current - currentTimeMs) / 1000).toFixed(2) : '0'
        // })
      }

      // Check if we've reached or passed the end time
      if (lineEndTimeRef.current && currentTimeMs >= lineEndTimeRef.current) {
        // console.log('🛑 [playLine] Reached line end, pausing', {
        //   currentTimeMs,
        //   endTimeMs: lineEndTimeRef.current,
        //   overshoot: currentTimeMs - lineEndTimeRef.current,
        //   overshootMs: currentTimeMs - lineEndTimeRef.current
        // })

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
      const handleSeek = (timeInMs: number) => {
        if (playbackMode === 'preview' && audioRef.current && duration > 0) {
          const timeInSeconds = Math.min(Math.max(0, timeInMs / 1000), duration)
          audioRef.current.currentTime = timeInSeconds
          setCurrentTime(timeInSeconds)
        }

        if (playbackMode === 'spotify' && spotifyPlayerRef.current) {
          spotifyPlayerRef.current.seek?.(Math.floor(timeInMs))
        }
      }

      // Pass both the seek function and playFromTime function
      onTimeSeek(handleSeek, playFromTime)
    }
  }, [onTimeSeek, playbackMode, duration, playFromTime])

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
        seek: (timeInMs: number) => {
          // Clear any line monitoring when manually seeking
          cleanupLineMonitoring()

          if (playbackModeRef.current === 'preview' && audioRef.current) {
            audioRef.current.currentTime = timeInMs / 1000
            setCurrentTime(timeInMs / 1000)
          }
          if (playbackModeRef.current === 'spotify' && spotifyPlayerRef.current) {
            spotifyPlayerRef.current.seek?.(Math.floor(timeInMs))
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
            // For preview, get directly from audio element
            actualCurrentTime = audioRef.current.currentTime  // in seconds
            actualIsPlaying = !audioRef.current.paused
          } else if (playbackModeRef.current === 'spotify') {
            // For Spotify, use refs which are more up-to-date than state
            actualCurrentTime = currentTimeRef.current  // already in ms
            actualIsPlaying = isPlayingRef.current
          }

          return {
            isPlaying: actualIsPlaying,
            currentTime: actualCurrentTime,
            duration: durationRef.current,
            playbackMode: playbackModeRef.current,
            playbackRate: playbackRateRef.current
          }
        }
      }

      onControlsReady(controls)
    }
  }, [onControlsReady, playFromTime, playLine]) // Only depend on the callback and playFromTime

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
      className={`fixed left-0 right-0 border-t px-5 py-4 z-[60] transition-transform duration-300 ease-in-out backdrop-blur-lg ${
        hasEverPlayed ? 'bottom-0 translate-y-0' : 'bottom-0 translate-y-full'
      } ${className}`}
      style={{ backgroundColor: 'rgba(255, 255, 255, 0.12)', borderTopColor: 'rgba(255, 255, 255, 0.2)' }}>
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

      {/* Speed control moved to translation modal */}

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