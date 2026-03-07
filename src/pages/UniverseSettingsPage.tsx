import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useStore } from '../store/StoreContext'
import type { ElementType, AttributeType, AttributeDef } from '../types'
import { ELEMENT_CONFIG, ELEMENT_TYPES } from '../types'
import ImageUpload from '../components/ImageUpload'

const ATTR_TYPES: { value: AttributeType; label: string }[] = [
  { value: 'text',     label: 'Texte court' },
  { value: 'textarea', label: 'Texte long' },
  { value: 'number',   label: 'Nombre' },
  { value: 'date',     label: 'Date' },
  { value: 'select',   label: 'Liste déroulante' },
  { value: 'image',    label: 'Image' },
]

type TabKey = 'general' | ElementType

export default function UniverseSettingsPage() {
  const { id: universeId } = useParams<{ id: string }>()
  const { data, updateUniverse, addAttribute, updateAttribute, removeAttribute, moveAttribute } = useStore()

  const universe = data.universes.find(u => u.id === universeId)

  const [activeTab, setActiveTab] = useState<TabKey>('general')
  const [uName, setUName] = useState(universe?.name ?? '')
  const [uDesc, setUDesc] = useState(universe?.description ?? '')
  const [uImage, setUImage] = useState<string | undefined>(universe?.image)

  const [newAttr, setNewAttr] = useState({ name: '', type: 'text' as AttributeType, options: '' })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editType, setEditType] = useState<AttributeType>('text')
  const [editOptions, setEditOptions] = useState('')

  if (!universe) return <div className="page"><p>Univers introuvable.</p></div>

  const handleSaveGeneral = () => {
    if (!uName.trim()) return
    updateUniverse(universeId!, { name: uName.trim(), description: uDesc.trim(), image: uImage })
  }

  const handleAddAttr = () => {
    if (!newAttr.name.trim() || activeTab === 'general') return
    addAttribute(universeId!, activeTab as ElementType, {
      name: newAttr.name.trim(),
      type: newAttr.type,
      options: newAttr.type === 'select'
        ? newAttr.options.split(',').map(s => s.trim()).filter(Boolean)
        : undefined,
      isDefault: false,
    })
    setNewAttr({ name: '', type: 'text', options: '' })
  }

  const handleStartEdit = (attr: AttributeDef) => {
    setEditingId(attr.id)
    setEditName(attr.name)
    setEditType(attr.type)
    setEditOptions(attr.options?.join(', ') ?? '')
  }

  const handleSaveEdit = (attrId: string) => {
    if (activeTab === 'general') return
    updateAttribute(universeId!, activeTab as ElementType, attrId, {
      name: editName.trim() || undefined,
      type: editType,
      options: editType === 'select' ? editOptions.split(',').map(s => s.trim()).filter(Boolean) : undefined,
    })
    setEditingId(null)
  }

  const template = activeTab !== 'general' ? (universe.templates[activeTab as ElementType] ?? []) : []

  return (
    <div className="page">
      <div className="page-header">
        <h1>⚙️ Paramètres de l'univers</h1>
      </div>

      <div className="settings-layout">
        <div className="settings-tabs">
          <button
            className={`tab-btn ${activeTab === 'general' ? 'active' : ''}`}
            onClick={() => setActiveTab('general')}
          >
            🌍 Général
          </button>
          {ELEMENT_TYPES.map(type => (
            <button
              key={type}
              className={`tab-btn ${activeTab === type ? 'active' : ''}`}
              onClick={() => setActiveTab(type)}
            >
              {ELEMENT_CONFIG[type].icon} {ELEMENT_CONFIG[type].labelPlural}
            </button>
          ))}
        </div>

        <div className="settings-content">
          {activeTab === 'general' ? (
            <div className="form-panel">
              <h2 className="panel-title">Informations générales</h2>
              <div className="form-group">
                <label className="field-label">Nom de l'univers *</label>
                <input value={uName} onChange={e => setUName(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="field-label">Description</label>
                <textarea value={uDesc} onChange={e => setUDesc(e.target.value)} rows={4} />
              </div>
              <ImageUpload value={uImage} onChange={setUImage} label="Image de couverture" />
              <button className="btn-primary" onClick={handleSaveGeneral} disabled={!uName.trim()}>
                💾 Sauvegarder
              </button>
            </div>
          ) : (
            <div>
              <h2 className="panel-title">
                Attributs — {ELEMENT_CONFIG[activeTab as ElementType].labelPlural}
              </h2>
              <p className="text-muted text-sm settings-hint">
                🔒 = attribut requis (ne peut pas être supprimé) · Les attributs par défaut peuvent être modifiés ou supprimés.
              </p>

              <div className="attr-list">
                {template.map((attr, index) => (
                  <div key={attr.id} className="attr-row">
                    {editingId === attr.id ? (
                      <div className="attr-edit-form">
                        <input
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          placeholder="Nom de l'attribut"
                        />
                        <select value={editType} onChange={e => setEditType(e.target.value as AttributeType)}>
                          {ATTR_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                        {editType === 'select' && (
                          <input
                            value={editOptions}
                            onChange={e => setEditOptions(e.target.value)}
                            placeholder="Option1, Option2, Option3"
                          />
                        )}
                        <div className="attr-edit-actions">
                          <button className="btn-primary-sm" onClick={() => handleSaveEdit(attr.id)}>✓ OK</button>
                          <button className="btn-secondary-sm" onClick={() => setEditingId(null)}>Annuler</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="attr-info">
                          <span className="attr-name">
                            {attr.required ? '🔒 ' : ''}{attr.name}
                          </span>
                          <span className="attr-type-badge">
                            {ATTR_TYPES.find(t => t.value === attr.type)?.label}
                          </span>
                          {attr.isDefault && <span className="attr-default-badge">défaut</span>}
                          {attr.options?.length ? (
                            <span className="text-muted text-sm"> ({attr.options.join(', ')})</span>
                          ) : null}
                        </div>
                        <div className="attr-actions">
                          <button
                            disabled={index === 0}
                            onClick={() => moveAttribute(universeId!, activeTab as ElementType, index, index - 1)}
                            title="Monter"
                          >↑</button>
                          <button
                            disabled={index === template.length - 1}
                            onClick={() => moveAttribute(universeId!, activeTab as ElementType, index, index + 1)}
                            title="Descendre"
                          >↓</button>
                          <button onClick={() => handleStartEdit(attr)} title="Modifier">✏️</button>
                          {!attr.required && (
                            <button
                              className="danger"
                              title="Supprimer"
                              onClick={() => {
                                if (confirm(`Supprimer l'attribut "${attr.name}" ? Les données existantes seront conservées mais non affichées.`))
                                  removeAttribute(universeId!, activeTab as ElementType, attr.id)
                              }}
                            >🗑</button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>

              <div className="add-attr-form">
                <h3>Ajouter un attribut</h3>
                <div className="add-attr-fields">
                  <input
                    value={newAttr.name}
                    onChange={e => setNewAttr(v => ({ ...v, name: e.target.value }))}
                    placeholder="Nom de l'attribut"
                    onKeyDown={e => e.key === 'Enter' && handleAddAttr()}
                  />
                  <select
                    value={newAttr.type}
                    onChange={e => setNewAttr(v => ({ ...v, type: e.target.value as AttributeType }))}
                  >
                    {ATTR_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                  {newAttr.type === 'select' && (
                    <input
                      value={newAttr.options}
                      onChange={e => setNewAttr(v => ({ ...v, options: e.target.value }))}
                      placeholder="Option1, Option2, Option3"
                    />
                  )}
                  <button
                    className="btn-primary-sm"
                    onClick={handleAddAttr}
                    disabled={!newAttr.name.trim()}
                  >
                    + Ajouter
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
