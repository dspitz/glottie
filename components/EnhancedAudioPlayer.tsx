'use client'

import React, { useState, useRef, useEffect } from 'react'
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

interface AudioPlayerState {
  isPlaying: boolean
  currentTime: number
  duration: number
  playbackMode: 'preview' | 'spotify' | 'unavailable'
}

interface EnhancedAudioPlayerProps {
  track: Track
  className?: string
  onStateChange?: (state: AudioPlayerState) => void
  onTimeSeek?: (time: number) => void
}

type PlaybackMode = 'preview' | 'spotify' | 'unavailable'

export function EnhancedAudioPlayer({ track, className = '', onStateChange, onTimeSeek }: EnhancedAudioPlayerProps) {
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
        playbackMode
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
    const handleCanPlay = () => setIsLoading(false)

    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('error', handleError)
    audio.addEventListener('loadstart', handleLoadStart)
    audio.addEventListener('canplay', handleCanPlay)

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('error', handleError)
      audio.removeEventListener('loadstart', handleLoadStart)
      audio.removeEventListener('canplay', handleCanPlay)
    }
  }, [playbackMode, track.previewUrl])

  // Spotify mode state handling
  useEffect(() => {
    if (spotifyPlayerState) {
      setIsPlaying(!spotifyPlayerState.paused)
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

  // Playback controls
  const togglePlayPause = async () => {
    if (playbackMode === 'preview' && audioRef.current) {
      try {
        if (isPlaying) {
          audioRef.current.pause()
          setIsPlaying(false)
        } else {
          await audioRef.current.play()
          setIsPlaying(true)
        }
      } catch (error) {
        console.error('Preview playback error:', error)
        setError('Failed to play audio preview')
      }
    }

    if (playbackMode === 'spotify' && spotifyPlayerRef.current && track.spotifyId) {
      try {
        if (!spotifyPlayerState) {
          // Start playback
          setIsLoading(true)
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
        } else {
          // Toggle existing playback
          await spotifyPlayerRef.current.togglePlayPause?.()
        }
      } catch (error) {
        console.error('Spotify playback error:', error)
        setError('Failed to control Spotify playback')
        setIsLoading(false)
      }
    }
  }

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

  // Render sign-in prompt for unauthenticated users
  if (!isAuthenticated && track.spotifyId && !track.previewUrl) {
    return (
      <div className={`bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6 ${className}`}>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center">
            <Crown className="w-8 h-8 text-green-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-1">Sign in for Full Songs</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Connect your Spotify account to play complete tracks with premium quality audio.
            </p>
            <Button onClick={handleSpotifySignIn} className="bg-green-600 hover:bg-green-700">
              <LogIn className="w-4 h-4 mr-2" />
              Sign in with Spotify
            </Button>
          </div>
        </div>
      </div>
    )
  }

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
    <div className={`bg-background border rounded-lg p-4 ${className}`}>
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
      
      {/* Track Info */}
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
          <p className="font-medium text-sm truncate">{track.title}</p>
          <p className="text-sm text-muted-foreground truncate">{track.artist}</p>
          {track.album && (
            <p className="text-xs text-muted-foreground truncate">{track.album}</p>
          )}
        </div>
        
        {/* Playback mode indicator */}
        <div className="flex items-center gap-2">
          {playbackMode === 'spotify' && (
            <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
              <Crown className="w-3 h-3" />
              Full Song
            </div>
          )}
          {playbackMode === 'preview' && (
            <div className="flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs">
              <Shield className="w-3 h-3" />
              Preview
            </div>
          )}
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
          className="w-full"
          disabled={!duration}
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>{formatTime(currentTime)}</span>
          <span className={playbackMode === 'preview' ? 'text-orange-600' : 'text-green-600'}>
            {playbackMode === 'preview' ? '30s Preview' : 'Full Song'}
          </span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={togglePlayPause}
            disabled={isLoading}
            className="w-10 h-10"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
          </Button>
          
          <span className="text-xs text-muted-foreground">
            {playbackMode === 'preview' ? '30s preview' : 'Full track'}
          </span>
        </div>

        {/* Volume Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleMute}
            className="w-8 h-8 p-0"
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </Button>
          <Slider
            value={[isMuted ? 0 : volume * 100]}
            onValueChange={handleVolumeChange}
            max={100}
            step={1}
            className="w-20"
          />
        </div>
      </div>

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