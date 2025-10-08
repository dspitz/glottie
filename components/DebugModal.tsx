'use client'

import { useState } from 'react'
import { Bug, X, ChevronRight, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface DebugInfo {
  level?: {
    fromUrl?: number | null
    fromData?: number | null
    effective?: number | null
  }
  levelSongs?: {
    fetched: boolean
    count: number
    songs?: Array<{ id: string; title: string; artist: string }>
  }
  navigation?: {
    currentSongId?: string
    currentIndex?: number
    prevSong?: { id: string; title: string; artist: string } | null
    nextSong?: { id: string; title: string; artist: string } | null
  }
  handlers?: {
    onPrevious: boolean
    onNext: boolean
    onPlayPause: boolean
  }
}

interface DebugModalProps {
  debugInfo: DebugInfo
}

export function DebugModal({ debugInfo }: DebugModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['level', 'navigation']))

  // Debug: Log that component is rendering
  // console.log('🐛 DebugModal component rendered')

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(section)) {
      newExpanded.delete(section)
    } else {
      newExpanded.add(section)
    }
    setExpandedSections(newExpanded)
  }

  const renderValue = (value: any): JSX.Element => {
    if (value === null) return <span className="text-orange-500">null</span>
    if (value === undefined) return <span className="text-red-500">undefined</span>
    if (typeof value === 'boolean') return <span className={value ? 'text-green-500' : 'text-red-500'}>{String(value)}</span>
    if (typeof value === 'number') return <span className="text-blue-500">{value}</span>
    if (typeof value === 'string') return <span className="text-purple-500">"{value}"</span>
    if (typeof value === 'object') return <span className="text-gray-500">{JSON.stringify(value, null, 2)}</span>
    return <span>{String(value)}</span>
  }

  return (
    <>
      {/* Bug Icon Button - Fixed position in header */}
      <div
        className="fixed top-5 right-5 z-[9999]"
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 9999,
          pointerEvents: 'auto'
        }}
      >
        <Button
          size="icon"
          variant="outline"
          onClick={() => setIsOpen(true)}
          className="bg-red-500 hover:bg-red-600 text-white rounded-full w-10 h-10 border-2 border-white shadow-lg"
          style={{ cursor: 'pointer' }}
          title="Debug Info"
        >
          <Bug className="h-5 w-5" />
        </Button>
      </div>

      {/* Debug Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bug className="h-5 w-5" />
              Navigation Debug Info
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 font-mono text-sm">
            {/* Level Information */}
            <div className="border rounded-lg p-3">
              <button
                onClick={() => toggleSection('level')}
                className="flex items-center gap-2 w-full text-left font-semibold mb-2"
              >
                {expandedSections.has('level') ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                Level Information
              </button>
              {expandedSections.has('level') && (
                <div className="space-y-1 pl-6">
                  <div>From URL: {renderValue(debugInfo.level?.fromUrl)}</div>
                  <div>From Song Data: {renderValue(debugInfo.level?.fromData)}</div>
                  <div className="font-semibold">
                    Effective Level: {renderValue(debugInfo.level?.effective)}
                    {!debugInfo.level?.effective && <span className="text-red-500 ml-2">⚠️ No level detected!</span>}
                  </div>
                </div>
              )}
            </div>

            {/* Level Songs */}
            <div className="border rounded-lg p-3">
              <button
                onClick={() => toggleSection('songs')}
                className="flex items-center gap-2 w-full text-left font-semibold mb-2"
              >
                {expandedSections.has('songs') ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                Level Songs ({debugInfo.levelSongs?.count || 0} songs)
              </button>
              {expandedSections.has('songs') && (
                <div className="space-y-1 pl-6">
                  <div>Fetched: {renderValue(debugInfo.levelSongs?.fetched)}</div>
                  <div>Count: {renderValue(debugInfo.levelSongs?.count)}</div>
                  {debugInfo.levelSongs?.songs && debugInfo.levelSongs.songs.length > 0 && (
                    <div className="mt-2">
                      <div className="text-xs text-muted-foreground mb-1">Songs in level:</div>
                      <div className="space-y-1 text-xs max-h-40 overflow-y-auto border rounded p-2">
                        {debugInfo.levelSongs.songs.map((song, idx) => (
                          <div key={song.id} className={song.id === debugInfo.navigation?.currentSongId ? 'text-green-500 font-semibold' : ''}>
                            {idx + 1}. {song.title} - {song.artist}
                            {song.id === debugInfo.navigation?.currentSongId && ' ← Current'}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Navigation State */}
            <div className="border rounded-lg p-3">
              <button
                onClick={() => toggleSection('navigation')}
                className="flex items-center gap-2 w-full text-left font-semibold mb-2"
              >
                {expandedSections.has('navigation') ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                Navigation State
              </button>
              {expandedSections.has('navigation') && (
                <div className="space-y-1 pl-6">
                  <div>Current Song ID: {renderValue(debugInfo.navigation?.currentSongId)}</div>
                  <div>Current Index: {renderValue(debugInfo.navigation?.currentIndex)}</div>
                  <div className="mt-2 space-y-2">
                    <div className="border-l-2 border-blue-500 pl-2">
                      <div className="font-semibold">Previous Song:</div>
                      {debugInfo.navigation?.prevSong ? (
                        <div className="text-xs">
                          {debugInfo.navigation.prevSong.title} - {debugInfo.navigation.prevSong.artist}
                        </div>
                      ) : (
                        <div className="text-red-500">None (at beginning)</div>
                      )}
                    </div>
                    <div className="border-l-2 border-green-500 pl-2">
                      <div className="font-semibold">Next Song:</div>
                      {debugInfo.navigation?.nextSong ? (
                        <div className="text-xs">
                          {debugInfo.navigation.nextSong.title} - {debugInfo.navigation.nextSong.artist}
                        </div>
                      ) : (
                        <div className="text-red-500">None (at end)</div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Handlers */}
            <div className="border rounded-lg p-3">
              <button
                onClick={() => toggleSection('handlers')}
                className="flex items-center gap-2 w-full text-left font-semibold mb-2"
              >
                {expandedSections.has('handlers') ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                Handler Functions
              </button>
              {expandedSections.has('handlers') && (
                <div className="space-y-1 pl-6">
                  <div>onPrevious: {renderValue(debugInfo.handlers?.onPrevious)}</div>
                  <div>onNext: {renderValue(debugInfo.handlers?.onNext)}</div>
                  <div>onPlayPause: {renderValue(debugInfo.handlers?.onPlayPause)}</div>
                </div>
              )}
            </div>

            {/* Diagnosis */}
            <div className="border border-yellow-500 rounded-lg p-3 bg-yellow-50 dark:bg-yellow-950">
              <div className="font-semibold mb-2">🔍 Diagnosis:</div>
              <div className="space-y-1 text-xs">
                {!debugInfo.level?.effective && (
                  <div className="text-red-600">• No effective level - songs cannot be fetched</div>
                )}
                {debugInfo.level?.effective && !debugInfo.levelSongs?.fetched && (
                  <div className="text-orange-600">• Level detected but songs not fetched</div>
                )}
                {debugInfo.levelSongs?.fetched && debugInfo.levelSongs.count === 0 && (
                  <div className="text-orange-600">• No songs found for level {debugInfo.level?.effective}</div>
                )}
                {debugInfo.navigation?.currentIndex === -1 && (
                  <div className="text-red-600">• Current song not found in level songs list</div>
                )}
                {!debugInfo.handlers?.onPrevious && !debugInfo.handlers?.onNext && (
                  <div className="text-red-600">• Navigation handlers not connected to buttons</div>
                )}
                {debugInfo.handlers?.onPrevious && debugInfo.handlers?.onNext && (
                  <div className="text-green-600">✓ Navigation should be working!</div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}