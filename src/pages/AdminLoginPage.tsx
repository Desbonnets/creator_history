import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiLogin } from '../admin/api'
import { setSession, getSession } from '../admin/session'

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (getSession()) navigate('/admin', { replace: true })
  }, [navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const token = await apiLogin(identifier, password)
      setSession({ identifier, password, token })
      navigate('/admin', { replace: true })
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="admin-login-wrapper">
      <div className="admin-login-box">
        <div className="admin-login-logo">🔐</div>
        <h1 className="admin-login-title">Administration</h1>
        <p className="admin-login-subtitle">Accès réservé</p>

        <form onSubmit={handleSubmit} className="admin-login-form">
          <div className="form-group">
            <label className="field-label">Identifiant</label>
            <input
              type="text"
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
              autoComplete="username"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="field-label">Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              disabled={loading}
            />
          </div>

          {error && <p className="admin-error">{error}</p>}

          <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  )
}
