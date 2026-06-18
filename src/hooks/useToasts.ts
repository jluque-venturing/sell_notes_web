import { useCallback, useEffect, useState } from 'react'
import { registerToastFn } from '../lib/errorLog'

export interface Toast {
  id: string
  message: string
}

const DURATION_MS = 5000

export function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((message: string) => {
    const id = crypto.randomUUID()
    setToasts((prev) => [...prev, { id, message }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, DURATION_MS)
  }, [])

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  useEffect(() => {
    registerToastFn(addToast)
  }, [addToast])

  return { toasts, dismiss }
}
