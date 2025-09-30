'use client'

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'
import { AudioEngine } from '@/services/AudioEngine'
import type { Track } from '@/types/audio'

// Playback modes
export type PlaybackMode = 'spotify' | 'preview' | 'unavailable'

// Line end behaviors
export type LineEndBehavior = 'pause' | 'advance' | 'loop'

// Audio state interface
export interface AudioState {
  // Playback state
  isPlaying: boolean
  currentTime: number  // Always in milliseconds
  duration: number     // Always in milliseconds
  volume: number
  playbackRate: number

  // Track info
  currentTrack: Track | null
  playbackMode: PlaybackMode

  // Line playback state
  isPlayingLine: boolean
  currentLineIndex: number
  lineEndBehavior: LineEndBehavior

  // Loading states
  isLoading: boolean
  isBuffering: boolean

  // Error state
  error: string | null
}

// Audio commands interface
export interface AudioCommands {
  // Core controls
  play(): Promise<void>
  pause(): Promise<void>
  togglePlayPause(): Promise<void>
  seek(timeMs: number): Promise<void>

  // Advanced controls
  playFromTime(timeMs: number): Promise<void>
  playLine(lineIndex: number, startMs: number, endMs: number | undefined, behavior?: LineEndBehavior): Promise<void>
  stopLinePlayback(): void

  // Settings
  setVolume(volume: number): void
  setPlaybackRate(rate: number): void
  setLineEndBehavior(behavior: LineEndBehavior): void

  // Track management
  loadTrack(track: Track): Promise<void>
  unloadTrack(): void
}

// Context type
interface AudioContextType {
  state: AudioState
  commands: AudioCommands
}

// Create context
const AudioContext = createContext<AudioContextType | undefined>(undefined)

// Provider props
interface AudioProviderProps {
  children: React.ReactNode
}

// Initial state
const initialState: AudioState = {
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

// Audio Provider Component
export function AudioProvider({ children }: AudioProviderProps) {
  const [state, setState] = useState<AudioState>(initialState)
  const audioEngineRef = useRef<AudioEngine | null>(null)

  // Initialize audio engine
  useEffect(() => {
    audioEngineRef.current = new AudioEngine((newState) => {
      setState(newState)
    })

    // Cleanup on unmount
    return () => {
      audioEngineRef.current?.destroy()
    }
  }, [])

  // Command implementations
  const commands: AudioCommands = {
    play: useCallback(async () => {
      await audioEngineRef.current?.play()
    }, []),

    pause: useCallback(async () => {
      await audioEngineRef.current?.pause()
    }, []),

    togglePlayPause: useCallback(async () => {
      await audioEngineRef.current?.togglePlayPause()
    }, []),

    seek: useCallback(async (timeMs: number) => {
      await audioEngineRef.current?.seek(timeMs)
    }, []),

    playFromTime: useCallback(async (timeMs: number) => {
      await audioEngineRef.current?.playFromTime(timeMs)
    }, []),

    playLine: useCallback(async (
      lineIndex: number,
      startMs: number,
      endMs: number | undefined,
      behavior?: LineEndBehavior
    ) => {
      await audioEngineRef.current?.playLine(lineIndex, startMs, endMs, behavior)
    }, []),

    stopLinePlayback: useCallback(() => {
      audioEngineRef.current?.stopLinePlayback()
    }, []),

    setVolume: useCallback((volume: number) => {
      audioEngineRef.current?.setVolume(volume)
    }, []),

    setPlaybackRate: useCallback((rate: number) => {
      audioEngineRef.current?.setPlaybackRate(rate)
    }, []),

    setLineEndBehavior: useCallback((behavior: LineEndBehavior) => {
      audioEngineRef.current?.setLineEndBehavior(behavior)
    }, []),

    loadTrack: useCallback(async (track: Track) => {
      await audioEngineRef.current?.loadTrack(track)
    }, []),

    unloadTrack: useCallback(() => {
      audioEngineRef.current?.unloadTrack()
    }, [])
  }

  const value = {
    state,
    commands
  }

  return (
    <AudioContext.Provider value={value}>
      {children}
    </AudioContext.Provider>
  )
}

// Hook to use audio context
export function useAudio() {
  const context = useContext(AudioContext)
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider')
  }
  return context
}

// Export types
export type { AudioContextType, Track }