import type { VercelRequest, VercelResponse } from '@vercel/node'

/**
 * The app has no user login, so this shared secret only stops drive-by
 * requests — it ships inside the browser bundle. The real safety net is that
 * both endpoints accept a close_id and read everything else from Supabase,
 * so a caller cannot inject arbitrary rows.
 */
export function checkSecret(req: VercelRequest, res: VercelResponse): boolean {
  const expected = process.env.APP_SECRET
  if (!expected) {
    res.status(500).json({ error: 'Falta configurar APP_SECRET en el servidor' })
    return false
  }
  if (req.headers['x-app-secret'] !== expected) {
    res.status(401).json({ error: 'No autorizado' })
    return false
  }
  return true
}

export function readCloseId(req: VercelRequest, res: VercelResponse): string | null {
  const body = (typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body) ?? {}
  const id = body.close_id
  if (typeof id !== 'string' || !id) {
    res.status(400).json({ error: 'Falta close_id' })
    return null
  }
  return id
}
