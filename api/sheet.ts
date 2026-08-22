import type { VercelRequest, VercelResponse } from '@vercel/node'
import { checkSecret, readCloseId } from './_lib/auth'
import { getDayClose, patchDayClose } from './_lib/supabase'
import { appendToSheet } from './_lib/google'
import { sheetRow } from './_lib/format'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Usá POST' })
  if (!checkSecret(req, res)) return

  const closeId = readCloseId(req, res)
  if (!closeId) return

  try {
    const close = await getDayClose(closeId)
    if (!close) return res.status(404).json({ error: 'No existe ese cierre' })

    if (close.sheet_synced_at) {
      return res.status(409).json({
        error: 'Ese cierre ya se cargó al Sheet',
        synced_at: close.sheet_synced_at,
      })
    }

    const reviewed = close.reviewed_snapshot
    if (!reviewed) {
      return res.status(400).json({ error: 'Ese cierre todavía no fue revisado' })
    }

    const approved = reviewed
      .filter((s) => s.ok)
      .sort((a, b) => a.sale_number - b.sale_number)

    if (!approved.length) {
      return res.status(400).json({ error: 'No hay ninguna venta tildada como correcta' })
    }

    const rows = approved.map((s) => sheetRow(s, close.close_date))
    const result = await appendToSheet(rows)

    await patchDayClose(closeId, {
      sheet_synced_at: new Date().toISOString(),
      sheet_rows_added: rows.length,
    })

    return res.status(200).json({
      rows_added: rows.length,
      skipped: reviewed.length - approved.length,
      range: result.updates?.updatedRange ?? null,
    })
  } catch (err) {
    console.error('[sheet]', err)
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Error desconocido' })
  }
}
