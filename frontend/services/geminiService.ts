import { Match, Item, Champion, Stats } from '../types';

export const analyzeMatch = async (match: Match): Promise<string> => {
  try {
    const res = await fetch('/api/gemini/match-analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ match }),
    });
    if (!res.ok) {
      console.error('Gemini match-analysis failed', await res.text());
      return "Une erreur est survenue lors de l'analyse du match.";
    }
    const data = await res.json();
    return data.markdown || "Impossible de générer l'analyse.";
  } catch (error) {
    console.error('Gemini Error:', error);
    return "Une erreur est survenue lors de l'analyse du match.";
  }
};

export const analyzeBuild = async (champion: Champion, items: Item[], stats: Stats): Promise<string> => {
  try {
    const res = await fetch('/api/gemini/build-analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ champion, items, stats }),
    });
    if (!res.ok) {
      console.error('Gemini build-analysis failed', await res.text());
      return "Erreur lors de l'analyse du build.";
    }
    const data = await res.json();
    return data.markdown || "Analyse impossible.";
  } catch (error) {
    console.error('Gemini Error:', error);
    return "Erreur lors de l'analyse du build.";
  }
};
