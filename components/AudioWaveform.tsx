'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

interface AudioWaveformProps {
  isPlaying: boolean
  bars?: number
  className?: string
}

/**
 * Subtle animated audio waveform visualization
 * Designed to be used as a background layer
 */
export function AudioWaveform({
  isPlaying,
  bars = 24,
  className = ''
}: AudioWaveformProps) {
  const [heights, setHeights] = useState<number[]>(
    Array(bars).fill(0).map(() => Math.random() * 0.3 + 0.2)
  )

  useEffect(() => {
    if (!isPlaying) {
      // Fade to minimal heights when not playing
      setHeights(Array(bars).fill(0).map(() => 0.15))
      return
    }

    // Animate bars while playing
    const interval = setInterval(() => {
      setHeights(prev => prev.map((_, i) => {
        // Create wave-like pattern
        const baseHeight = 0.3
        const variation = Math.random() * 0.4
        const waveEffect = Math.sin(Date.now() / 200 + i * 0.5) * 0.2
        return Math.max(0.1, Math.min(1, baseHeight + variation + waveEffect))
      }))
    }, 100)

    return () => clearInterval(interval)
  }, [isPlaying, bars])

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
