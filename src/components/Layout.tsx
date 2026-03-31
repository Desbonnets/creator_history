import { Link, Outlet, useNavigate, useParams, useLocation } from 'react-router-dom'
import { useRef, useState, useEffect } from 'react'
import { useStore } from '../store/StoreContext'
import { exportToZip, importFromZip } from '../utils/zip'
import { ELEMENT_CONFIG, getActiveBuiltinTypes } from '../types'


export default function Layout() {
  const { id: universeId } = useParams<{ id?: string }>()
  const { data, importData } = useStore()
  const navigate = useNavigate()
  const location = useLocation()
  const importRef = useRef<HTMLInputElement>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Ferme le sidebar lors d'un changement de route sur mobile
  useEffect(() => { setSidebarOpen(false) }, [location.pathname])

  const universe = universeId ? data.universes.find(u => u.id === universeId) : undefined

  const handleExport = async () => {
    await exportToZip(data)
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const imported = await importFromZip(file)
      importData(imported)
      navigate('/')
      alert('Import réussi !')
    } catch (err) {
      alert('Erreur import : ' + (err as Error).message)
    }
    e.target.value = ''
  }

  const active = (path: string) => location.pathname === path ? 'active' : ''
  const includes = (segment: string) => location.pathname.includes(segment) ? 'active' : ''

  return (
    <div className="layout">
      {/* Top bar mobile */}
      <div className="mobile-topbar">
        <button className="hamburger" onClick={() => setSidebarOpen(o => !o)} aria-label="Menu">
          <span /><span /><span />
        </button>
        <Link to="/" className="sidebar-logo">📖 WorldBuilder</Link>
      </div>

      {/* Overlay pour fermer le sidebar sur mobile */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      <aside className={`sidebar${sidebarOpen ? ' sidebar--open' : ''}`}>
        <div className="sidebar-header">
          <Link to="/" className="sidebar-logo">📖 WorldBuilder</Link>
        </div>

        <nav className="sidebar-nav">
          {universe ? (
            <>
              <Link to="/" className="nav-link nav-back">← Mes univers</Link>
              <div className="nav-section-label">{universe.name}</div>
              <Link to={`/universe/${universeId}`} className={`nav-link ${active(`/universe/${universeId}`)}`}>
                🏠 Accueil
              </Link>
              <Link to={`/universe/${universeId}/stories`} className={`nav-link ${includes('/stor')}`}>
                📖 Histoires
              </Link>
              {getActiveBuiltinTypes(universe).map(type => (
                <Link
                  key={type}
                  to={`/universe/${universeId}/${type}`}
                  className={`nav-link ${includes(`/${type}`)}`}
                >
                  {ELEMENT_CONFIG[type].icon} {ELEMENT_CONFIG[type].labelPlural}
                </Link>
              ))}
              {universe.customCategories.map(cat => (
                <Link
                  key={cat.id}
                  to={`/universe/${universeId}/${cat.id}`}
                  className={`nav-link ${includes(`/${cat.id}`)}`}
                >
                  {cat.icon} {cat.labelPlural}
                </Link>
              ))}
              <div className="nav-divider" />
              <Link to={`/universe/${universeId}/settings`} className={`nav-link ${includes('/settings')}`}>
                ⚙️ Paramètres
              </Link>
            </>
          ) : (
            <Link to="/" className={`nav-link ${active('/')}`}>🌍 Mes univers</Link>
          )}
        </nav>

        <div className="sidebar-footer">
          <button className="btn-sidebar" onClick={handleExport}>⬇️ Exporter ZIP</button>
          <button className="btn-sidebar" onClick={() => importRef.current?.click()}>⬆️ Importer ZIP</button>
          <input ref={importRef} type="file" accept=".zip" style={{ display: 'none' }} onChange={handleImport} />
          <Link to="/admin" className="btn-sidebar" style={{ textDecoration: 'none', textAlign: 'left' }}>
            🔐 Administration
          </Link>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}
