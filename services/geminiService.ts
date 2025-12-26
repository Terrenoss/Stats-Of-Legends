import { Match, Item, Champion, Stats } from '../types';

export const analyzeMatch = async (match: Match): Promise<string> => {
  try {
    const res = await fetch('/api/analyze/match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ match }),
    });

    const text = await res.text();
    let data: any = null;
    try { data = JSON.parse(text); } catch (e) { /* not JSON */ }

    if (!res.ok) {
      console.error('Gemini match-analysis failed', res.status, data || text);
      // If server provided a readable error message, surface it
      if (data && data.error) return typeof data.error === 'string' ? data.error : (data.error.message || 'Erreur lors de l\'analyse du match.');
      return `Erreur lors de l'analyse du match (status ${res.status}).`;
    }

    // success
    if (data && data.result) return data.result;
    return "Impossible de générer l'analyse.";
  } catch (error) {
    console.error('Gemini Error:', error);
    return "Erreur IA : impossible de contacter le service d'analyse. Vérifiez votre configuration.";
  }
};

export const analyzeBuild = async (champion: Champion, items: Item[], stats: Stats): Promise<string> => {
  try {
    const response = await fetch('/api/analyze/build', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ champion, itemNames: items.map(i => i.name).join(', '), stats }),
    });

    const text = await response.text();
    let data: any = null;
    try { data = JSON.parse(text); } catch (e) { /* not JSON */ }

    if (!response.ok) {
      console.error('Gemini build-analysis failed', response.status, data || text);
      if (data && data.error) return typeof data.error === 'string' ? data.error : (data.error.message || 'Erreur lors de l\'analyse du build.');
      return `Erreur lors de l'analyse du build (status ${response.status}).`;
    }

    if (data && data.result) return data.result;
    return "Analyse impossible.";
  } catch (error) {
    console.error('Gemini Error:', error);
    return "Erreur IA : impossible de contacter le service d'analyse. Vérifiez votre configuration.";
  }
};
