
import { Match, Item, Champion, Stats } from '../types';

export const analyzeMatch = async (match: Match): Promise<string> => {
  try {
    const response = await fetch('/api/analyze/match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ match }),
    });
    const data = await response.json();
    return data.result || "Impossible de générer l'analyse.";
  } catch (error) {
    console.error("API Error:", error);
    return "Erreur de connexion au service d'analyse.";
  }
};

export const analyzeBuild = async (champion: Champion, items: Item[], stats: Stats): Promise<string> => {
  try {
    const itemNames = items.map(i => i.name).join(', ');
    const response = await fetch('/api/analyze/build', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ champion, itemNames, stats }),
    });
    const data = await response.json();
    return data.result || "Analyse impossible.";
  } catch (error) {
    console.error("API Error:", error);
    return "Erreur lors de l'analyse du build.";
  }
};
