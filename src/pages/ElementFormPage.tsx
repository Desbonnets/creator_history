import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useStore } from '../store/StoreContext'
import type { ElementType } from '../types'
import { ELEMENT_CONFIG } from '../types'
import AttributeField from '../components/AttributeField'

export default function ElementFormPage() {
  const { id: universeId, type, elementId } = useParams<{ id: string; type: string; elementId: string }>()
  const { data, createElement, updateElement } = useStore()
  const navigate = useNavigate()

  const universe = data.universes.find(u => u.id === universeId)
  if (!universe) return <div className="page"><p>Univers introuvable.</p></div>

  const elementType = type as ElementType
  const config = ELEMENT_CONFIG[elementType]
  const template = universe.templates[elementType] ?? []
  const existing = elementId ? universe.elements[elementType]?.find(el => el.id === elementId) : undefined

  const [values, setValues] = useState<Record<string, string>>(existing?.values ?? {})

  const setValue = (attrId: string, val: string) => setValues(v => ({ ...v, [attrId]: val }))

  const handleSave = () => {
    if (!values['name']?.trim()) return
    if (elementId) {
      updateElement(universeId!, elementType, elementId, values)
    } else {
      createElement(universeId!, elementType, values)
    }
    navigate(`/universe/${universeId}/${type}`)
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <button className="btn-back" onClick={() => navigate(`/universe/${universeId}/${type}`)}>
            ← {config.labelPlural}
          </button>
          <h1>
            {elementId
              ? `Modifier ${config.label.toLowerCase()}`
              : `Nouveau ${config.label.toLowerCase()}`}
          </h1>
        </div>
        <button className="btn-primary" onClick={handleSave} disabled={!values['name']?.trim()}>
          💾 Sauvegarder
        </button>
      </div>

      <div className="form-panel">
        {template.map(attr => (
          <AttributeField
            key={attr.id}
            attr={attr}
            value={values[attr.id] ?? ''}
            onChange={v => setValue(attr.id, v)}
          />
        ))}
        {template.length === 0 && (
          <p className="text-muted">Aucun attribut configuré pour ce type.</p>
        )}
      </div>
    </div>
  )
}
