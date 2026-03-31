import { useParams, useNavigate } from 'react-router-dom'
import { useStore } from '../store/StoreContext'
import { getCategoryConfig } from '../types'
import { useConfirm } from '../components/ConfirmModal'

export default function ElementListPage() {
  const { id: universeId, type } = useParams<{ id: string; type: string }>()
  const { data, deleteElement } = useStore()
  const navigate = useNavigate()

  const universe = data.universes.find(u => u.id === universeId)
  const { confirm, ConfirmModalElement } = useConfirm()

  if (!universe || !type) return <div className="page"><p>Univers introuvable.</p></div>

  const config = getCategoryConfig(universe, type)
  if (!config) return <div className="page"><p>Catégorie introuvable.</p></div>

  const elements = universe.elements[type] ?? []

  return (
    <div className="page">
      {ConfirmModalElement}
      <div className="page-header">
        <h1>{config.icon} {config.labelPlural}</h1>
        <button className="btn-primary" onClick={() => navigate(`/universe/${universeId}/${type}/new`)}>
          + Nouveau {config.label.toLowerCase()}
        </button>
      </div>

      {elements.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">{config.icon}</div>
          <p>Aucun(e) {config.label.toLowerCase()} pour l'instant.</p>
          <button className="btn-primary" onClick={() => navigate(`/universe/${universeId}/${type}/new`)}>
            Créer
          </button>
        </div>
      ) : (
        <div className="cards-grid">
          {elements.map(el => {
            const name = el.values['name'] || 'Sans nom'
            const img = el.values['image']
            const desc = el.values['description']
            return (
              <div key={el.id} className="card" onClick={() => navigate(`/universe/${universeId}/${type}/${el.id}`)}>
                {img && <img src={img} alt={name} className="card-cover" />}
                <div className="card-body">
                  <h3 className="card-title">{name}</h3>
                  {desc && <p className="text-muted card-desc">{desc.slice(0, 100)}{desc.length > 100 ? '…' : ''}</p>}
                </div>
                <button
                  className="card-delete"
                  onClick={async e => { e.stopPropagation(); if (await confirm(`Supprimer "${name}" ?`)) deleteElement(universeId!, type, el.id) }}
                >✕</button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
