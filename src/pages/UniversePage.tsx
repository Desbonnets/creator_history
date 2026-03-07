import { useParams, useNavigate } from 'react-router-dom'
import { useStore } from '../store/StoreContext'
import { ELEMENT_CONFIG, ELEMENT_TYPES } from '../types'

export default function UniversePage() {
  const { id } = useParams<{ id: string }>()
  const { data } = useStore()
  const navigate = useNavigate()

  const universe = data.universes.find(u => u.id === id)
  if (!universe) return <div className="page"><p>Univers introuvable.</p></div>

  const totalElements = ELEMENT_TYPES.reduce((acc, t) => acc + (universe.elements[t]?.length ?? 0), 0)

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-info">
          {universe.image && <img src={universe.image} alt={universe.name} className="universe-avatar" />}
          <div>
            <h1>{universe.name}</h1>
            {universe.description && <p className="text-muted">{universe.description}</p>}
          </div>
        </div>
        <button className="btn-secondary" onClick={() => navigate(`/universe/${id}/settings`)}>⚙️ Paramètres</button>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card" onClick={() => navigate(`/universe/${id}/stories`)}>
          <div className="dashboard-card-icon">📖</div>
          <div className="dashboard-card-info">
            <strong>Histoires</strong>
            <span className="dashboard-card-count">{universe.stories.length}</span>
          </div>
        </div>
        {ELEMENT_TYPES.map(type => (
          <div key={type} className="dashboard-card" onClick={() => navigate(`/universe/${id}/${type}`)}>
            <div className="dashboard-card-icon">{ELEMENT_CONFIG[type].icon}</div>
            <div className="dashboard-card-info">
              <strong>{ELEMENT_CONFIG[type].labelPlural}</strong>
              <span className="dashboard-card-count">{universe.elements[type]?.length ?? 0}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="universe-summary">
        <p className="text-muted">{totalElements} élément(s) au total · Créé le {new Date(universe.createdAt).toLocaleDateString('fr-FR')}</p>
      </div>
    </div>
  )
}
