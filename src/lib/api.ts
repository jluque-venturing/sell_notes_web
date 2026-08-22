const SECRET = import.meta.env.VITE_APP_SECRET as string | undefined

async function post(path: string, closeId: string) {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-app-secret': SECRET ?? '' },
    body: JSON.stringify({ close_id: closeId }),
  })

  const json = await res.json().catch(() => ({}) as Record<string, unknown>)
  if (!res.ok) throw new Error(String(json.error ?? `Error ${res.status}`))
  return json as Record<string, unknown>
}

export function notifyTelegram(closeId: string) {
  return post('/api/telegram', closeId)
}

export function syncToSheet(closeId: string) {
  return post('/api/sheet', closeId)
}
