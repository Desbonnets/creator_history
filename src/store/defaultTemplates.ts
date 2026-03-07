import type { AttributeDef, ElementType } from '../types'

const d = (id: string, name: string, type: AttributeDef['type'], extra?: Partial<AttributeDef>): AttributeDef => ({
  id, name, type, isDefault: true, ...extra,
})

export const DEFAULT_TEMPLATES: Record<ElementType, AttributeDef[]> = {
  character: [
    d('name',        'Nom',         'text',     { required: true }),
    d('image',       'Image',       'image'),
    d('description', 'Description', 'textarea'),
    d('age',         'Âge',         'number'),
    d('role',        'Rôle',        'text'),
    d('faction',     'Faction',     'text'),
    d('relations',   'Relations',   'textarea'),
  ],
  faction: [
    d('name',        'Nom',             'text',     { required: true }),
    d('image',       'Image / Symbole', 'image'),
    d('description', 'Description',     'textarea'),
    d('territory',   'Territoire',      'text'),
  ],
  location: [
    d('name',            'Nom',              'text',     { required: true }),
    d('image',           'Image',            'image'),
    d('description',     'Description',      'textarea'),
    d('region',          'Région',           'text'),
    d('dominantFaction', 'Faction dominante','text'),
    d('inhabitants',     'Habitants',        'textarea'),
  ],
  item: [
    d('name',        'Nom',          'text',     { required: true }),
    d('image',       'Image',        'image'),
    d('description', 'Description',  'textarea'),
    d('category',    'Catégorie',    'text'),
    d('owner',       'Propriétaire', 'text'),
    d('rarity',      'Rareté',       'select', { options: ['Commun', 'Peu commun', 'Rare', 'Épique', 'Légendaire'] }),
  ],
  animal: [
    d('name',        'Nom',          'text',     { required: true }),
    d('image',       'Image',        'image'),
    d('description', 'Description',  'textarea'),
    d('behavior',    'Comportement', 'text'),
    d('habitat',     'Habitat',      'text'),
  ],
  monster: [
    d('name',          'Nom',                        'text',     { required: true }),
    d('image',         'Image',                      'image'),
    d('description',   'Description',                'textarea'),
    d('power',         'Puissance',                  'text'),
    d('habitat',       'Habitat',                    'text'),
    d('specialTraits', 'Caractéristiques spéciales', 'textarea'),
  ],
}
