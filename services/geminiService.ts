import { Match, Item, Champion, Stats } from '../types';

export const analyzeMatch = async (match: Match): Promise<string> => {
  try {
    const res = await fetch('/api/analyze/match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ match }),
    });
    if (!res.ok) {
      console.error('Gemini match-analysis failed', await res.text());
      return "Une erreur est survenue lors de l'analyse du match.";
    }
    const data = await res.json();
    return data.result || "Impossible de générer l'analyse.";
  } catch (error) {
    console.error('Gemini Error:', error);
    return "Une erreur est survenue lors de l'analyse du match.";
  }
};

export const analyzeBuild = async (champion: Champion, items: Item[], stats: Stats): Promise<string> => {
  try {
    const response = await fetch('/api/analyze/build', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ champion, itemNames: items.map(i => i.name).join(', '), stats }),
    });
    const data = await response.json();
    if (!response.ok) {
      console.error('Gemini build-analysis failed', data);
      return "Erreur lors de l'analyse du build.";
    }
    return data.result || "Analyse impossible.";
  } catch (error) {
    console.error('Gemini Error:', error);
    return "Erreur lors de l'analyse du build.";
  }
};
