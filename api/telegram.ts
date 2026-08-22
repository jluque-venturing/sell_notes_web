import type { VercelRequest, VercelResponse } from '@vercel/node'
import { checkSecret, readCloseId } from './_lib/auth'
import { getDayClose, patchDayClose, type DayCloseRow } from './_lib/supabase'
import { fechaAR, horaAR, money, mpOf, efectivoOf, paymentLabel } from './_lib/format'

function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function buildMessage(close: DayCloseRow) {
  const items = (close.sales_snapshot ?? [])
    .slice()
    .sort((a, b) => a.sale_number - b.sale_number)

  let totalMp = 0
  let totalEf = 0
  const byProduct: Record<string, { u: number; m: number }> = {}

  const lines = [
    '🧾 <b>Cierre del día</b>',
    '━━━━━━━━━━━━━━━',
    `📅 <b>${fechaAR(close.close_date)}</b> · ${items.length} venta${items.length !== 1 ? 's' : ''}`,
    '',
  ]

  for (const s of items) {
    const mp = mpOf(s)
    const ef = efectivoOf(s)
    totalMp += mp
    totalEf += ef
    byProduct[s.product_label] = byProduct[s.product_label] ?? { u: 0, m: 0 }
    byProduct[s.product_label].u += s.quantity_value
    byProduct[s.product_label].m += s.amount

    const icon = s.payment_type === 'mp' ? '🟠' : s.payment_type === 'efectivo' ? '💵' : '⚠️'
    lines.push(
      `${icon} <b>#${s.sale_number}</b> ${escapeHtml(s.product_label)} · ` +
      `${escapeHtml(s.quantity_label)} · <b>${money(s.amount)}</b> · ${paymentLabel(s)}` +
      (s.sold_at ? ` · ${horaAR(s.sold_at)}` : '')
    )
  }

  if (!items.length) lines.push('<i>No se registraron ventas.</i>')

  lines.push('', '━━━━━━━━━━━━━━━')
  lines.push(`🟠 Naranja X: <b>${money(totalMp)}</b>`)
  lines.push(`💵 Efectivo: <b>${money(totalEf)}</b>`)
  lines.push(`💰 TOTAL: <b>${money(totalMp + totalEf)}</b>`)

  const products = Object.entries(byProduct)
  if (products.length) {
    lines.push('')
    for (const [label, v] of products) {
      lines.push(`   · ${escapeHtml(label)}: ${v.u}u = ${money(v.m)}`)
    }
  }

  lines.push('')
  lines.push(`🏦 Efectivo en caja: <b>${money(Number(close.total_cash) || 0)}</b>`)
  lines.push(`🔁 Cambio que queda: <b>${money(Number(close.change_amount) || 0)}</b>`)
  lines.push(`👤 Lleva el tesorero: <b>${money(Number(close.treasurer_amount) || 0)}</b>`)

  if (close.comments) {
    lines.push('', `📝 <i>${escapeHtml(String(close.comments).trim())}</i>`)
  }

  lines.push('', '⏳ <i>Pendiente de que lo revises y confirmes en la app.</i>')

  return lines.join('\n')
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Usá POST' })
  if (!checkSecret(req, res)) return

  const closeId = readCloseId(req, res)
  if (!closeId) return

  const token = process.env.TELEGRAM_TOKEN
  const rawIds = process.env.TELEGRAM_CHAT_IDS
  if (!token || !rawIds) {
    return res.status(500).json({ error: 'Faltan TELEGRAM_TOKEN o TELEGRAM_CHAT_IDS' })
  }

  try {
    const close = await getDayClose(closeId)
    if (!close) return res.status(404).json({ error: 'No existe ese cierre' })

    const text = buildMessage(close)
    const ids = rawIds.split(',').map((s) => s.trim()).filter(Boolean)

    const results = await Promise.allSettled(
      ids.map(async (chat_id) => {
        const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id, text, parse_mode: 'HTML' }),
        })
        if (!r.ok) throw new Error(`chat ${chat_id}: ${await r.text()}`)
      })
    )

    const failed = results.filter((r) => r.status === 'rejected')
    const sent = results.length - failed.length

    if (sent > 0) {
      await patchDayClose(closeId, { telegram_sent_at: new Date().toISOString() })
    }

    if (failed.length) {
      console.error('[telegram] fallaron chats:', failed.map((f) => (f as PromiseRejectedResult).reason))
    }

    return res.status(sent > 0 ? 200 : 502).json({ sent, failed: failed.length })
  } catch (err) {
    console.error('[telegram]', err)
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Error desconocido' })
  }
}
