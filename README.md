# Creator History — Outil de world-building narratif

Application web de gestion d'univers fictifs : personnages, lieux, factions, histoires et bien plus, le tout stocké localement dans le navigateur.

## Fonctionnalites

- **Gestion multi-univers** : creez autant d'univers que vous souhaitez, chacun independant avec ses propres donnees.
- **Elements narratifs** : chaque univers contient 6 types d'elements configurables :
  - Personnages, Factions, Lieux, Objets, Animaux, Monstres
- **Attributs personnalisables** : ajoutez, reordonnez et supprimez des attributs (texte, zone de texte, nombre, date, liste, image) pour chaque type d'element.
- **Histoires et chapitres** : redigez des recits structures en chapitres, avec images et description.
- **Images** : chaque univers, element et histoire peut avoir une image de couverture (stockee en base64).
- **Export / Import ZIP** : sauvegardez toutes vos donnees dans un fichier `.zip` et reimportez-les a tout moment.
- **Persistence locale** : les donnees sont sauvegardees automatiquement dans le `localStorage` du navigateur, aucun serveur requis.

## Stack technique

| Technologie | Role |
|---|---|
| React 19 | UI |
| TypeScript | Typage statique |
| React Router DOM 7 | Navigation SPA |
| JSZip | Export / import ZIP |
| Vite | Bundler et serveur de dev |

## Structure du projet

```
src/
  components/       # Composants reutilisables (Layout, ImageUpload, AttributeField)
  pages/            # Pages de l'application
  store/            # Contexte global (StoreContext) et templates par defaut
  types/            # Types TypeScript partages
  utils/            # Utilitaires (export/import ZIP)
```

## Installation et lancement

```bash
npm install
npm run dev
```

L'application sera disponible sur `http://localhost:5173`.

## Scripts disponibles

| Commande | Description |
|---|---|
| `npm run dev` | Serveur de developpement avec HMR |
| `npm run build` | Build de production |
| `npm run preview` | Previsualiser le build de production |
| `npm run lint` | Analyse statique ESLint |

## Donnees et persistence

Toutes les donnees sont stockees dans le `localStorage` sous la cle `worldbuilder_data`. Aucune donnee n'est envoyee vers un serveur.

Pour sauvegarder ou transferer vos donnees, utilisez la fonction **Export ZIP** disponible dans les parametres de l'application. Le fichier genere contient un `data.json` avec l'integralite de vos univers.
