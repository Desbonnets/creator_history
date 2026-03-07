import { useRef } from 'react'

interface Props {
  value?: string
  onChange: (base64: string | undefined) => void
  label?: string
}

export default function ImageUpload({ value, onChange, label = 'Image' }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = e => onChange(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  return (
    <div className="image-upload">
      {label && <label className="field-label">{label}</label>}
      <div
        className={`image-drop-zone ${value ? 'has-image' : ''}`}
        onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f?.type.startsWith('image/')) handleFile(f) }}
        onDragOver={e => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
      >
        {value ? (
          <img src={value} alt="preview" />
        ) : (
          <div className="drop-placeholder">
            <span>🖼️</span>
            <p>Cliquer ou glisser une image</p>
          </div>
        )}
      </div>
      {value && (
        <button type="button" className="btn-danger-sm" onClick={() => onChange(undefined)}>
          Supprimer l'image
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }}
      />
    </div>
  )
}
