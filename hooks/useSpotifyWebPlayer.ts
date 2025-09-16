'use client'

import { useContext, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { SpotifyPlayerContext } from '@/app/providers'

export function useSpotifyWebPlayer() {
  const { data: session } = useSession()
  const playerRef = useContext(SpotifyPlayerContext)

  const playTrack = useCallback(async (spotifyId: string) => {
    if (!playerRef?.current || !spotifyId) {
      console.log('[useSpotifyWebPlayer] Missing playerRef or spotifyId')
      return false
    }

    const trackUri = `spotify:track:${spotifyId}`
    console.log('[useSpotifyWebPlayer] Playing track:', trackUri)

    try {
      const result = await playerRef.current.playTrack(trackUri)

      if (result === 'PREMIUM_REQUIRED') {
        console.warn('[useSpotifyWebPlayer] Premium account required for playback')
        alert('A Spotify Premium account is required for full song playback.')
        return false
      }

      if (result === 'PLAYER_NOT_READY') {
        console.warn('[useSpotifyWebPlayer] Player not ready yet')
        alert('Spotify player is initializing. Please try again in a moment.')
        return false
      }

      return result
    } catch (error) {
      console.error('[useSpotifyWebPlayer] Error playing track:', error)
      return false
    }
  }, [playerRef])

  const togglePlayPause = useCallback(async () => {
    if (!playerRef?.current) {
      console.log('[useSpotifyWebPlayer] No playerRef available')
      return false
    }

    try {
      return await playerRef.current.togglePlayPause()
    } catch (error) {
      console.error('[useSpotifyWebPlayer] Error toggling playback:', error)
      return false
    }
  }, [playerRef])

  const seek = useCallback(async (positionMs: number) => {
    if (!playerRef?.current) {
      return false
    }

    try {
      return await playerRef.current.seek(positionMs)
    } catch (error) {
      console.error('[useSpotifyWebPlayer] Error seeking:', error)
      return false
    }
  }, [playerRef])

  const setVolume = useCallback(async (volume: number) => {
    if (!playerRef?.current) {
      return false
    }

    try {
      return await playerRef.current.setVolume(volume)
    } catch (error) {
      console.error('[useSpotifyWebPlayer] Error setting volume:', error)
      return false
    }
  }, [playerRef])

  return {
    isAuthenticated: !!session?.accessToken,
    isReady: playerRef?.current?.isReady || false,
    playTrack,
    togglePlayPause,
    seek,
    setVolume,
    playerState: playerRef?.current?.playerState || null
  }
}