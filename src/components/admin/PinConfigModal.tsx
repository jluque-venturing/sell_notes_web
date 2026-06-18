import { useState } from 'react'

interface Props {
  onClose: () => void
}

export function PinConfigModal({ onClose }: Props) {
  const [pinInput, setPinInput] = useState('')
  const [saved, setSaved] = useState(false)

  function save() {
    if (pinInput.length !== 4 || !/^\d{4}$/.test(pinInput)) return
    localStorage.setItem('admin_pin', pinInput)
    setSaved(true)
    setTimeout(() => { setSaved(false); onClose() }, 1500)
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-3xl w-full max-w-xs p-6 shadow-2xl">
        <h2 className="text-center font-bold text-gray-100 text-lg mb-1">Cambiar PIN</h2>
        <p className="text-center text-sm text-gray-500 mb-5">Nuevo PIN de 4 dígitos para el admin</p>

        <input
          type="password"
          inputMode="numeric"
          maxLength={4}
          placeholder="Nuevo PIN"
          value={pinInput}
          onChange={(e) => setPinInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
          className="w-full bg-gray-700 border-2 border-gray-600 rounded-xl px-4 py-4 text-2xl font-mono tracking-[0.5em] text-gray-100 placeholder:text-gray-600 text-center focus:outline-none focus:border-orange-500 mb-4"
        />

        {saved && <p className="text-sm text-center text-emerald-400 font-semibold mb-3">PIN actualizado</p>}

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border-2 border-gray-600 text-gray-400 font-semibold active:scale-95 transition-all duration-100">
            Cancelar
          </button>
          <button
            onClick={save}
            disabled={pinInput.length !== 4}
            className="flex-1 py-3 rounded-xl bg-orange-500 text-white font-bold active:scale-95 transition-all duration-100 disabled:opacity-40"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  )
}
