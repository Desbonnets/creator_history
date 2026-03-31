import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/StoreContext'
import ImageUpload from '../components/ImageUpload'

export default function HomePage() {
  const { data, createUniverse, deleteUniverse } = useStore()
  const navigate = useNavigate()
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [image, setImage] = useState<string | undefined>()

  const handleCreate = () => {
    if (!name.trim()) return
    const u = createUniverse(name.trim(), description.trim(), image)
    setName(''); setDescription(''); setImage(undefined); setShowForm(false)
    navigate(`/universe/${u.id}`)
  }

  const handleClose = () => { setName(''); setDescription(''); setImage(undefined); setShowForm(false) }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Mes univers</h1>
        <button className="btn-primary" onClick={() => setShowForm(true)}>+ Nouvel univers</button>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={handleClose}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Créer un univers</h2>
            <div className="form-group">
              <label className="field-label">Nom *</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Nom de l'univers" autoFocus />
            </div>
            <div className="form-group">
              <label className="field-label">Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description..." rows={3} />
            </div>
            <ImageUpload value={image} onChange={setImage} label="Image de couverture" />
            <div className="modal-actions">
              <button className="btn-secondary" onClick={handleClose}>Annuler</button>
              <button className="btn-primary" onClick={handleCreate} disabled={!name.trim()}>Créer</button>
            </div>
          </div>
        </div>
      )}

      {data.universes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🌍</div>
          <p>Aucun univers pour l'instant.</p>
          <button className="btn-primary" onClick={() => setShowForm(true)}>Créer mon premier univers</button>
        </div>
      ) : (
        <div className="cards-grid">
          {data.universes.map(u => (
            <div key={u.id} className="card" onClick={() => navigate(`/universe/${u.id}`)}>
              {u.image && <img src={u.image} alt={u.name} className="card-cover" />}
              <div className="card-body">
                <h3 className="card-title">{u.name}</h3>
                <p className="text-muted card-desc">{u.description || 'Aucune description'}</p>
                <div className="card-stats">
                  <span>{u.stories.length} histoire(s)</span>
                  <span>{u.elements.character.length} perso.</span>
                </div>
              </div>
              <button
                className="card-delete"
                onClick={e => { e.stopPropagation(); if (confirm(`Supprimer "${u.name}" ?`)) deleteUniverse(u.id) }}
              >✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
