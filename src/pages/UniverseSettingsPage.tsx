import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useStore } from '../store/StoreContext'
import type { AttributeType, AttributeDef, ElementType } from '../types'
import { ELEMENT_TYPES, getCategoryConfig, getActiveBuiltinTypes } from '../types'
import ImageUpload from '../components/ImageUpload'

const ATTR_TYPES: { value: AttributeType; label: string }[] = [
  { value: 'text',     label: 'Texte court' },
  { value: 'textarea', label: 'Texte long' },
  { value: 'number',   label: 'Nombre' },
  { value: 'date',     label: 'Date' },
  { value: 'select',   label: 'Liste déroulante' },
  { value: 'image',    label: 'Image' },
]

type TabKey = 'general' | 'categories' | string

export default function UniverseSettingsPage() {
  const { id: universeId } = useParams<{ id: string }>()
  const {
    data, updateUniverse,
    addAttribute, updateAttribute, removeAttribute, moveAttribute,
    addCategory, updateCategory, deleteCategory, disableBuiltinType, overrideBuiltinType,
  } = useStore()

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

  // Nouvelle catégorie
  const [newCat, setNewCat] = useState({ label: '', labelPlural: '', icon: '📁' })
  // Édition catégorie
  const [editingCatId, setEditingCatId] = useState<string | null>(null)
  const [editCat, setEditCat] = useState({ label: '', labelPlural: '', icon: '' })

  if (!universe) return <div className="page"><p>Univers introuvable.</p></div>

  const handleSaveGeneral = () => {
    if (!uName.trim()) return
    updateUniverse(universeId!, { name: uName.trim(), description: uDesc.trim(), image: uImage })
  }

  const handleAddAttr = () => {
    if (!newAttr.name.trim() || activeTab === 'general' || activeTab === 'categories') return
    addAttribute(universeId!, activeTab, {
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
    if (activeTab === 'general' || activeTab === 'categories') return
    updateAttribute(universeId!, activeTab, attrId, {
      name: editName.trim() || undefined,
      type: editType,
      options: editType === 'select' ? editOptions.split(',').map(s => s.trim()).filter(Boolean) : undefined,
    })
    setEditingId(null)
  }

  const handleAddCategory = () => {
    if (!newCat.label.trim() || !newCat.labelPlural.trim()) return
    const cat = addCategory(universeId!, {
      label: newCat.label.trim(),
      labelPlural: newCat.labelPlural.trim(),
      icon: newCat.icon.trim() || '📁',
    })
    setNewCat({ label: '', labelPlural: '', icon: '📁' })
    setActiveTab(cat.id)
  }

  const handleStartEditCat = (id: string, label: string, labelPlural: string, icon: string) => {
    setEditingCatId(id)
    setEditCat({ label, labelPlural, icon })
  }

  const handleSaveEditCat = () => {
    if (!editingCatId || !editCat.label.trim() || !editCat.labelPlural.trim()) return
    updateCategory(universeId!, editingCatId, {
      label: editCat.label.trim(),
      labelPlural: editCat.labelPlural.trim(),
      icon: editCat.icon.trim() || '📁',
    })
    setEditingCatId(null)
  }

  const template = (activeTab !== 'general' && activeTab !== 'categories')
    ? (universe.templates[activeTab] ?? [])
    : []
  const activeConfig = (activeTab !== 'general' && activeTab !== 'categories')
    ? getCategoryConfig(universe, activeTab)
    : null

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
          <button
            className={`tab-btn ${activeTab === 'categories' ? 'active' : ''}`}
            onClick={() => setActiveTab('categories')}
          >
            🗂️ Catégories
          </button>

          <div className="tab-group-label">Catégories</div>
          {getActiveBuiltinTypes(universe).map(type => {
            const cfg = getCategoryConfig(universe, type)!
            return (
              <button
                key={type}
                className={`tab-btn ${activeTab === type ? 'active' : ''}`}
                onClick={() => setActiveTab(type)}
              >
                {cfg.icon} {cfg.labelPlural}
              </button>
            )
          })}
          {universe.customCategories.map(cat => (
            <button
              key={cat.id}
              className={`tab-btn ${activeTab === cat.id ? 'active' : ''}`}
              onClick={() => setActiveTab(cat.id)}
            >
              {cat.icon} {cat.labelPlural}
            </button>
          ))}
        </div>

        <div className="settings-content">
          {/* === Général === */}
          {activeTab === 'general' && (
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
          )}

          {/* === Gestion des catégories === */}
          {activeTab === 'categories' && (
            <div>
              <h2 className="panel-title">Gérer les catégories</h2>
              <p className="text-muted text-sm settings-hint">
                Cliquez sur ✏️ pour configurer les attributs d'une catégorie, sur 🏷️ pour la renommer, ou sur ✕ pour la supprimer.
              </p>

              <div className="attr-list">
                {/* Catégories par défaut actives */}
                {getActiveBuiltinTypes(universe).map(type => {
                  const cfg = getCategoryConfig(universe, type)!
                  return (
                    <div key={type} className="attr-row">
                      {editingCatId === type ? (
                        <div className="attr-edit-form">
                          <input
                            value={editCat.icon}
                            onChange={e => setEditCat(v => ({ ...v, icon: e.target.value }))}
                            placeholder="Icône (emoji)"
                            style={{ width: '5rem' }}
                          />
                          <input
                            value={editCat.label}
                            onChange={e => setEditCat(v => ({ ...v, label: e.target.value }))}
                            placeholder="Nom singulier"
                          />
                          <input
                            value={editCat.labelPlural}
                            onChange={e => setEditCat(v => ({ ...v, labelPlural: e.target.value }))}
                            placeholder="Nom pluriel"
                          />
                          <div className="attr-edit-actions">
                            <button
                              className="btn-primary-sm"
                              onClick={() => {
                                overrideBuiltinType(universeId!, type as ElementType, {
                                  label: editCat.label.trim() || undefined,
                                  labelPlural: editCat.labelPlural.trim() || undefined,
                                  icon: editCat.icon.trim() || undefined,
                                })
                                setEditingCatId(null)
                              }}
                              disabled={!editCat.label.trim() || !editCat.labelPlural.trim()}
                            >✓ OK</button>
                            <button className="btn-secondary-sm" onClick={() => setEditingCatId(null)}>Annuler</button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="attr-info">
                            <span className="attr-name">{cfg.icon} {cfg.labelPlural}</span>
                            <span className="attr-default-badge">défaut</span>
                            <span className="text-muted text-sm" style={{ marginLeft: '0.5rem' }}>
                              {universe.elements[type]?.length ?? 0} élément(s) · {universe.templates[type]?.length ?? 0} attribut(s)
                            </span>
                          </div>
                          <div className="attr-actions">
                            <button onClick={() => setActiveTab(type)} title="Configurer les attributs">✏️</button>
                            <button
                              onClick={() => handleStartEditCat(type, cfg.label, cfg.labelPlural, cfg.icon)}
                              title="Renommer"
                            >🏷️</button>
                            <button
                              className="danger"
                              title="Supprimer"
                              onClick={() => {
                                const elements = universe.elements[type] ?? []
                                const attrs = (universe.templates[type] ?? []).filter(a => !a.required)
                                const lines = [
                                  `Supprimer la catégorie "${cfg.labelPlural}" ?`,
                                  '',
                                  'Ce qui sera supprimé :',
                                  `  • ${elements.length} élément(s)`,
                                  `  • ${attrs.length} attribut(s) personnalisé(s)`,
                                  '',
                                  'Cette action est irréversible.',
                                ]
                                if (confirm(lines.join('\n'))) {
                                  disableBuiltinType(universeId!, type as ElementType)
                                  setActiveTab('categories')
                                }
                              }}
                            >✕</button>
                          </div>
                        </>
                      )}
                    </div>
                  )
                })}

                {/* Catégories personnalisées */}
                {universe.customCategories.map(cat => (
                  <div key={cat.id} className="attr-row">
                    {editingCatId === cat.id ? (
                      <div className="attr-edit-form">
                        <input
                          value={editCat.icon}
                          onChange={e => setEditCat(v => ({ ...v, icon: e.target.value }))}
                          placeholder="Icône (emoji)"
                          style={{ width: '5rem' }}
                        />
                        <input
                          value={editCat.label}
                          onChange={e => setEditCat(v => ({ ...v, label: e.target.value }))}
                          placeholder="Nom singulier"
                        />
                        <input
                          value={editCat.labelPlural}
                          onChange={e => setEditCat(v => ({ ...v, labelPlural: e.target.value }))}
                          placeholder="Nom pluriel"
                        />
                        <div className="attr-edit-actions">
                          <button
                            className="btn-primary-sm"
                            onClick={handleSaveEditCat}
                            disabled={!editCat.label.trim() || !editCat.labelPlural.trim()}
                          >✓ OK</button>
                          <button className="btn-secondary-sm" onClick={() => setEditingCatId(null)}>Annuler</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="attr-info">
                          <span className="attr-name">{cat.icon} {cat.labelPlural}</span>
                          <span className="text-muted text-sm" style={{ marginLeft: '0.5rem' }}>
                            {universe.elements[cat.id]?.length ?? 0} élément(s) · {universe.templates[cat.id]?.length ?? 0} attribut(s)
                          </span>
                        </div>
                        <div className="attr-actions">
                          <button onClick={() => setActiveTab(cat.id)} title="Configurer les attributs">✏️</button>
                          <button
                            onClick={() => handleStartEditCat(cat.id, cat.label, cat.labelPlural, cat.icon)}
                            title="Renommer"
                          >🏷️</button>
                          <button
                            className="danger"
                            title="Supprimer"
                            onClick={() => {
                              const elements = universe.elements[cat.id] ?? []
                              const attrs = (universe.templates[cat.id] ?? []).filter(a => !a.required)
                              const lines = [
                                `Supprimer la catégorie "${cat.labelPlural}" ?`,
                                '',
                                'Ce qui sera supprimé :',
                                `  • ${elements.length} élément(s)`,
                                `  • ${attrs.length} attribut(s) personnalisé(s)`,
                                '',
                                'Cette action est irréversible.',
                              ]
                              if (confirm(lines.join('\n'))) {
                                deleteCategory(universeId!, cat.id)
                                setActiveTab('categories')
                              }
                            }}
                          >✕</button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>

              {/* Formulaire nouvelle catégorie */}
              <div className="add-attr-form">
                <h3>Créer une catégorie</h3>
                <div className="add-attr-fields">
                  <input
                    value={newCat.icon}
                    onChange={e => setNewCat(v => ({ ...v, icon: e.target.value }))}
                    placeholder="Icône (emoji)"
                    style={{ width: '6rem' }}
                  />
                  <input
                    value={newCat.label}
                    onChange={e => setNewCat(v => ({ ...v, label: e.target.value }))}
                    placeholder="Nom singulier (ex: Dieu)"
                  />
                  <input
                    value={newCat.labelPlural}
                    onChange={e => setNewCat(v => ({ ...v, labelPlural: e.target.value }))}
                    placeholder="Nom pluriel (ex: Dieux)"
                    onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
                  />
                  <button
                    className="btn-primary-sm"
                    onClick={handleAddCategory}
                    disabled={!newCat.label.trim() || !newCat.labelPlural.trim()}
                  >
                    + Créer
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* === Attributs d'une catégorie === */}
          {activeTab !== 'general' && activeTab !== 'categories' && activeConfig && (
            <div>
              <h2 className="panel-title">
                Attributs — {activeConfig.labelPlural}
                {!ELEMENT_TYPES.includes(activeTab as any) && (
                  <span className="attr-default-badge" style={{ marginLeft: '0.75rem', fontSize: '0.75rem' }}>
                    personnalisée
                  </span>
                )}
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
                            onClick={() => moveAttribute(universeId!, activeTab, index, index - 1)}
                            title="Monter"
                          >↑</button>
                          <button
                            disabled={index === template.length - 1}
                            onClick={() => moveAttribute(universeId!, activeTab, index, index + 1)}
                            title="Descendre"
                          >↓</button>
                          <button onClick={() => handleStartEdit(attr)} title="Modifier">✏️</button>
                          {!attr.required && (
                            <button
                              className="danger"
                              title="Supprimer"
                              onClick={() => {
                                if (confirm(`Supprimer l'attribut "${attr.name}" ? Les données existantes seront conservées mais non affichées.`))
                                  removeAttribute(universeId!, activeTab, attr.id)
                              }}
                            >✕</button>
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
