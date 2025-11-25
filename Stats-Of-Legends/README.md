# Stats Of Legends ⚡

Une interface analytique moderne pour League of Legends, propulsée par Next.js 14, TailwindCSS et l'IA Gemini.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Status](https://img.shields.io/badge/status-Active-success.svg)

## 🏗 Architecture & Données

Cette application utilise une architecture **Hybride (Mock/Real)** pour garantir une expérience fluide même sans clés API, tout en étant prête pour la production.

### 1. Sources de Données
*   **Données Statiques (Images/Assets) :** L'application utilise **DataDragon** (le CDN de Riot).
    *   *Logique :* Le composant `Navbar` récupère automatiquement la dernière version du patch (ex: `15.23.1`) via `https://ddragon.leagueoflegends.com/api/versions.json`.
    *   *Assets :* Toutes les images (Champions, Items, Icônes) sont construites dynamiquement : `https://ddragon.leagueoflegends.com/cdn/{VERSION}/img/...`.
*   **Données Joueurs (Live) :**
    *   Si une `RIOT_API_KEY` est présente dans `.env.local`, l'application interroge les vrais serveurs Riot via `app/api/summoner/route.ts`.
    *   Sinon, elle bascule automatiquement sur des données simulées (Mocks) de haute fidélité pour la démonstration.
*   **Intelligence Artificielle :**
    *   Utilise **Gemini 3.0 Pro** via le SDK Google GenAI pour analyser les matchs et les builds en langage naturel.

### 2. Stack Technique
*   **Framework :** Next.js 14 (App Router)
*   **Styling :** TailwindCSS 4 (Dark Mode, Custom Void/Gold Theme)
*   **Vizu :** Recharts (Graphiques de dégâts, Timeline, Radar)
*   **Icons :** Lucide React

---

## 🚀 Installation & Configuration

### 1. Prérequis
*   Node.js 18+
*   Une clé API Google AI Studio (pour l'analyse IA)
*   (Optionnel) Une clé API Riot Games (pour les vraies stats)

### 2. Installation
```bash
git clone https://github.com/votre-repo/stats-of-legends.git
cd stats-of-legends
npm install
```

### 3. Configuration des Variables d'Environnement
Créez un fichier `.env.local` à la racine :

```env
# Requis pour les fonctionnalités "Coach AI" et "Analyze Build"
API_KEY=votre_cle_google_genai_ici

# Optionnel : Si vide, le site utilisera les données de démonstration (Faker/T1)
RIOT_API_KEY=votre_cle_riot_games_ici
```

### 4. Lancement
```bash
npm run dev
```
Accédez à `http://localhost:3000`.

---

## 🛠 Guide de Développement

### Comment lier les vraies données (Riot API) ?
L'application possède un proxy interne `app/api/summoner/route.ts`.
1.  Obtenez une clé sur [developer.riotgames.com](https://developer.riotgames.com/).
2.  Ajoutez-la dans `.env.local`.
3.  Le proxy gère automatiquement le routage des régions (`EUW` -> `europe`, `NA` -> `americas`) et la conversion `Riot ID` -> `PUUID`.

### Comment mettre à jour le Patch ?
Le site est conçu pour être "auto-updating".
*   Au chargement, il fetch `versions.json` de Riot.
*   Si le patch change (ex: 15.23 -> 15.24), toutes les URLs d'images se mettent à jour automatiquement.
*   **Note :** Pour les liens vers les patch notes (ex: le bouton dans la Navbar), la logique de conversion (`15.x` -> `25-x`) se trouve dans `components/Navbar.tsx`.

### Structure des Dossiers
*   `/app` : Routes Next.js (Pages & API).
*   `/components` : Composants UI atomiques et complexes.
*   `/hooks` : Logique métier (Navigation sécurisée, Historique, LocalStorage).
*   `/services` : Couche d'abstraction pour Gemini AI.
*   `/types` : Définitions TypeScript partagées (Interfaces API Riot normalisées).
*   `/constants` : Données Mock, Traductions et Configuration globale.

---

## ⚖️ Legal

Stats Of Legends isn't endorsed by Riot Games and doesn't reflect the views or opinions of Riot Games or anyone officially involved in producing or managing Riot Games properties. Riot Games, and all associated properties are trademarks or registered trademarks of Riot Games, Inc.