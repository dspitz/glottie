import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
})

// API client functions
export async function fetchLevels() {
  const response = await fetch('/api/levels')
  if (!response.ok) {
    throw new Error('Failed to fetch levels')
  }
  return response.json()
}

export async function fetchLyrics(trackId: string) {
  const response = await fetch(`/api/lyrics/${trackId}`)
  if (!response.ok) {
    throw new Error('Failed to fetch lyrics')
  }
  const data = await response.json()
  console.log('🔍 fetchLyrics response:', {
    hasSynchronized: !!data.synchronized,
    synchronizedFormat: data.synchronized?.format,
    synchronizedLines: data.synchronized?.lines?.length,
    firstLine: data.synchronized?.lines?.[0]
  })
  return data
}

export async function translateText(text: string, targetLang: string = 'en') {
  const response = await fetch('/api/translate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text, targetLang }),
  })
  
  if (!response.ok) {
    throw new Error('Failed to translate text')
  }
  
  return response.json()
}

export async function defineWord(word: string, lang: string = 'es') {
  const response = await fetch('/api/define', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ word, lang }),
  })
  
  if (!response.ok) {
    throw new Error('Failed to define word')
  }
  
  return response.json()
}