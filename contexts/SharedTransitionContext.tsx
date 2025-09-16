'use client'

import React, { createContext, useContext, useState } from 'react'

interface SharedTransitionContextType {
  isExiting: boolean
  setIsExiting: (value: boolean) => void
}

const SharedTransitionContext = createContext<SharedTransitionContextType | undefined>(undefined)

export function SharedTransitionProvider({ children }: { children: React.ReactNode }) {
  const [isExiting, setIsExiting] = useState(false)

  return (
    <SharedTransitionContext.Provider value={{ isExiting, setIsExiting }}>
      {children}
    </SharedTransitionContext.Provider>
  )
}

export function useSharedTransition() {
  const context = useContext(SharedTransitionContext)
  if (!context) {
    throw new Error('useSharedTransition must be used within a SharedTransitionProvider')
  }
  return context
}

export const getSharedElementTransition = (isExiting: boolean) => ({
  type: "spring" as const,
  stiffness: 600,
  damping: isExiting ? 40 : 30
})