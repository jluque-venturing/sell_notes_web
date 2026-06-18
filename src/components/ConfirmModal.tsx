import type { ReactNode } from 'react'

interface Props {
  message: ReactNode
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmModal({ message, onConfirm, onCancel }: Props) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-3xl w-full max-w-xs p-6 shadow-2xl">
        <p className="text-gray-100 text-center text-base font-semibold mb-6">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl border-2 border-gray-600 text-gray-400 font-semibold active:scale-95 transition-all duration-100"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 rounded-xl bg-red-600 text-white font-bold active:scale-95 transition-all duration-100"
          >
            Borrar
          </button>
        </div>
      </div>
    </div>
  )
}
