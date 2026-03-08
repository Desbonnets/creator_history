import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import type { AppData, Universe, Story, Chapter, GenericElement, AttributeDef, CustomCategoryDef, ElementType } from '../types'
import { DEFAULT_TEMPLATES } from './defaultTemplates'

const STORAGE_KEY = 'worldbuilder_data'

function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

const emptyData: AppData = { universes: [], version: '1.0.0' }

function load(): AppData {
  try {
    const s = localStorage.getItem(STORAGE_KEY)
    if (!s) return emptyData
    const d: AppData = JSON.parse(s)
    // migration
    d.universes = d.universes.map(u => ({
      ...u,
      customCategories: u.customCategories ?? [],
      disabledTypes: u.disabledTypes ?? [],
      typeOverrides: u.typeOverrides ?? {},
    }))
    return d
  } catch {
    return emptyData
  }
}

interface Ctx {
  data: AppData
  createUniverse(name: string, description: string, image?: string): Universe
  updateUniverse(id: string, updates: Partial<Pick<Universe, 'name' | 'description' | 'image'>>): void
  deleteUniverse(id: string): void
  createStory(universeId: string, d: { title: string; description: string; image?: string }): Story
  updateStory(universeId: string, storyId: string, updates: Partial<Story>): void
  deleteStory(universeId: string, storyId: string): void
  addChapter(universeId: string, storyId: string): Chapter
  updateChapter(universeId: string, storyId: string, chapterId: string, updates: Partial<Chapter>): void
  deleteChapter(universeId: string, storyId: string, chapterId: string): void
  moveChapter(universeId: string, storyId: string, from: number, to: number): void
  createElement(universeId: string, type: string, values: Record<string, string>): GenericElement
  updateElement(universeId: string, type: string, elementId: string, values: Record<string, string>): void
  deleteElement(universeId: string, type: string, elementId: string): void
  addAttribute(universeId: string, type: string, attr: Omit<AttributeDef, 'id'>): AttributeDef
  updateAttribute(universeId: string, type: string, attrId: string, updates: Partial<Omit<AttributeDef, 'id' | 'required'>>): void
  removeAttribute(universeId: string, type: string, attrId: string): void
  moveAttribute(universeId: string, type: string, from: number, to: number): void
  addCategory(universeId: string, def: Omit<CustomCategoryDef, 'id'>): CustomCategoryDef
  updateCategory(universeId: string, categoryId: string, updates: Partial<Omit<CustomCategoryDef, 'id'>>): void
  deleteCategory(universeId: string, categoryId: string): void
  disableBuiltinType(universeId: string, type: ElementType): void
  overrideBuiltinType(universeId: string, type: ElementType, updates: { label?: string; labelPlural?: string; icon?: string }): void
  importData(d: AppData): void
}

const StoreContext = createContext<Ctx | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(load)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }, [data])

  const now = () => new Date().toISOString()

  const setUniverses = (fn: (list: Universe[]) => Universe[]) =>
    setData(d => ({ ...d, universes: fn(d.universes) }))

  const mapUniverse = (id: string, fn: (u: Universe) => Universe) =>
    setUniverses(list => list.map(u => u.id === id ? fn(u) : u))

  // --- Univers ---
  const createUniverse = (name: string, description: string, image?: string): Universe => {
    const u: Universe = {
      id: genId(), name, description, image,
      stories: [],
      customCategories: [],
      disabledTypes: [],
      typeOverrides: {},
      templates: structuredClone(DEFAULT_TEMPLATES),
      elements: { character: [], faction: [], location: [], item: [], animal: [], monster: [] },
      relations: [],
      createdAt: now(), updatedAt: now(),
    }
    setUniverses(list => [...list, u])
    return u
  }

  const updateUniverse = (id: string, updates: Partial<Pick<Universe, 'name' | 'description' | 'image'>>) =>
    mapUniverse(id, u => ({ ...u, ...updates, updatedAt: now() }))

  const deleteUniverse = (id: string) =>
    setUniverses(list => list.filter(u => u.id !== id))

  // --- Histoires ---
  const mapStories = (uid: string, fn: (s: Story[]) => Story[]) =>
    mapUniverse(uid, u => ({ ...u, stories: fn(u.stories), updatedAt: now() }))

  const createStory = (uid: string, d: { title: string; description: string; image?: string }): Story => {
    const s: Story = { id: genId(), ...d, chapters: [], createdAt: now(), updatedAt: now() }
    mapStories(uid, list => [...list, s])
    return s
  }

  const updateStory = (uid: string, sid: string, updates: Partial<Story>) =>
    mapStories(uid, list => list.map(s => s.id === sid ? { ...s, ...updates, updatedAt: now() } : s))

  const deleteStory = (uid: string, sid: string) =>
    mapStories(uid, list => list.filter(s => s.id !== sid))

  // --- Chapitres ---
  const mapChapters = (uid: string, sid: string, fn: (c: Chapter[]) => Chapter[]) =>
    mapStories(uid, list => list.map(s => s.id === sid ? { ...s, chapters: fn(s.chapters), updatedAt: now() } : s))

  const addChapter = (uid: string, sid: string): Chapter => {
    const c: Chapter = { id: genId(), title: 'Nouveau chapitre', content: '', images: [] }
    mapChapters(uid, sid, list => [...list, c])
    return c
  }

  const updateChapter = (uid: string, sid: string, cid: string, updates: Partial<Chapter>) =>
    mapChapters(uid, sid, list => list.map(c => c.id === cid ? { ...c, ...updates } : c))

  const deleteChapter = (uid: string, sid: string, cid: string) =>
    mapChapters(uid, sid, list => list.filter(c => c.id !== cid))

  const moveChapter = (uid: string, sid: string, from: number, to: number) =>
    mapChapters(uid, sid, list => {
      const arr = [...list]
      const [item] = arr.splice(from, 1)
      arr.splice(to, 0, item)
      return arr
    })

  // --- Éléments ---
  const mapElements = (uid: string, type: string, fn: (list: GenericElement[]) => GenericElement[]) =>
    mapUniverse(uid, u => ({
      ...u,
      elements: { ...u.elements, [type]: fn(u.elements[type] ?? []) },
      updatedAt: now(),
    }))

  const createElement = (uid: string, type: string, values: Record<string, string>): GenericElement => {
    const el: GenericElement = { id: genId(), values, createdAt: now(), updatedAt: now() }
    mapElements(uid, type, list => [...list, el])
    return el
  }

  const updateElement = (uid: string, type: string, eid: string, values: Record<string, string>) =>
    mapElements(uid, type, list => list.map(el => el.id === eid ? { ...el, values, updatedAt: now() } : el))

  const deleteElement = (uid: string, type: string, eid: string) =>
    mapElements(uid, type, list => list.filter(el => el.id !== eid))

  // --- Templates ---
  const mapTemplate = (uid: string, type: string, fn: (attrs: AttributeDef[]) => AttributeDef[]) =>
    mapUniverse(uid, u => ({
      ...u,
      templates: { ...u.templates, [type]: fn(u.templates[type] ?? []) },
      updatedAt: now(),
    }))

  const addAttribute = (uid: string, type: string, attr: Omit<AttributeDef, 'id'>): AttributeDef => {
    const a: AttributeDef = { id: genId(), ...attr }
    mapTemplate(uid, type, list => [...list, a])
    return a
  }

  const updateAttribute = (uid: string, type: string, attrId: string, updates: Partial<Omit<AttributeDef, 'id' | 'required'>>) =>
    mapTemplate(uid, type, list => list.map(a => a.id === attrId ? { ...a, ...updates } : a))

  const removeAttribute = (uid: string, type: string, attrId: string) =>
    mapTemplate(uid, type, list => list.filter(a => a.id !== attrId || a.required))

  const moveAttribute = (uid: string, type: string, from: number, to: number) =>
    mapTemplate(uid, type, list => {
      const arr = [...list]
      const [item] = arr.splice(from, 1)
      arr.splice(to, 0, item)
      return arr
    })

  // --- Catégories personnalisées ---
  const addCategory = (uid: string, def: Omit<CustomCategoryDef, 'id'>): CustomCategoryDef => {
    const cat: CustomCategoryDef = { id: genId(), ...def }
    mapUniverse(uid, u => ({
      ...u,
      customCategories: [...u.customCategories, cat],
      templates: { ...u.templates, [cat.id]: [
        { id: 'name', name: 'Nom', type: 'text', isDefault: true, required: true },
        { id: 'image', name: 'Image', type: 'image', isDefault: true },
        { id: 'description', name: 'Description', type: 'textarea', isDefault: true },
      ]},
      elements: { ...u.elements, [cat.id]: [] },
      updatedAt: now(),
    }))
    return cat
  }

  const updateCategory = (uid: string, categoryId: string, updates: Partial<Omit<CustomCategoryDef, 'id'>>) =>
    mapUniverse(uid, u => ({
      ...u,
      customCategories: u.customCategories.map(c => c.id === categoryId ? { ...c, ...updates } : c),
      updatedAt: now(),
    }))

  const deleteCategory = (uid: string, categoryId: string) =>
    mapUniverse(uid, u => {
      const { [categoryId]: _t, ...templates } = u.templates
      const { [categoryId]: _e, ...elements } = u.elements
      return {
        ...u,
        customCategories: u.customCategories.filter(c => c.id !== categoryId),
        templates,
        elements,
        updatedAt: now(),
      }
    })

  const overrideBuiltinType = (uid: string, type: ElementType, updates: { label?: string; labelPlural?: string; icon?: string }) =>
    mapUniverse(uid, u => ({
      ...u,
      typeOverrides: {
        ...u.typeOverrides,
        [type]: { ...(u.typeOverrides[type] ?? {}), ...updates },
      },
      updatedAt: now(),
    }))

  const disableBuiltinType = (uid: string, type: ElementType) =>
    mapUniverse(uid, u => {
      const { [type]: _t, ...templates } = u.templates
      const { [type]: _e, ...elements } = u.elements
      return {
        ...u,
        disabledTypes: [...u.disabledTypes, type],
        templates,
        elements,
        updatedAt: now(),
      }
    })

  const importData = (d: AppData) => setData(d)

  return (
    <StoreContext.Provider value={{
      data,
      createUniverse, updateUniverse, deleteUniverse,
      createStory, updateStory, deleteStory,
      addChapter, updateChapter, deleteChapter, moveChapter,
      createElement, updateElement, deleteElement,
      addAttribute, updateAttribute, removeAttribute, moveAttribute,
      addCategory, updateCategory, deleteCategory, disableBuiltinType, overrideBuiltinType,
      importData,
    }}>
      {children}
    </StoreContext.Provider>
  )
}

export function useStore(): Ctx {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
