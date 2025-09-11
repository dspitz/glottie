'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  SkipBack, 
  SkipForward,
  ExternalLink,
  Music,
  AlertCircle
} from 'lucide-react'

interface Track {
  id: string
  title: string
  artist: string
  album?: string
  spotifyUrl?: string
  previewUrl?: string
  albumArt?: string
  albumArtSmall?: string
}

interface AudioPlayerProps {
  track: Track
  className?: string
}

export function AudioPlayer({ track, className = '' }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasPreview, setHasPreview] = useState(false)
  
  const audioRef = useRef<HTMLAudioElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleLoadedMetadata = () => {
      setDuration(audio.duration)
      setHasPreview(true)
      setError(null)
    }

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
    }

    const handleEnded = () => {
      setIsPlaying(false)
      setCurrentTime(0)
    }

    const handleError = (e: any) => {
      console.error('Audio playback error:', e)
      setError('Unable to load audio preview')
      setIsLoading(false)
      setHasPreview(false)
    }

    const handleLoadStart = () => {
      setIsLoading(true)
    }

    const handleCanPlay = () => {
      setIsLoading(false)
    }

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
  }, [track.previewUrl])

  useEffect(() => {
    const audio = audioRef.current
    if (audio) {
      audio.volume = isMuted ? 0 : volume
    }
  }, [volume, isMuted])

  const togglePlayPause = async () => {
    const audio = audioRef.current
    if (!audio || !track.previewUrl) return

    try {
      if (isPlaying) {
        audio.pause()
        setIsPlaying(false)
      } else {
        await audio.play()
        setIsPlaying(true)
      }
    } catch (error) {
      console.error('Playback error:', error)
      setError('Failed to play audio')
    }
  }

  const handleSeek = (value: number[]) => {
    const audio = audioRef.current
    if (audio && duration > 0) {
      const newTime = (value[0] / 100) * duration
      audio.currentTime = newTime
      setCurrentTime(newTime)
    }
  }

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0] / 100
    setVolume(newVolume)
    setIsMuted(newVolume === 0)
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
  }

  const formatTime = (time: number) => {
    if (!isFinite(time)) return '0:00'
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0

  if (!track.previewUrl && !track.spotifyUrl) {
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
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-background border rounded-lg p-4 ${className}`}>
      {/* Hidden audio element */}
      {track.previewUrl && (
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
                // Fallback to music icon if image fails to load
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
        {track.spotifyUrl && (
          <Button
            variant="outline"
            size="sm"
            asChild
            className="shrink-0"
          >
            <a
              href={track.spotifyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1"
            >
              <ExternalLink className="w-3 h-3" />
              Spotify
            </a>
          </Button>
        )}
      </div>

      {/* Error State */}
      {error && (
        <div className="flex items-center gap-2 mb-4 p-3 bg-destructive/10 rounded-lg">
          <AlertCircle className="w-4 h-4 text-destructive" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Preview Available */}
      {track.previewUrl && !error && (
        <>
          {/* Progress Bar */}
          <div className="mb-4">
            <Slider
              value={[progressPercentage]}
              onValueChange={handleSeek}
              max={100}
              step={0.1}
              className="w-full"
              disabled={!hasPreview}
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>{formatTime(currentTime)}</span>
              <span className="text-orange-600">
                {hasPreview ? 'Preview' : 'Loading...'}
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
                disabled={!hasPreview || isLoading}
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
              
              {hasPreview && (
                <span className="text-xs text-muted-foreground">
                  30s preview
                </span>
              )}
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
        </>
      )}

      {/* No Preview Available */}
      {!track.previewUrl && track.spotifyUrl && (
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground mb-3">
            No preview available. Listen on Spotify:
          </p>
          <Button asChild>
            <a
              href={track.spotifyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              Open in Spotify
            </a>
          </Button>
        </div>
      )}
    </div>
  )
}