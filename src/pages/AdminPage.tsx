import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/StoreContext'
import { getSession, clearSession, setSession } from '../admin/session'
import { encryptBuffer, decryptBuffer } from '../admin/crypto'
import {
  apiListBackups,
  apiUploadBackup,
  apiDownloadBackup,
  apiDeleteBackup,
  apiUpdatePassword,
  apiUpdateIdentifier,
  type BackupInfo,
} from '../admin/api'
import JSZip from 'jszip'
import type { AppData } from '../types'

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
  return `${(bytes / 1024 / 1024).toFixed(2)} Mo`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('fr-FR')
}

type MigrationData = {
  oldPassword: string
  oldIdentifier: string
  newPassword: string
  newIdentifier: string
}

export default function AdminPage() {
  const navigate = useNavigate()
  const { data, importData } = useStore()

  const [session] = useState(() => getSession())

  useEffect(() => {
    if (!session) navigate('/admin/login', { replace: true })
  }, [navigate, session])

  const [backups, setBackups] = useState<BackupInfo[]>([])
  const [loadingBackups, setLoadingBackups] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  // Changement de mot de passe
  const [showPwdForm, setShowPwdForm] = useState(false)
  const [newPwd, setNewPwd] = useState('')
  const [pwdLoading, setPwdLoading] = useState(false)

  // Changement d'identifiant
  const [showIdentifierForm, setShowIdentifierForm] = useState(false)
  const [newIdentifier, setNewIdentifier] = useState('')
  const [identifierLoading, setIdentifierLoading] = useState(false)

  // Migration des backups après changement de credentials
  const [migrationData, setMigrationData] = useState<MigrationData | null>(null)
  const [migrationProgress, setMigrationProgress] = useState<string | null>(null)

  const notify = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMsg({ text, type })
    setTimeout(() => setStatusMsg(null), 4000)
  }

  const fetchBackups = useCallback(async () => {
    if (!session) return
    setLoadingBackups(true)
    try {
      setBackups(await apiListBackups(session.token))
    } catch (err) {
      notify((err as Error).message, 'error')
    } finally {
      setLoadingBackups(false)
    }
  }, [session])

  useEffect(() => { fetchBackups() }, [fetchBackups])

  // ─── Export chiffré ─────────────────────────────────────────────────────────
  const handleExport = async () => {
    if (!session) return
    setUploading(true)
    try {
      const zip = new JSZip()
      zip.file('data.json', JSON.stringify(data, null, 2))
      const zipBuffer = await zip.generateAsync({ type: 'arraybuffer', compression: 'DEFLATE' })
      const encrypted = await encryptBuffer(zipBuffer, session.password, session.identifier)
      const blob = new Blob([encrypted], { type: 'application/octet-stream' })
      const { filename } = await apiUploadBackup(session.token, blob)
      notify(`Backup "${filename}" sauvegardé avec succès.`)
      await fetchBackups()
    } catch (err) {
      notify((err as Error).message, 'error')
    } finally {
      setUploading(false)
    }
  }

  // ─── Import depuis backup serveur ───────────────────────────────────────────
  const handleImport = async (filename: string) => {
    if (!session) return
    if (!confirm(`Restaurer le backup "${filename}" ? Les données actuelles seront remplacées.`)) return
    try {
      const encryptedBuffer = await apiDownloadBackup(session.token, filename)
      const zipBuffer = await decryptBuffer(encryptedBuffer, session.password, session.identifier)
      const zip = await JSZip.loadAsync(zipBuffer)
      const dataFile = zip.file('data.json')
      if (!dataFile) throw new Error('data.json introuvable dans l\'archive')
      const content = await dataFile.async('string')
      importData(JSON.parse(content) as AppData)
      notify(`Backup "${filename}" restauré avec succès.`)
    } catch (err) {
      notify((err as Error).message, 'error')
    }
  }

  // ─── Téléchargement local ────────────────────────────────────────────────────
  const handleDownload = async (filename: string) => {
    if (!session) return
    try {
      const buffer = await apiDownloadBackup(session.token, filename)
      const url = URL.createObjectURL(new Blob([buffer], { type: 'application/octet-stream' }))
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      notify((err as Error).message, 'error')
    }
  }

  // ─── Suppression ────────────────────────────────────────────────────────────
  const handleDelete = async (filename: string) => {
    if (!session) return
    if (!confirm(`Supprimer le backup "${filename}" ? Cette action est irréversible.`)) return
    try {
      // Vérifier qu'on peut déchiffrer avant d'autoriser la suppression
      const encryptedBuffer = await apiDownloadBackup(session.token, filename)
      await decryptBuffer(encryptedBuffer, session.password, session.identifier)
      await apiDeleteBackup(session.token, filename)
      notify(`Backup "${filename}" supprimé.`)
      await fetchBackups()
    } catch (err) {
      notify((err as Error).message, 'error')
    }
  }

  // ─── Changement de mot de passe ─────────────────────────────────────────────
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session) return
    setPwdLoading(true)
    try {
      await apiUpdatePassword(session.token, newPwd)
      const oldPassword = session.password
      setShowPwdForm(false)
      setNewPwd('')
      if (backups.length > 0) {
        setMigrationData({
          oldPassword,
          oldIdentifier: session.identifier,
          newPassword: newPwd,
          newIdentifier: session.identifier,
        })
      } else {
        setSession({ ...session, password: newPwd })
        notify('Mot de passe mis à jour.')
      }
    } catch (err) {
      notify((err as Error).message, 'error')
    } finally {
      setPwdLoading(false)
    }
  }

  // ─── Changement d'identifiant ────────────────────────────────────────────────
  const handleIdentifierChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session) return
    setIdentifierLoading(true)
    try {
      await apiUpdateIdentifier(session.token, newIdentifier)
      const oldIdentifier = session.identifier
      setShowIdentifierForm(false)
      setNewIdentifier('')
      if (backups.length > 0) {
        setMigrationData({
          oldPassword: session.password,
          oldIdentifier,
          newPassword: session.password,
          newIdentifier,
        })
      } else {
        setSession({ ...session, identifier: newIdentifier })
        notify('Identifiant mis à jour.')
      }
    } catch (err) {
      notify((err as Error).message, 'error')
    } finally {
      setIdentifierLoading(false)
    }
  }

  // ─── Migration : re-chiffrement ──────────────────────────────────────────────
  const handleMigrationReencrypt = async () => {
    if (!session || !migrationData) return
    setMigrationProgress(`Préparation…`)
    try {
      for (let i = 0; i < backups.length; i++) {
        const b = backups[i]
        setMigrationProgress(`Re-chiffrement ${i + 1}/${backups.length} : ${b.filename}`)
        const encryptedBuffer = await apiDownloadBackup(session.token, b.filename)
        const zipBuffer = await decryptBuffer(encryptedBuffer, migrationData.oldPassword, migrationData.oldIdentifier)
        const newEncrypted = await encryptBuffer(zipBuffer, migrationData.newPassword, migrationData.newIdentifier)
        await apiDeleteBackup(session.token, b.filename)
        const blob = new Blob([newEncrypted], { type: 'application/octet-stream' })
        await apiUploadBackup(session.token, blob)
      }
      setSession({ ...session, password: migrationData.newPassword, identifier: migrationData.newIdentifier })
      setMigrationData(null)
      setMigrationProgress(null)
      await fetchBackups()
      notify('Backups re-chiffrés avec les nouveaux credentials.')
    } catch (err) {
      notify((err as Error).message, 'error')
      setMigrationProgress(null)
    }
  }

  // ─── Migration : suppression ─────────────────────────────────────────────────
  const handleMigrationDelete = async () => {
    if (!session || !migrationData) return
    setMigrationProgress('Vérification des backups…')
    try {
      for (let i = 0; i < backups.length; i++) {
        const b = backups[i]
        setMigrationProgress(`Vérification ${i + 1}/${backups.length} : ${b.filename}`)
        // Vérifier qu'on peut déchiffrer avec les anciens credentials avant de supprimer
        const encryptedBuffer = await apiDownloadBackup(session.token, b.filename)
        await decryptBuffer(encryptedBuffer, migrationData.oldPassword, migrationData.oldIdentifier)
        await apiDeleteBackup(session.token, b.filename)
      }
      setSession({ ...session, password: migrationData.newPassword, identifier: migrationData.newIdentifier })
      setMigrationData(null)
      setMigrationProgress(null)
      await fetchBackups()
      notify('Backups supprimés. Credentials mis à jour.')
    } catch (err) {
      notify((err as Error).message, 'error')
      setMigrationProgress(null)
    }
  }

  const handleLogout = () => {
    clearSession()
    navigate('/admin/login', { replace: true })
  }

  if (!session) return null

  return (
    <div className="admin-wrapper">
      {/* Header */}
      <header className="admin-header">
        <div className="admin-header-left">
          <span className="admin-header-logo">🔐</span>
          <div>
            <h1 className="admin-header-title">Panneau d'administration</h1>
            <p className="admin-header-sub">Connecté en tant que <strong>{session.identifier}</strong></p>
          </div>
        </div>
        <div className="admin-header-actions">
          <button className="btn-secondary" onClick={() => navigate('/')}>← Application</button>
          <button className="btn-secondary" onClick={() => { setShowPwdForm(v => !v); setShowIdentifierForm(false) }}>
            🔑 Mot de passe
          </button>
          <button className="btn-secondary" onClick={() => { setShowIdentifierForm(v => !v); setShowPwdForm(false) }}>
            ✏️ Identifiant
          </button>
          <button className="btn-secondary" onClick={handleLogout}>Se déconnecter</button>
        </div>
      </header>

      <div className="admin-body">
        {statusMsg && (
          <div className={`admin-status ${statusMsg.type}`}>{statusMsg.text}</div>
        )}

        {/* Changement de mot de passe */}
        {showPwdForm && (
          <div className="admin-card">
            <h2 className="admin-card-title">Changer le mot de passe</h2>
            <form onSubmit={handlePasswordChange} style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
              <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
                <label className="field-label">Nouveau mot de passe (min. 8 caractères)</label>
                <input
                  type="password"
                  value={newPwd}
                  onChange={e => setNewPwd(e.target.value)}
                  minLength={8}
                  required
                  disabled={pwdLoading}
                />
              </div>
              <button type="submit" className="btn-primary" disabled={pwdLoading}>
                {pwdLoading ? 'Mise à jour…' : 'Enregistrer'}
              </button>
              <button type="button" className="btn-secondary" onClick={() => setShowPwdForm(false)}>
                Annuler
              </button>
            </form>
          </div>
        )}

        {/* Changement d'identifiant */}
        {showIdentifierForm && (
          <div className="admin-card">
            <h2 className="admin-card-title">Changer l'identifiant</h2>
            <form onSubmit={handleIdentifierChange} style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
              <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
                <label className="field-label">Nouvel identifiant (min. 3 caractères)</label>
                <input
                  type="text"
                  value={newIdentifier}
                  onChange={e => setNewIdentifier(e.target.value)}
                  minLength={3}
                  required
                  disabled={identifierLoading}
                />
              </div>
              <button type="submit" className="btn-primary" disabled={identifierLoading}>
                {identifierLoading ? 'Mise à jour…' : 'Enregistrer'}
              </button>
              <button type="button" className="btn-secondary" onClick={() => setShowIdentifierForm(false)}>
                Annuler
              </button>
            </form>
          </div>
        )}

        {/* Action principale */}
        <div className="admin-card admin-export-card">
          <div>
            <h2 className="admin-card-title">Sauvegarde chiffrée</h2>
            <p className="admin-card-desc">
              Le ZIP est chiffré avec AES-256-GCM côté navigateur avant envoi.
              La clé est dérivée de votre mot de passe et identifiant — seul vous pouvez le déchiffrer.
            </p>
          </div>
          <button
            className="btn-primary admin-export-btn"
            onClick={handleExport}
            disabled={uploading}
          >
            {uploading ? '⏳ Chiffrement & envoi…' : '☁️ Sauvegarder sur le serveur'}
          </button>
        </div>

        {/* Liste des backups */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h2 className="admin-card-title">Backups stockés ({backups.length})</h2>
            <button className="btn-secondary" onClick={fetchBackups} disabled={loadingBackups}>
              {loadingBackups ? '…' : '↻ Actualiser'}
            </button>
          </div>

          {loadingBackups ? (
            <p className="text-muted">Chargement…</p>
          ) : backups.length === 0 ? (
            <p className="text-muted" style={{ padding: '20px 0' }}>Aucun backup pour le moment.</p>
          ) : (
            <div className="admin-backup-list">
              {backups.map(b => (
                <div key={b.filename} className="admin-backup-row">
                  <div className="admin-backup-info">
                    <span className="admin-backup-name">{b.filename}</span>
                    <span className="admin-backup-meta">
                      {formatSize(b.size)} · {formatDate(b.createdAt)}
                    </span>
                  </div>
                  <div className="admin-backup-actions">
                    <button
                      className="btn-secondary-sm"
                      title="Restaurer dans l'application"
                      onClick={() => handleImport(b.filename)}
                    >
                      ↩ Restaurer
                    </button>
                    <button
                      className="btn-secondary-sm"
                      title="Télécharger le fichier chiffré"
                      onClick={() => handleDownload(b.filename)}
                    >
                      ⬇ Télécharger
                    </button>
                    <button
                      className="btn-danger-sm"
                      title="Supprimer ce backup"
                      onClick={() => handleDelete(b.filename)}
                    >
                      🗑
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info chiffrement */}
        <div className="admin-card admin-info-card">
          <h3>ℹ️ Comment fonctionne le chiffrement ?</h3>
          <ul>
            <li>Le ZIP est généré et chiffré <strong>dans votre navigateur</strong> avant tout envoi.</li>
            <li>La clé AES-256 est dérivée via <strong>PBKDF2</strong> à partir de votre mot de passe et identifiant.</li>
            <li>Le serveur reçoit uniquement le fichier chiffré — il ne peut pas lire vos données.</li>
            <li>Pour restaurer, vous devez être connecté avec le <strong>même mot de passe et identifiant</strong>.</li>
          </ul>
        </div>
      </div>

      {/* Modal migration backups */}
      {migrationData && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Backups existants détectés</h2>
            <p style={{ color: 'var(--muted)', marginTop: 12, lineHeight: 1.6 }}>
              {backups.length} backup(s) sont chiffrés avec les anciens credentials.
              Ils seront inaccessibles si vous ne les migrez pas.
            </p>
            {migrationProgress ? (
              <p className="text-muted" style={{ marginTop: 20 }}>{migrationProgress}</p>
            ) : (
              <div className="modal-actions" style={{ justifyContent: 'flex-start' }}>
                <button className="btn-primary" onClick={handleMigrationReencrypt}>
                  Re-chiffrer les backups
                </button>
                <button className="btn-danger" onClick={handleMigrationDelete}>
                  Supprimer les backups
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
