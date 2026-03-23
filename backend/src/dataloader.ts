/**
 * Dataloader — initialise l'admin au premier démarrage.
 *
 * Les credentials initiaux sont définis ici.
 * Pour réinitialiser l'admin : supprimer backend/data/admin.json
 */

import * as fs from 'fs'
import * as path from 'path'
import * as bcrypt from 'bcryptjs'

const DATA_DIR = path.join(__dirname, '..', 'data')
const ADMIN_FILE = path.join(DATA_DIR, 'admin.json')

// ─── Credentials initiaux — MODIFIER avant le premier déploiement ─────────────
const INITIAL_ADMIN = {
  identifier: 'admin',
  initialPassword: 'Admin@2024',
}
// ──────────────────────────────────────────────────────────────────────────────

export interface AdminRecord {
  identifier: string
  passwordHash: string
}

/** Crée l'admin dans data/admin.json s'il n'existe pas encore. */
export async function seedAdmin(): Promise<void> {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
  if (fs.existsSync(ADMIN_FILE)) return

  const passwordHash = await bcrypt.hash(INITIAL_ADMIN.initialPassword, 12)
  const record: AdminRecord = {
    identifier: INITIAL_ADMIN.identifier,
    passwordHash,
  }
  fs.writeFileSync(ADMIN_FILE, JSON.stringify(record, null, 2), 'utf-8')
  console.log(`[dataloader] Admin "${INITIAL_ADMIN.identifier}" créé avec succès.`)
  console.log(`[dataloader] Pensez à changer le mot de passe depuis le panneau admin.`)
}

export function getAdmin(): AdminRecord | null {
  if (!fs.existsSync(ADMIN_FILE)) return null
  return JSON.parse(fs.readFileSync(ADMIN_FILE, 'utf-8')) as AdminRecord
}

export async function updateAdminPassword(newPassword: string): Promise<void> {
  const admin = getAdmin()
  if (!admin) throw new Error('Admin introuvable')
  admin.passwordHash = await bcrypt.hash(newPassword, 12)
  fs.writeFileSync(ADMIN_FILE, JSON.stringify(admin, null, 2), 'utf-8')
}
