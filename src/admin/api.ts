/** Client HTTP pour les routes admin du backend. */

const BASE = '/api/admin'

function authHeader(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` }
}

async function handleError(res: Response): Promise<never> {
  let message = `Erreur ${res.status}`
  try {
    const body = await res.json()
    if (body.error) message = body.error
  } catch { /* ignore */ }
  throw new Error(message)
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export async function apiLogin(identifier: string, password: string): Promise<string> {
  const res = await fetch(`${BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, password }),
  })
  if (!res.ok) await handleError(res)
  const { token } = await res.json() as { token: string }
  return token
}

// ─── Backups ──────────────────────────────────────────────────────────────────

export interface BackupInfo {
  filename: string
  size: number
  createdAt: string
}

export async function apiListBackups(token: string): Promise<BackupInfo[]> {
  const res = await fetch(`${BASE}/backups`, { headers: authHeader(token) })
  if (!res.ok) await handleError(res)
  return res.json() as Promise<BackupInfo[]>
}

export async function apiUploadBackup(
  token: string,
  encryptedBlob: Blob
): Promise<{ filename: string }> {
  const form = new FormData()
  form.append('backup', encryptedBlob, 'backup.wbkp')
  const res = await fetch(`${BASE}/backups`, {
    method: 'POST',
    headers: authHeader(token),
    body: form,
  })
  if (!res.ok) await handleError(res)
  return res.json() as Promise<{ filename: string }>
}

export async function apiDownloadBackup(
  token: string,
  filename: string
): Promise<ArrayBuffer> {
  const res = await fetch(`${BASE}/backups/${encodeURIComponent(filename)}`, {
    headers: authHeader(token),
  })
  if (!res.ok) await handleError(res)
  return res.arrayBuffer()
}

export async function apiDeleteBackup(token: string, filename: string): Promise<void> {
  const res = await fetch(`${BASE}/backups/${encodeURIComponent(filename)}`, {
    method: 'DELETE',
    headers: authHeader(token),
  })
  if (!res.ok) await handleError(res)
}

export async function apiUpdatePassword(token: string, newPassword: string): Promise<void> {
  const res = await fetch(`${BASE}/password`, {
    method: 'PUT',
    headers: { ...authHeader(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ newPassword }),
  })
  if (!res.ok) await handleError(res)
}
