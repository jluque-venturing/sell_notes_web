import { useState } from 'react'

interface Props {
  onSuccess: () => void
  onConfigAccess: () => void
  onCancel: () => void
}

const DEFAULT_PIN = '0000'
const CONFIG_CODE = '2577'

export function AdminGate({ onSuccess, onConfigAccess, onCancel }: Props) {
  const [input, setInput] = useState('')
  const [error, setError] = useState(false)

  const storedPin = localStorage.getItem('admin_pin') ?? DEFAULT_PIN

  function handleDigit(d: string) {
    if (input.length >= 4) return
    const next = input + d
    setInput(next)
    setError(false)
    if (next.length === 4) {
      if (next === CONFIG_CODE) {
        onConfigAccess()
      } else if (next === storedPin) {
        onSuccess()
      } else {
        setError(true)
        setTimeout(() => { setInput(''); setError(false) }, 600)
      }
    }
  }

  function handleBackspace() {
    setInput((p) => p.slice(0, -1))
    setError(false)
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-3xl w-full max-w-xs p-6 shadow-2xl">
        <h2 className="text-center font-bold text-gray-100 text-lg mb-2">Admin</h2>
        <p className="text-center text-sm text-gray-500 mb-5">Ingresá el PIN de 4 dígitos</p>

        <div className={`flex justify-center gap-3 mb-6 transition-all duration-150 ${error ? 'shake' : ''}`}>
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full border-2 transition-all duration-100 ${
                input.length > i
                  ? error ? 'bg-red-500 border-red-500' : 'bg-orange-500 border-orange-500'
                  : 'border-gray-600'
              }`}
            />
          ))}
        </div>

        <div className="grid grid-cols-3 gap-3">
          {['1','2','3','4','5','6','7','8','9'].map((d) => (
            <button key={d} onClick={() => handleDigit(d)}
              className="h-14 rounded-2xl bg-gray-700 text-xl font-semibold text-gray-100 active:scale-90 active:bg-gray-600 transition-all duration-100">
              {d}
            </button>
          ))}
          <button onClick={onCancel} className="h-14 rounded-2xl bg-gray-700 text-sm text-gray-500 active:scale-90 active:bg-gray-600 transition-all duration-100">
            Cancelar
          </button>
          <button onClick={() => handleDigit('0')} className="h-14 rounded-2xl bg-gray-700 text-xl font-semibold text-gray-100 active:scale-90 active:bg-gray-600 transition-all duration-100">
            0
          </button>
          <button onClick={handleBackspace} className="h-14 rounded-2xl bg-gray-700 text-xl text-gray-400 active:scale-90 active:bg-gray-600 transition-all duration-100">
            ⌫
          </button>
        </div>
      </div>
    </div>
  )
}
