'use client'

import React, { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'

interface AudioWaveformProps {
  isPlaying: boolean
  bars?: number
  className?: string
  audioElement?: HTMLAudioElement | null
}

/**
 * Audio-reactive waveform visualization
 * Uses Web Audio API to analyze real audio frequency data
 * Falls back to simulated animation if audio element not provided
 */
export function AudioWaveform({
  isPlaying,
  bars = 24,
  className = '',
  audioElement = null
}: AudioWaveformProps) {
  const [heights, setHeights] = useState<number[]>(
    Array(bars).fill(0).map(() => 0.15)
  )
  const analyserRef = useRef<AnalyserNode | null>(null)
  const dataArrayRef = useRef<Uint8Array | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  // Set up Web Audio API analyzer
  useEffect(() => {
    if (!audioElement || !isPlaying) {
      // Clean up
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      analyserRef.current = null
      dataArrayRef.current = null

      if (!isPlaying) {
        setHeights(Array(bars).fill(0).map(() => 0.15))
      }
      return
    }

    try {
      // Create audio context and analyzer
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const source = audioContext.createMediaElementSource(audioElement)
      const analyser = audioContext.createAnalyser()

      analyser.fftSize = 64 // Small FFT for performance
      const bufferLength = analyser.frequencyBinCount
      const dataArray = new Uint8Array(bufferLength)

      source.connect(analyser)
      analyser.connect(audioContext.destination)

      analyserRef.current = analyser
      dataArrayRef.current = dataArray

      // Analyze audio and update bars
      const updateWaveform = () => {
        if (!analyserRef.current || !dataArrayRef.current) return

        analyserRef.current.getByteFrequencyData(dataArrayRef.current)

        // Map frequency data to bar heights
        const newHeights = Array(bars).fill(0).map((_, i) => {
          // Sample frequency bins evenly across the spectrum
          const binIndex = Math.floor((i / bars) * dataArrayRef.current!.length)
          const value = dataArrayRef.current![binIndex] / 255 // Normalize to 0-1

          // Scale and clamp
          return Math.max(0.15, Math.min(1, value * 1.2))
        })

        setHeights(newHeights)
        animationFrameRef.current = requestAnimationFrame(updateWaveform)
      }

      updateWaveform()

      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current)
        }
        audioContext.close()
      }
    } catch (error) {
      console.warn('Web Audio API not available, falling back to simulated animation')
      // Fall back to simulated animation
    }
  }, [audioElement, isPlaying, bars])

  // Fallback simulated animation if Web Audio API fails or no audio element
  useEffect(() => {
    if (!isPlaying || audioElement || analyserRef.current) {
      return
    }

    // Simulate animation
    const interval = setInterval(() => {
      setHeights(prev => prev.map((_, i) => {
        const baseHeight = 0.3
        const variation = Math.random() * 0.4
        const waveEffect = Math.sin(Date.now() / 200 + i * 0.5) * 0.2
        return Math.max(0.1, Math.min(1, baseHeight + variation + waveEffect))
      }))
    }, 100)

    return () => clearInterval(interval)
  }, [isPlaying, bars, audioElement])

  return (
    <div
      className={`absolute inset-0 flex items-center justify-center gap-[2px] pointer-events-none overflow-hidden ${className}`}
      style={{
        opacity: isPlaying ? 0.15 : 0.05,
        transition: 'opacity 0.3s ease-in-out',
      }}
    >
      {heights.map((height, i) => (
        <motion.div
          key={i}
          className="flex-1 bg-black rounded-full"
          animate={{
            height: `${height * 100}%`,
            opacity: isPlaying ? 0.6 : 0.3
          }}
          transition={{
            height: { duration: 0.15, ease: 'easeOut' },
            opacity: { duration: 0.3 }
          }}
          style={{
            minWidth: '2px',
            maxWidth: '4px',
          }}
        />
      ))}
    </div>
  )
}
