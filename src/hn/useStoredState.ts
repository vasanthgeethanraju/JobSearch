import { useState, useEffect } from 'react'

// useState that survives reloads. Storage can be unavailable (private mode), so failures fall back to in-memory.
export function useStoredState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key)
      if (!stored) return initial
      const parsed = JSON.parse(stored)
      // Merge objects so newly added fields get their defaults
      return typeof initial === 'object' && initial !== null && !Array.isArray(initial)
        ? { ...initial, ...parsed }
        : parsed
    } catch {
      return initial
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // ignore — state still works for this session
    }
  }, [key, value])

  return [value, setValue] as const
}
