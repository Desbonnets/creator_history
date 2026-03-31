import { useMemo, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useStore } from '../store/StoreContext'
import ImageUpload from '../components/ImageUpload'
import RichTextEditor, { type MentionItem } from '../components/RichTextEditor'
import type { Chapter } from '../types'
import { ELEMENT_CONFIG, getActiveBuiltinTypes } from '../types'

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ')
}

export default function StoryFormPage() {
  const { id: universeId, storyId } = useParams<{ id: string; storyId: string }>()
  const { data, createStory, updateStory, addChapter, updateChapter, deleteChapter, moveChapter } = useStore()
  const navigate = useNavigate()
  const location = useLocation()

  const universe = data.universes.find(u => u.id === universeId)
  const story = universe?.stories.find(s => s.id === storyId)

  // Récupère l'ID du chapitre à ouvrir passé via l'état de navigation
  const navState = location.state as { openChapterId?: string } | null

  const [title, setTitle] = useState(story?.title ?? '')
  const [description, setDescription] = useState(story?.description ?? '')
  const [image, setImage] = useState<string | undefined>(story?.image)
  const [activeChapterId, setActiveChapterId] = useState<string | null>(navState?.openChapterId ?? null)

  // Construit la liste des éléments de l'univers pour les mentions @
  const mentionItems = useMemo<MentionItem[]>(() => {
    if (!universe) return []
    const items: MentionItem[] = []
    const types = [
      ...getActiveBuiltinTypes(universe).map(t => ({ id: t, icon: ELEMENT_CONFIG[t].icon })),
      ...universe.customCategories.map(c => ({ id: c.id, icon: c.icon })),
    ]
    for (const { id: type, icon } of types) {
      for (const el of universe.elements[type] ?? []) {
        const name = el.values['name']
        if (name) items.push({ id: el.id, label: name, icon })
      }
    }
    return items
  }, [universe])

  if (!universe) return <div className="page"><p>Univers introuvable.</p></div>

  const currentStory = universe.stories.find(s => s.id === storyId)
  const chapters = currentStory?.chapters ?? []

  const handleSave = () => {
    if (!title.trim()) return
    if (!storyId) {
      const s = createStory(universeId!, { title: title.trim(), description: description.trim(), image })
      navigate(`/universe/${universeId}/story/${s.id}`, { replace: true })
    } else {
      updateStory(universeId!, storyId, { title: title.trim(), description: description.trim(), image })
    }
  }

  const handleAddChapter = () => {
    if (!storyId) {
      // Histoire pas encore sauvegardée : on crée la story ET le chapitre,
      // puis on navigue en passant l'ID du chapitre dans le state pour l'ouvrir
      if (!title.trim()) return
      const s = createStory(universeId!, { title: title.trim(), description: description.trim(), image })
      const c = addChapter(universeId!, s.id)
      navigate(`/universe/${universeId}/story/${s.id}`, {
        replace: true,
        state: { openChapterId: c.id },
      })
      return
    }
    const c = addChapter(universeId!, storyId)
    setActiveChapterId(c.id)
  }

  const wordCount = chapters.reduce((acc, c) => {
    return acc + stripHtml(c.content).split(/\s+/).filter(Boolean).length
  }, 0)

  return (
    <div className="page story-page">
      <div className="page-header">
        <div>
          <button className="btn-back" onClick={() => navigate(`/universe/${universeId}/stories`)}>
            ← Histoires
          </button>
          <h1>{storyId ? title || "Modifier l'histoire" : 'Nouvelle histoire'}</h1>
          {chapters.length > 0 && (
            <p className="text-muted">{chapters.length} chapitre(s) · {wordCount} mots</p>
          )}
        </div>
        <button className="btn-primary" onClick={handleSave} disabled={!title.trim()}>
          💾 Sauvegarder
        </button>
      </div>

      <div className="story-layout">
        <div className="story-meta-panel">
          <h2 className="panel-title">Informations</h2>
          <div className="form-group">
            <label className="field-label">Titre *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Titre de l'histoire" />
          </div>
          <div className="form-group">
            <label className="field-label">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Résumé de l'histoire…" rows={5} />
          </div>
          <ImageUpload value={image} onChange={setImage} label="Image de couverture" />
        </div>

        <div className="chapters-panel">
          <div className="panel-header">
            <h2>Chapitres <span className="badge">{chapters.length}</span></h2>
            <button className="btn-primary-sm" onClick={handleAddChapter}>+ Ajouter</button>
          </div>

          {chapters.length === 0 ? (
            <div className="empty-state-inline">
              Aucun chapitre.{' '}
              <button className="btn-link" onClick={handleAddChapter}>Ajouter le premier</button>
            </div>
          ) : (
            <div className="chapters-list">
              {chapters.map((chapter, index) => (
                <ChapterCard
                  key={chapter.id}
                  chapter={chapter}
                  index={index}
                  total={chapters.length}
                  isActive={activeChapterId === chapter.id}
                  mentionItems={mentionItems}
                  onToggle={() => setActiveChapterId(activeChapterId === chapter.id ? null : chapter.id)}
                  onUpdate={u => updateChapter(universeId!, storyId!, chapter.id, u)}
                  onDelete={() => {
                    if (confirm('Supprimer ce chapitre ?')) {
                      deleteChapter(universeId!, storyId!, chapter.id)
                      if (activeChapterId === chapter.id) setActiveChapterId(null)
                    }
                  }}
                  onMoveUp={() => moveChapter(universeId!, storyId!, index, index - 1)}
                  onMoveDown={() => moveChapter(universeId!, storyId!, index, index + 1)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface ChapterCardProps {
  chapter: Chapter
  index: number
  total: number
  isActive: boolean
  mentionItems: MentionItem[]
  onToggle(): void
  onUpdate(u: Partial<Chapter>): void
  onDelete(): void
  onMoveUp(): void
  onMoveDown(): void
}

function ChapterCard({ chapter, index, total, isActive, mentionItems, onToggle, onUpdate, onDelete, onMoveUp, onMoveDown }: ChapterCardProps) {
  const words = stripHtml(chapter.content).split(/\s+/).filter(Boolean).length

  return (
    <div className={`chapter-card ${isActive ? 'active' : ''}`}>
      <div className="chapter-header" onClick={onToggle}>
        <div className="chapter-title-row">
          <span className="chapter-num">Ch. {index + 1}</span>
          <span className="chapter-name">{chapter.title || 'Sans titre'}</span>
          {words > 0 && <span className="chapter-word-count">{words} mots</span>}
        </div>
        <div className="chapter-controls" onClick={e => e.stopPropagation()}>
          <button disabled={index === 0} onClick={onMoveUp} title="Monter">↑</button>
          <button disabled={index === total - 1} onClick={onMoveDown} title="Descendre">↓</button>
          <button onClick={onDelete} className="danger" title="Supprimer">🗑</button>
          <span className="chapter-toggle">{isActive ? '▲' : '▼'}</span>
        </div>
      </div>

      {isActive && (
        <div className="chapter-body">
          <div className="form-group">
            <label className="field-label">Titre du chapitre</label>
            <input value={chapter.title} onChange={e => onUpdate({ title: e.target.value })} placeholder="Titre" />
          </div>
          <div className="form-group">
            <label className="field-label">Contenu</label>
            <RichTextEditor
              content={chapter.content}
              onChange={html => onUpdate({ content: html })}
              placeholder="Écrivez votre chapitre ici…"
              mentionItems={mentionItems}
            />
          </div>
        </div>
      )}
    </div>
  )
}
