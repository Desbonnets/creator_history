/**
 * Session admin stockée en sessionStorage.
 * Durée de vie : onglet / fenêtre du navigateur.
 * Le mot de passe est conservé pour le chiffrement/déchiffrement des backups.
 */

const SESSION_KEY = 'wb_admin_session'

export interface AdminSession {
  identifier: string
  password: string
  token: string
}

export function getSession(): AdminSession | null {
  const raw = sessionStorage.getItem(SESSION_KEY)
  return raw ? (JSON.parse(raw) as AdminSession) : null
}

export function setSession(session: AdminSession): void {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export function clearSession(): void {
  sessionStorage.removeItem(SESSION_KEY)
}
