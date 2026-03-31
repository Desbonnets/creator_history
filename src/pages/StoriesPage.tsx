import { useParams, useNavigate } from 'react-router-dom'
import { useStore } from '../store/StoreContext'
import { useConfirm } from '../components/ConfirmModal'

export default function StoriesPage() {
  const { id } = useParams<{ id: string }>()
  const { data, deleteStory } = useStore()
  const navigate = useNavigate()

  const universe = data.universes.find(u => u.id === id)
  const { confirm, ConfirmModalElement } = useConfirm()

  if (!universe) return <div className="page"><p>Univers introuvable.</p></div>

  return (
    <div className="page">
      {ConfirmModalElement}
      <div className="page-header">
        <h1>📖 Histoires</h1>
        <button className="btn-primary" onClick={() => navigate(`/universe/${id}/story/new`)}>
          + Nouvelle histoire
        </button>
      </div>

      {universe.stories.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📖</div>
          <p>Aucune histoire pour l'instant.</p>
          <button className="btn-primary" onClick={() => navigate(`/universe/${id}/story/new`)}>
            Créer une histoire
          </button>
        </div>
      ) : (
        <div className="cards-grid">
          {universe.stories.map(s => (
            <div key={s.id} className="card" onClick={() => navigate(`/universe/${id}/story/${s.id}`)}>
              {s.image && <img src={s.image} alt={s.title} className="card-cover" />}
              <div className="card-body">
                <h3 className="card-title">{s.title}</h3>
                <p className="text-muted card-desc">{s.description || 'Aucune description'}</p>
                <div className="card-stats">
                  <span>{s.chapters.length} chapitre(s)</span>
                  <span>
                    {s.chapters.reduce((acc, c) => acc + c.content.split(/\s+/).filter(Boolean).length, 0)} mots
                  </span>
                </div>
              </div>
              <button
                className="card-delete"
                onClick={async e => { e.stopPropagation(); if (await confirm(`Supprimer l'histoire "${s.title}" et tous ses chapitres ?`)) deleteStory(id!, s.id) }}
              >✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
