import type { Toast } from '../hooks/useToasts'

interface Props {
  toasts: Toast[]
  onDismiss: (id: string) => void
}

export function ToastContainer({ toasts, onDismiss }: Props) {
  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="bg-red-700 border border-red-500 text-white text-sm font-semibold rounded-2xl px-4 py-3 shadow-xl flex items-start gap-3 pointer-events-auto animate-in slide-in-from-bottom-2 duration-200"
        >
          <span className="flex-1">{t.message}</span>
          <button
            onClick={() => onDismiss(t.id)}
            className="text-red-200 hover:text-white active:scale-90 transition-all duration-100 text-lg leading-none flex-shrink-0"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}
