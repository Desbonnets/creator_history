export type ElementType = 'character' | 'faction' | 'location' | 'item' | 'animal' | 'monster'
export type AttributeType = 'text' | 'textarea' | 'number' | 'date' | 'select' | 'image'

export const ELEMENT_TYPES: ElementType[] = ['character', 'faction', 'location', 'item', 'animal', 'monster']

export const ELEMENT_CONFIG: Record<ElementType, { label: string; labelPlural: string; icon: string }> = {
  character: { label: 'Personnage', labelPlural: 'Personnages', icon: '👤' },
  faction:   { label: 'Faction',    labelPlural: 'Factions',    icon: '⚔️' },
  location:  { label: 'Lieu',       labelPlural: 'Lieux',       icon: '🏔️' },
  item:      { label: 'Objet',      labelPlural: 'Objets',      icon: '🗡️' },
  animal:    { label: 'Animal',     labelPlural: 'Animaux',     icon: '🐾' },
  monster:   { label: 'Monstre',    labelPlural: 'Monstres',    icon: '👹' },
}

export interface CustomCategoryDef {
  id: string
  label: string
  labelPlural: string
  icon: string
}

export function getCategoryConfig(
  universe: Universe,
  type: string,
): { label: string; labelPlural: string; icon: string } | null {
  if (type in ELEMENT_CONFIG) {
    const base = ELEMENT_CONFIG[type as ElementType]
    const ov = universe.typeOverrides?.[type] ?? {}
    return { ...base, ...ov }
  }
  return universe.customCategories.find(c => c.id === type) ?? null
}

export interface AttributeDef {
  id: string
  name: string
  type: AttributeType
  options?: string[]   // pour type 'select'
  isDefault: boolean
  required?: boolean   // ne peut pas être supprimé
}

export interface GenericElement {
  id: string
  values: Record<string, string>  // attributeId -> valeur
  createdAt: string
  updatedAt: string
}

export interface Chapter {
  id: string
  title: string
  content: string
  images: string[]
}

export interface Story {
  id: string
  title: string
  description: string
  image?: string
  chapters: Chapter[]
  createdAt: string
  updatedAt: string
}

export interface Relation {
  id: string
  sourceId: string
  sourceType: string
  targetId: string
  targetType: string
  relationType: string
}

export interface Universe {
  id: string
  name: string
  description: string
  image?: string
  stories: Story[]
  customCategories: CustomCategoryDef[]
  disabledTypes: string[]          // catégories par défaut désactivées
  typeOverrides: Record<string, { label?: string; labelPlural?: string; icon?: string }>
  templates: Record<string, AttributeDef[]>
  elements: Record<string, GenericElement[]>
  relations: Relation[]
  createdAt: string
  updatedAt: string
}

/** Retourne les types built-in actifs pour un univers */
export function getActiveBuiltinTypes(universe: Universe): ElementType[] {
  return ELEMENT_TYPES.filter(t => !universe.disabledTypes.includes(t))
}

export interface AppData {
  universes: Universe[]
  version: string
}
