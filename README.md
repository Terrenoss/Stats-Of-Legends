````
README.md v2

Projet: lol-builder (MVP)

But: Fournir un builder minimal pour champion/runes/items – Next.js 14 + TypeScript

Installation

1. Node 20.x LTS recommandé
2. npm install
3. npm run dd:update  # récupère Data Dragon (versions + JSON + images)
4. npm run dev

Scripts utiles
- npm run dev: démarre Next.js en dev
- npm run build: build pour production
- npm start: start server
- npm test: lance Jest
- npm run dd:update: télécharge assets Data Dragon dans data/<patch> et copy dans public/data/<patch>/img

Architecture
- app/: pages Next.js (app router)
- src/: code client/serveur partagé
- scripts/: outils d'ingestion Data Dragon
- public/data/: fallback images

QA rapide
- Vérifier que / affiche l'app et les trois colonnes
- Vérifier drag & drop items
- Vérifier export/import JSON

````

