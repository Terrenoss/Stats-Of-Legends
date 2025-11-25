# Stats Of Legends – Frontend & Données (Documentation détaillée)

Ce document complète le `README.md` principal en se concentrant sur :

- l’architecture globale (Next.js + ancien frontend Vite migré),
- les dépendances techniques importantes,
- la manière dont les données (patchs, champions, items, runes) sont récupérées et mises à jour,
- le fonctionnement des principales features (Builder, Gemini, Riot, i18n),
- les commandes pour lancer, tester et mettre à jour.

> **Important** : le dossier `frontend/` contient l’UI originale Vite. Dans le projet final, l’UI est migrée sous `src/legacy-frontend/` et/ou intégrée aux pages Next. Garder ce fichier comme référence fonctionnelle même si le dossier `frontend/` est supprimé.

---

## 1. Stack technique

### 1.1. Côté application principale (dossier racine)

- **Framework** : [Next.js 14+](https://nextjs.org/) avec **App Router** (`app/`)
- **Langage** : TypeScript
- **UI** : React 18 + **Tailwind CSS**
- **Tests** : Jest (`tests/*.test.ts[x]`)
- **Gestion de patchs / données** : fichiers JSON dans `data/` + API internes
- **APIs internes** (Next Route Handlers) dans `app/api/**` :
  - `app/api/dd/**` : données Data Dragon (champions, items, runes…)
  - `app/api/riot/**` : intégration Riot (summoner, matchs, résumé…)
  - `app/api/gemini/**` : intégration Google Gemini pour analyse de builds / matchs
  - `app/api/version/**` : gestion du patch courant et du patch pending
  - `app/api/hooks/**` : webhooks internes (ex. mise à jour de patch)

### 1.2. Ancien frontend Vite (dossier `frontend/`)

> Utilisé au départ comme **référence d’UI**. La logique a été progressivement migrée dans `src/legacy-frontend/` et les composants Next.

- **Vite + React + TypeScript**
- **Tailwind CSS** (config dédiée `frontend/tailwind.config.ts`)
- **Dossier clés** :
  - `frontend/components/` : composants principaux (Navbar, Builder, SearchHero, etc.)
  - `frontend/services/` : appels Gemini / Riot côté SPA
  - `frontend/public/data/` : snapshot local de données pour la démo
  - `frontend/public/i18n/` : traductions JSON (`en.json`, `fr.json`)

### 1.3. Styles & design system

- **Tailwind CSS** est utilisé partout (classes utilitaires). 
- Palette inspirée de League of Legends : `lol-gold`, `lol-red`, `lol-hextech`, etc.
- Globaux Next : `styles/globals.css` / `app/globals.css`.

---

## 2. Structure des dossiers importante

À la racine du projet Next :

- `app/`
  - `layout.tsx` : layout racine Next
  - `page.tsx` : page d’accueil (intègre / réutilise l’UI migrée)
  - `api/` : toutes les route handlers (Riot, Gemini, DD, version…)
- `src/`
  - `components/`
    - `MainApp.tsx` : point d’entrée client important
    - `PatchBanner.tsx` : bannière d’annonce de nouveau patch (version pending)
    - `ClientHydrationCleanup.tsx` : utilitaire pour éviter les bugs SSR/CSR
    - `BuildControls/`, `ChampionSelect/`, `Items/`, `RunesBuilder/`, etc. : composants métiers
  - `hooks/`
    - `useI18n.ts` : hook d’internationalisation basé sur les fichiers `public/i18n`
    - `useItemsDndLogic.ts` : logique de drag & drop des items
    - `useItemTooltip.ts` : logique d’affichage des tooltips d’items
  - `lib/`
    - `api/` : helpers pour consommer vos propres APIs Next côté client
    - `dd/` : logic spécifique Data Dragon (mapping, parsing…)
    - `patch/` : gestion du patch courant/pending côté serveur
    - `riot/` : wrappers et helpers pour l’API Riot
    - `runes/` : logique et modèles de runes/shards
    - `server/` : utilitaires Next/server
    - `utils/` : fonctions utilitaires génériques
  - `stores/`
    - `useBuildStore.ts` : store Zustand (ou équivalent) pour l’état de build (items, runes…)
- `data/`
  - `patch-state.json` : métadonnées globale du patch
  - `15.22.1/` et `15.23.1/` :
    - `champion.json` : champions et stats
    - `item.json` : items
    - `manifest.json` : manifest Data Dragon
    - `runesReforged.json` : runes officielles
- `scripts/`
  - `fetch-ddragon.js` : récupère les données Data Dragon et les stocke dans `data/`
  - `copy-dd-to-public.js` : copie certaines données vers `frontend/public/data/` si nécessaire
- `frontend/`
  - `components/` : UI Vite originale
  - `hooks/`, `services/`, `types.ts`, `constants.ts`
- `frontendback/`
  - `public/i18n/` : fichiers i18n originaux supplémentaires

---

## 3. Données & mises à jour

### 3.1. Sources de vérité

Les **données de jeu** (champions, items, runes, manifest) viennent de **Riot Data Dragon**. Elles sont matérialisées en JSON dans `data/<patch>/` :

- `data/15.23.1/champion.json`
- `data/15.23.1/item.json`
- `data/15.23.1/runesReforged.json`
- `data/15.23.1/manifest.json`

> Le numéro de patch courant est stocké dans `data/patch-state.json`.

Exemple du fichier `data/patch-state.json` :

```json
{
  "pending": {
    "version": "15.23.1",
    "detectedAt": "2025-11-21T12:58:08.614Z",
    "startedAt": "2025-11-21T12:58:08.614Z",
    "status": "success",
    "triggeredBy": "auto",
    "completedAt": "2025-11-21T12:58:08.722Z"
  },
  "currentPatch": "15.23.1"
}
```

- `currentPatch` : le patch actuellement utilisé par l’appli
- `pending` : un patch détecté comme disponible mais pas encore promu en `currentPatch`

### 3.2. Pipeline de mise à jour des données (Data Dragon)

1. **Récupération automatique Data Dragon**
   - Script : `scripts/fetch-ddragon.js`
   - Rôle :
     - interroger Data Dragon pour un patch donné,
     - télécharger les `champion.json`, `item.json`, `manifest.json`, `runesReforged.json`,
     - les écrire dans un nouveau dossier `data/<patch>/`.

2. **Mise à jour de `patch-state.json`**
   - Une fois les fichiers du patch téléchargés, `patch-state.json` est mis à jour avec :
     - `pending.version` = nouveau patch,
     - timstamps de `detectedAt`, `startedAt`, `completedAt`.
   - Une API dédiée (ex. `app/api/admin/patches`) peut ensuite **promouvoir** ce patch en `currentPatch`.

3. **Appli côté Next**
   - Côté serveur, `src/lib/patch/patchServer.ts` expose `getCurrentPatch()` :
     - lit `data/patch-state.json`,
     - renvoie un objet `PatchState` (current, pending, status…)
   - L’endpoint Next `app/api/version/current/route.ts` renvoie ces infos au client.
   - Le composant `src/components/PatchBanner.tsx` consomme cette API pour afficher :
     - le patch courant,
     - un bandeau « Nouvelle version disponible » si `pending.version` ≠ `currentPatch`.

### 3.3. URL de notes de patch League of Legends

- Fichier : `src/lib/riot/patchNotes.ts`
- Fonction clé : `buildPatchNotesUrl({ version, locale })`

Fonctionnement :

1. **Normalisation de la version** (`normalizeVersion`) :
   - nettoie la string (garde seulement chiffres, `.` et `-`),
   - découpe en parties et reconstruit un format `major.minor.build`, par ex. `15.23.1`.

2. **Génération de candidats d’URL** (`buildCandidates`) :
   - À partir de `15.23.1`, construit :
     - `patch-15-23-notes`
     - `patch-15-23`
     - `patch-15.23`
     - `patch-15-23-1-notes`

3. **Test des URLs en ligne** (`probeUrl`) :
   - essaie `HEAD` puis `GET` sur :
     - `https://www.leagueoflegends.com/{locale}/news/game-updates/{slug}/`
   - locales testées :
     - d’abord la locale demandée (`fr-fr`, `en-us`, etc.),
     - puis `en-us` en fallback si nécessaire.

4. **Retour** :
   - renvoie la **première URL valide**, ou
   - fallback générique sur la page tag `patch-notes` :
     - `https://www.leagueoflegends.com/{locale}/news/tags/patch-notes`.

> Dans la navbar frontend Vite, le texte `15.23.1` peut être rendu cliquable en pointant vers l’URL retournée par cette fonction, ou une URL spécifique fournie (ex. `https://www.leagueoflegends.com/fr-fr/news/game-updates/patch-25-23-notes/`).

---

## 4. Fonctionnement des principales features

### 4.1. Builder d’items (onglet Builder)

**Objectif** : construire un build d’items pour un champion, voir ses stats finales, estimer les dégâts d’un combo, demander une analyse coachée par l’IA (Gemini).

#### 4.1.1. Données utilisées

- Types : `frontend/types.ts` (migrés dans `src/legacy-frontend/types` ou équivalent)
  - `Item`, `Champion`, `Stats`, `DummyStats`, `Language`, `ItemTag`…
- Constantes : `frontend/constants.ts`
  - `BUILDER_ITEMS` : catalogue des items disponibles dans l’onglet Builder
  - `MOCK_CHAMPIONS` : liste de champions mockés avec stats de base et growth
  - `DEFAULT_DUMMY` : stats du « target dummy » par défaut
  - `TRANSLATIONS` : libellés (home, builder, reset, etc.) pour le builder

#### 4.1.2. Composant `Builder`

- Fichier d’origine : `frontend/components/Builder.tsx`
- Principales responsabilités :
  - Affichage du **catalogue d’items** à gauche (recherche + filtres de stats + virtualisation)
  - Gestion des **6 slots d’items** au centre (drag & drop, undo/redo, reset)
  - Affichage des **stats finales** du champion à droite
  - Gestion du **target dummy** et du calcul de dégâts
  - Envoi de la configuration à Gemini pour obtenir une analyse textuelle

**Hooks & état principaux** :

- `useHistory` :
  - gère `selectedItems` avec historique (undo/redo), ex. :
    - `state`, `set`, `undo`, `redo`, `canUndo`, `canRedo`, `reset`
  - initialisation : `[null, null, null, null, null, null]` (6 slots)

- États locaux :
  - `currentChampion` (champion courant)
  - `championLevel` (niveau 1–18)
  - `spellLevels` (niveau de chaque sort Q/W/E/R)
  - `searchQuery`, `champSearchQuery` (recherche d’items et de champions)
  - **Filtres de stats** : `activeStatFilters: string[]` (AD, AP, Armor, etc.)
  - `stats: Stats` (stats combinées champion + items)
  - `dummy: DummyStats` (HP/armor/MR de la cible)
  - `comboToggles` (inclure/exclure auto-attack et chaque sort dans le combo)
  - `aiAnalysis: string | null` (résultat texte Gemini)

**Système de tri / filtrage ajouté** :

- Constante `STAT_FILTERS` :

  ```ts
  const STAT_FILTERS: { key: keyof Stats; label: string; icon: React.ReactNode }[] = [
    { key: 'ad', label: 'AD', icon: <Swords className="w-3 h-3" /> },
    { key: 'ap', label: 'AP', icon: <Wand2 className="w-3 h-3" /> },
    { key: 'armor', label: 'Armor', icon: <Shield className="w-3 h-3" /> },
    { key: 'mr', label: 'MR', icon: <Shield className="w-3 h-3" /> },
    { key: 'hp', label: 'HP', icon: <Plus className="w-3 h-3" /> },
    { key: 'haste', label: 'Haste', icon: <Zap className="w-3 h-3" /> },
    { key: 'attackSpeed', label: 'AS', icon: <Swords className="w-3 h-3" /> },
    { key: 'crit', label: 'Crit', icon: <Crosshair className="w-3 h-3" /> },
    { key: 'moveSpeed', label: 'Speed', icon: <Gauge className="w-3 h-3" /> },
  ];
  ```

- État associé :

  ```ts
  const [activeStatFilters, setActiveStatFilters] = useState<string[]>([]);
  ```

- Fonction `toggleStatFilter` : ajoute/retire une stat de la liste active.

- Logique de filtrage des items :

  ```ts
  const filteredItems = BUILDER_ITEMS.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    let matchesStats = true;
    if (activeStatFilters.length > 0) {
      if (!item.stats) matchesStats = false;
      else {
        matchesStats = activeStatFilters.some(statKey => (item.stats as any)[statKey] > 0);
      }
    }
    return matchesSearch && matchesStats;
  });
  ```

- Affichage : boutons de filtres + liste virtualisée d’items avec tooltips détaillés.

#### 4.1.3. Calcul des stats et dégâts

- Effet `useEffect` recalculant `stats` à chaque changement de champion, niveau ou items :
  - applique les croissances (`statsGrowth`) avec le niveau,
  - additionne les stats des items,
  - traite la vitesse d’attaque (bonus % + croissance niveau).

- Fonctions :
  - `calculateSpellDamage(spell)` :
    - récupère `spellLevels[spell.id]`,
    - baseDamage par niveau + ratios AP/AD,
    - applique les réductions d’armure/résistance magique du dummy,
    - tient compte de la létalité, pénétration magique, pénétration %.
  - `calculateAutoDamage()` :
    - DPS d’un auto-attaque en fonction de l’AD et de l’armure du dummy.
  - `calculateTotalDamage()` :
    - somme les dégâts des sources activées dans `comboToggles`.

#### 4.1.4. Intégration Gemini dans le Builder

- Service : `frontend/services/geminiService.ts`
- Fonction : `analyzeBuild(currentChampion, activeItems, stats)`
- Workflow :
  1. On filtre les `selectedItems` pour ne garder que les items non `null`.
  2. On envoie champion, liste d’items et stats au backend Gemini.
  3. L’API Gemini renvoie une analyse texte (forces, faiblesses, conseils).
  4. Le texte est affiché avec `dangerouslySetInnerHTML`, en remplaçant les `\n` par `<br/>`.

---

## 5. Intégration Riot & Gemini (backend)

> **Attention sécurité** : les clés d’API (Gemini, Riot) doivent être stockées dans des variables d’environnement et **jamais** commitées en clair.

### 5.1. Riot API

- Endpoints Next dans `app/api/riot/**` (par ex. `summary/`) :
  - Récupèrent les informations de compte (summoner), l’historique de matchs, les stats récentes.
  - Utilisent un wrapper dans `src/lib/riot` pour :
    - gérer les headers d’auth (`X-Riot-Token`),
    - appliquer des limites de rate-limit,
    - mapper les réponses brutes vers des types internes.

- Utilisation côté UI :
  - Hooks/services (dans `src/lib/api` ou `frontend/services`) appellent ces endpoints.
  - Composants d’UI : `MatchCard`, `RecentlyPlayedWith`, `ProfileHeader`, etc.

### 5.2. Gemini API

- Endpoints Next dans `app/api/gemini/**` :
  - `build-analysis/` : analyse d’un build d’items
  - `match-analysis/` : analyse de matchs / performances

- Service côté frontend : `frontend/services/geminiService.ts` (et équivalent Next) :
  - envoie une payload structurée : champion, items, stats, contexte (langue…),
  - récupère un texte formaté, prêt à être rendu dans l’UI.

- Exemple d’intégration : voir la logique dans le composant `Builder` (bouton « Analyse du Coach »).

---

## 6. Internationalisation (i18n)

### 6.1. Fichiers de traduction

- `public/i18n/en.json`, `public/i18n/fr.json` (côté Next)
- `frontend/public/i18n/en.json`, `frontend/public/i18n/fr.json` (côté Vite)

Ils contiennent des clés comme :

- textes de l’UI générale (home, builder, leaderboard),
- libellés du Builder (reset, undo, analyzeBuild, combatStats, targetDummy, etc.).

### 6.2. Hook `useI18n`

- Fichier : `src/hooks/useI18n.ts`
- Rôle :
  - charger les JSON de traduction,
  - exposer une fonction `t(key)` ou un objet de traductions pour la langue active.

### 6.3. Sélecteur de langue dans la Navbar

- Composant : `frontend/components/Navbar.tsx`
- Propriétés :

  ```ts
  interface NavbarProps {
    currentView?: string;
    onNavigate?: (view: string) => void;
    currentLang: Language; // 'FR' | 'EN' | 'ES' | 'KR'
    onSetLang: (lang: Language) => void;
    currentPatch?: string;
  }
  ```

- Comportement :
  - affiche la langue courante,
  - ouvre un menu avec les locales possibles,
  - appelle `onSetLang(lang)` quand l’utilisateur clique.

- Côté Next, cette valeur est synchronisée avec le hook `useI18n` pour charger les bonnes traductions.

---

## 7. Lancer, tester, mettre à jour

### 7.1. Installation des dépendances

Depuis la racine du projet :

```powershell
npm install
```

Si tu veux garder le frontend Vite isolé pour debug :

```powershell
cd frontend
npm install
```

### 7.2. Lancer le projet Next en développement

Depuis la racine :

```powershell
npm run dev
```

Par défaut, l’application sera disponible sur `http://localhost:3000`.

### 7.3. Lancer le frontend Vite en développement (optionnel, UI legacy)

```powershell
cd frontend
npm run dev
```

Cela sert surtout si tu veux comparer l’UI originale Vite au port Next.

### 7.4. Lancer les tests

Depuis la racine :

```powershell
npm test
```

Les tests couvrent notamment :

- la sérialisation de builds (`tests/build.serializer.test.ts`),
- la sélection de runes (`tests/runes.selection.test.ts`, `tests/runes.shards.test.ts`),
- le calcul de dégâts de sorts (`tests/spells.damage.test.ts`),
- le store des items (`tests/store.items.test.ts`),
- le comportement DnD (`tests/dnd.clearAll.test.ts`),
- le comportement de changement de langue (`tests/locale.switch.test.ts`).

### 7.5. Mise à jour des données de patch (résumé)

1. **Configurer les variables d’environnement** (Riot, Gemini, etc.)
2. **Lancer le script Data Dragon** pour un patch cible (exemple générique) :

   ```powershell
   node ./scripts/fetch-ddragon.js
   ```

   > Selon la version du script, tu peux devoir lui passer la version de patch ou laisser le script détecter la dernière.

3. **Vérifier** que les fichiers sont bien créés dans `data/<nouveau_patch>/`.
4. **Mettre à jour `patch-state.json`** pour définir :
   - `pending.version` = `<nouveau_patch>`
5. **Promouvoir** le patch pending en patch courant via l’API d’admin ou un script interne.
6. **Redémarrer** l’appli si nécessaire.

---

## 8. Points d’extension et bonnes pratiques

- **Sécurité des clés d’API** :
  - ne jamais commiter les clés Gemini ou Riot,
  - utiliser `.env.local` (`NEXT_PUBLIC_` pour le strictement nécessaire côté client).

- **Migration complète de l’UI Vite vers Next** :
  - garder `frontend/` comme référence visuelle,
  - migrer les composants dans `src/legacy-frontend/` ou `src/components/` en conservant **strictement** le JSX et les classes Tailwind,
  - ne changer que les imports de logique (hooks, stores, services) pour les brancher sur le backend Next.

- **Tests** :
  - quand tu modifies la logique de dégâts, de runes ou de build, ajoute systématiquement un test dans `tests/` correspondant,
  - pour la logique de patch notes (`src/lib/riot/patchNotes.ts`), idéalement ajouter un fichier de test dédié.

---

Si tu veux, on peut ensuite compléter ce README avec des schémas (diagrammes de flux patch/update, séquence Gemini, etc.) ou un guide pas-à-pas pour ajouter un nouveau patch, un nouveau champion ou un nouveau type de rune.
