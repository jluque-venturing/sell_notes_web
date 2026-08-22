import { createSign } from 'node:crypto'

const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const SCOPE = 'https://www.googleapis.com/auth/spreadsheets'

function b64url(input: string | Buffer) {
  return Buffer.from(input).toString('base64url')
}

async function getAccessToken() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  // Vercel stores the key with literal \n sequences instead of real newlines
  const key = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n')
  if (!email || !key) throw new Error('Faltan GOOGLE_SERVICE_ACCOUNT_EMAIL o GOOGLE_PRIVATE_KEY')

  const now = Math.floor(Date.now() / 1000)
  const claims = {
    iss: email,
    scope: SCOPE,
    aud: TOKEN_URL,
    iat: now,
    exp: now + 3600,
  }

  const unsigned = `${b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))}.${b64url(JSON.stringify(claims))}`
  const signature = createSign('RSA-SHA256').update(unsigned).sign(key)
  const assertion = `${unsigned}.${signature.toString('base64url')}`

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  })

  if (!res.ok) throw new Error(`Google OAuth ${res.status}: ${await res.text()}`)
  const json = (await res.json()) as { access_token: string }
  return json.access_token
}

export async function appendToSheet(rows: (string | number)[][]) {
  const spreadsheetId = process.env.GOOGLE_SHEET_ID
  if (!spreadsheetId) throw new Error('Falta GOOGLE_SHEET_ID')
  const range = process.env.GOOGLE_SHEET_RANGE ?? 'A:F'

  const token = await getAccessToken()
  const url =
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}` +
    `/values/${encodeURIComponent(range)}:append` +
    `?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`

  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ values: rows }),
  })

  if (!res.ok) throw new Error(`Sheets ${res.status}: ${await res.text()}`)
  return (await res.json()) as {
    tableRange?: string
    updates?: { updatedRows?: number; updatedRange?: string }
  }
}
