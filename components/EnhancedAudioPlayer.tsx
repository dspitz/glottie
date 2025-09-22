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

interface EnhancedAudioPlayerProps {
  track: Track
  className?: string
  onStateChange?: (state: AudioPlayerState) => void
  onTimeSeek?: (seekFn: (time: number) => void) => void
  onPlaybackRateChange?: (changeFn: (rate: number) => void) => void
  onPlayPauseReady?: (fn: () => void) => void
}

type PlaybackMode = 'preview' | 'spotify' | 'unavailable'

export function EnhancedAudioPlayer({ track, className = '', onStateChange, onTimeSeek, onPlaybackRateChange, onPlayPauseReady }: EnhancedAudioPlayerProps) {
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

  // Handle external time seek requests
  useEffect(() => {
    if (onTimeSeek) {
      const handleSeek = (timeInMs: number) => {
        if (playbackMode === 'preview' && audioRef.current && duration > 0) {
          const timeInSeconds = timeInMs / 1000
          audioRef.current.currentTime = timeInSeconds
          setCurrentTime(timeInSeconds)
        }
        
        if (playbackMode === 'spotify' && spotifyPlayerRef.current) {
          spotifyPlayerRef.current.seek?.(Math.floor(timeInMs))
        }
      }
      
      // Provide the seek function to parent
      onTimeSeek(handleSeek)
    }
  }, [onTimeSeek, playbackMode, duration])

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
    console.log('togglePlayPause called', { playbackMode, isPlaying, track })

    // Show mini-player immediately when play is first pressed
    if (!hasEverPlayed) {
      setHasEverPlayed(true)
    }

    if (playbackMode === 'preview' && audioRef.current) {
      try {
        if (isPlaying) {
          audioRef.current.pause()
          setIsPlaying(false)
        } else {
          // Switch button to pause immediately and show loading
          setIsPlaying(true)
          setIsInitializing(true)
          await audioRef.current.play()
          setIsInitializing(false)
        }
      } catch (error) {
        console.error('Preview playback error:', error)
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

  // Provide play/pause function to parent
  useEffect(() => {
    console.log('🔷 EnhancedAudioPlayer: onPlayPauseReady effect triggered', {
      hasCallback: !!onPlayPauseReady,
      callbackType: typeof onPlayPauseReady,
      playbackMode,
      track: track?.title
    })
    if (onPlayPauseReady && typeof onPlayPauseReady === 'function') {
      // Create a stable wrapper that always calls the latest function
      const stableToggle = () => {
        console.log('🎯 EnhancedAudioPlayer: Stable toggle wrapper called')
        togglePlayPauseRef.current()
      }
      console.log('🔷 EnhancedAudioPlayer: Calling onPlayPauseReady with stable toggle')
      onPlayPauseReady(stableToggle)
      console.log('✅ EnhancedAudioPlayer: Stable toggle passed to parent')
    } else {
      console.log('⚠️ EnhancedAudioPlayer: No onPlayPauseReady callback provided')
    }
  }, [onPlayPauseReady, playbackMode, track?.title]) // Include minimal deps for logging

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
          preload="metadata"
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