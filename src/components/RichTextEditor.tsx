import { forwardRef, useEffect, useImperativeHandle, useState } from 'react'
import { useEditor, EditorContent, ReactRenderer } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import UnderlineExt from '@tiptap/extension-underline'
import Placeholder from '@tiptap/extension-placeholder'
import CharacterCount from '@tiptap/extension-character-count'
import MentionExt from '@tiptap/extension-mention'
import tippy, { type Instance as TippyInstance } from 'tippy.js'
import 'tippy.js/dist/tippy.css'

export interface MentionItem {
  id: string
  label: string
  icon: string
}

interface Props {
  content: string
  onChange: (html: string) => void
  placeholder?: string
  mentionItems?: MentionItem[]
}

// Convertit le texte brut en HTML si nécessaire
function toHtml(content: string): string {
  if (!content) return ''
  if (content.trimStart().startsWith('<')) return content
  return content
    .split('\n\n')
    .map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`)
    .join('')
}

// ── Popup de mention ──────────────────────────────────────────────────────────

interface MentionListProps {
  items: MentionItem[]
  command: (item: { id: string; label: string }) => void
}
interface MentionListHandle {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean
}

const MentionList = forwardRef<MentionListHandle, MentionListProps>((props, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0)

  const selectItem = (index: number) => {
    const item = props.items[index]
    if (item) props.command({ id: item.id, label: item.label })
  }

  useEffect(() => setSelectedIndex(0), [props.items])

  useImperativeHandle(ref, () => ({
    onKeyDown({ event }) {
      if (event.key === 'ArrowUp') {
        setSelectedIndex(i => (i + props.items.length - 1) % props.items.length)
        return true
      }
      if (event.key === 'ArrowDown') {
        setSelectedIndex(i => (i + 1) % props.items.length)
        return true
      }
      if (event.key === 'Enter') {
        selectItem(selectedIndex)
        return true
      }
      return false
    },
  }))

  if (!props.items.length) {
    return (
      <div className="mention-popup">
        <div className="mention-empty">Aucun résultat</div>
      </div>
    )
  }

  return (
    <div className="mention-popup">
      {props.items.map((item, index) => (
        <button
          key={item.id}
          type="button"
          className={`mention-item${index === selectedIndex ? ' active' : ''}`}
          onClick={() => selectItem(index)}
        >
          <span className="mention-item-icon">{item.icon}</span>
          {item.label}
        </button>
      ))}
    </div>
  )
})
MentionList.displayName = 'MentionList'

// ── Bouton toolbar ────────────────────────────────────────────────────────────

function ToolBtn({ onClick, active, disabled, title, children }: {
  onClick: () => void
  active?: boolean
  disabled?: boolean
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      className={`editor-tool-btn${active ? ' active' : ''}`}
      onMouseDown={e => { e.preventDefault(); onClick() }}
      disabled={disabled}
      title={title}
    >
      {children}
    </button>
  )
}

const Sep = () => <div className="editor-sep" />

// ── Composant principal ───────────────────────────────────────────────────────

export default function RichTextEditor({ content, onChange, placeholder, mentionItems = [] }: Props) {
  const [spellCheck, setSpellCheck] = useState(true)
  const [fullscreen, setFullscreen] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit,
      UnderlineExt,
      Placeholder.configure({ placeholder: placeholder ?? 'Écrivez votre chapitre ici…' }),
      CharacterCount,
      ...(mentionItems.length > 0
        ? [
            MentionExt.configure({
              HTMLAttributes: { class: 'mention' },
              suggestion: {
                items: ({ query }) =>
                  mentionItems
                    .filter(m => m.label.toLowerCase().includes(query.toLowerCase()))
                    .slice(0, 10),
                render: () => {
                  let component: ReactRenderer<MentionListHandle>
                  let popup: TippyInstance[]

                  return {
                    onStart: props => {
                      component = new ReactRenderer(MentionList, {
                        props,
                        editor: props.editor,
                      })
                      if (!props.clientRect) return
                      popup = tippy('body', {
                        getReferenceClientRect: props.clientRect as () => DOMRect,
                        appendTo: () => document.body,
                        content: component.element,
                        showOnCreate: true,
                        interactive: true,
                        trigger: 'manual',
                        placement: 'bottom-start',
                        theme: 'mention',
                      }) as TippyInstance[]
                    },
                    onUpdate: props => {
                      component.updateProps(props)
                      if (props.clientRect) {
                        popup[0]?.setProps({ getReferenceClientRect: props.clientRect as () => DOMRect })
                      }
                    },
                    onKeyDown: props => {
                      if (props.event.key === 'Escape') {
                        popup[0]?.hide()
                        return true
                      }
                      return component.ref?.onKeyDown(props) ?? false
                    },
                    onExit: () => {
                      popup[0]?.destroy()
                      component.destroy()
                    },
                  }
                },
              },
            }),
          ]
        : []),
    ],
    content: toHtml(content),
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  })

  // Synchronise l'attribut spellcheck sur le DOM de l'éditeur
  useEffect(() => {
    if (!editor) return
    const el = editor.view.dom as HTMLElement
    el.setAttribute('spellcheck', String(spellCheck))
  }, [editor, spellCheck])

  // Touche Échap pour quitter le plein écran
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && fullscreen) setFullscreen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [fullscreen])

  if (!editor) return null

  return (
    <div className={`rich-editor${fullscreen ? ' rich-editor--fullscreen' : ''}`}>
      {/* Barre d'outils */}
      <div className="editor-toolbar">
        <ToolBtn onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Annuler (Ctrl+Z)">↩</ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Rétablir (Ctrl+Y)">↪</ToolBtn>
        <Sep />
        <ToolBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Gras (Ctrl+B)"><b>G</b></ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italique (Ctrl+I)"><i>I</i></ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Souligné (Ctrl+U)"><u>S</u></ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Barré"><s>B</s></ToolBtn>
        <Sep />
        <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="Titre 1">T1</ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Titre 2">T2</ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Titre 3">T3</ToolBtn>
        <Sep />
        <ToolBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Liste à puces">• —</ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Liste numérotée">1.</ToolBtn>
        <Sep />
        <ToolBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Citation">❝</ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Séparateur">—</ToolBtn>
        <Sep />
        <ToolBtn onClick={() => setSpellCheck(s => !s)} active={spellCheck} title={spellCheck ? 'Désactiver le correcteur' : 'Activer le correcteur'}>✓abc</ToolBtn>
        <ToolBtn onClick={() => setFullscreen(f => !f)} active={fullscreen} title={fullscreen ? 'Quitter le plein écran (Échap)' : 'Plein écran'}>
          {fullscreen ? '⤡' : '⤢'}
        </ToolBtn>
      </div>

      {/* Zone d'écriture */}
      <EditorContent editor={editor} className="editor-content" />

      {/* Pied de page */}
      <div className="editor-footer">
        <span>
          {(editor.storage.characterCount as { words: () => number }).words()} mots
          {' · '}
          {(editor.storage.characterCount as { characters: () => number }).characters()} caractères
        </span>
        {mentionItems.length > 0 && (
          <span className="editor-hint">Tapez @ pour mentionner un élément</span>
        )}
      </div>
    </div>
  )
}
