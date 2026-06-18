import { supabase } from './supabase'

type ToastFn = (message: string) => void
let _showToast: ToastFn | null = null

export function registerToastFn(fn: ToastFn) {
  _showToast = fn
}

export async function logError(context: string, error: unknown) {
  const message =
    error instanceof Error ? error.message
    : typeof error === 'object' && error !== null && 'message' in error
      ? String((error as Record<string, unknown>).message)
      : String(error)

  _showToast?.(`${context}: ${message}`)

  try {
    await supabase.from('error_logs').insert({ context, message })
  } catch {
    // never throw from the error logger itself
  }
}
