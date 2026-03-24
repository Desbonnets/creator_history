import { Router } from 'express'
import * as bcrypt from 'bcryptjs'
import multer from 'multer'
import * as fs from 'fs'
import * as path from 'path'
import { getAdmin, updateAdminPassword, updateAdminIdentifier } from '../dataloader'
import { signToken, requireAuth } from '../auth'

const router = Router()

// ─── Dossier de stockage des backups ─────────────────────────────────────────
const BACKUPS_DIR = path.join(__dirname, '..', '..', 'backups')
if (!fs.existsSync(BACKUPS_DIR)) fs.mkdirSync(BACKUPS_DIR, { recursive: true })

const storage = multer.diskStorage({
  destination: BACKUPS_DIR,
  filename: (_req, _file, cb) => {
    const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    cb(null, `backup_${ts}.wbkp`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB max
  fileFilter: (_req, file, cb) => {
    if (file.originalname.endsWith('.wbkp')) cb(null, true)
    else cb(new Error('Format invalide, attendu .wbkp'))
  },
})

// ─── POST /api/admin/login ────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { identifier, password } = req.body as { identifier?: string; password?: string }

  if (!identifier || !password) {
    res.status(400).json({ error: 'Identifiant et mot de passe requis' })
    return
  }

  const admin = getAdmin()
  if (!admin || admin.identifier !== identifier) {
    res.status(401).json({ error: 'Identifiant ou mot de passe incorrect' })
    return
  }

  const valid = await bcrypt.compare(password, admin.passwordHash)
  if (!valid) {
    res.status(401).json({ error: 'Identifiant ou mot de passe incorrect' })
    return
  }

  res.json({ token: signToken(identifier) })
})

// ─── GET /api/admin/backups ───────────────────────────────────────────────────
router.get('/backups', requireAuth, (_req, res) => {
  const files = fs.readdirSync(BACKUPS_DIR)
    .filter(f => f.endsWith('.wbkp'))
    .map(f => {
      const stat = fs.statSync(path.join(BACKUPS_DIR, f))
      return {
        filename: f,
        size: stat.size,
        createdAt: stat.birthtime.toISOString(),
      }
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  res.json(files)
})

// ─── POST /api/admin/backups ──────────────────────────────────────────────────
router.post('/backups', requireAuth, upload.single('backup'), (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'Fichier manquant' })
    return
  }
  res.json({ filename: req.file.filename, size: req.file.size })
})

// ─── GET /api/admin/backups/:filename ─────────────────────────────────────────
router.get('/backups/:filename', requireAuth, (req, res) => {
  const filename = path.basename(req.params.filename)
  const filepath = path.join(BACKUPS_DIR, filename)

  if (!fs.existsSync(filepath)) {
    res.status(404).json({ error: 'Backup introuvable' })
    return
  }

  res.download(filepath, filename)
})

// ─── DELETE /api/admin/backups/:filename ──────────────────────────────────────
router.delete('/backups/:filename', requireAuth, (req, res) => {
  const filename = path.basename(req.params.filename)
  const filepath = path.join(BACKUPS_DIR, filename)

  if (!fs.existsSync(filepath)) {
    res.status(404).json({ error: 'Backup introuvable' })
    return
  }

  fs.unlinkSync(filepath)
  res.json({ ok: true })
})

// ─── PUT /api/admin/password ──────────────────────────────────────────────────
router.put('/password', requireAuth, async (req, res) => {
  const { newPassword } = req.body as { newPassword?: string }

  if (!newPassword || newPassword.length < 8) {
    res.status(400).json({ error: 'Mot de passe trop court (minimum 8 caractères)' })
    return
  }

  await updateAdminPassword(newPassword)
  res.json({ ok: true })
})

// ─── PUT /api/admin/identifier ────────────────────────────────────────────────
router.put('/identifier', requireAuth, (req, res) => {
  const { newIdentifier } = req.body as { newIdentifier?: string }

  if (!newIdentifier || newIdentifier.trim().length < 3) {
    res.status(400).json({ error: 'Identifiant trop court (minimum 3 caractères)' })
    return
  }

  updateAdminIdentifier(newIdentifier.trim())
  res.json({ ok: true })
})

export default router
