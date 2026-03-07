import type { AttributeDef } from '../types'
import ImageUpload from './ImageUpload'

interface Props {
  attr: AttributeDef
  value: string
  onChange: (value: string) => void
}

export default function AttributeField({ attr, value, onChange }: Props) {
  const label = (
    <label className="field-label">
      {attr.name}
      {attr.required && <span className="required"> *</span>}
    </label>
  )

  if (attr.type === 'image') {
    return (
      <div className="form-group">
        <ImageUpload value={value || undefined} onChange={v => onChange(v ?? '')} label={attr.name} />
      </div>
    )
  }

  if (attr.type === 'textarea') {
    return (
      <div className="form-group">
        {label}
        <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={attr.name} rows={4} />
      </div>
    )
  }

  if (attr.type === 'select' && attr.options?.length) {
    return (
      <div className="form-group">
        {label}
        <select value={value} onChange={e => onChange(e.target.value)}>
          <option value="">— Choisir —</option>
          {attr.options.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>
    )
  }

  return (
    <div className="form-group">
      {label}
      <input
        type={attr.type === 'number' ? 'number' : attr.type === 'date' ? 'date' : 'text'}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={attr.name}
      />
    </div>
  )
}
