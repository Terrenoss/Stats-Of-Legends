import { NextRequest, NextResponse } from 'next/server';
// @ts-ignore
const { GoogleGenAI }: any = require('@google/genai');

const GEMINI_KEY = process.env.GEMINI_API_KEY || '';

let client: any = null;

function getClient() {
  if (!GEMINI_KEY) {
    throw new Error('GEMINI_API_KEY is not configured');
  }
  if (!client) {
    client = new GoogleGenAI({ apiKey: GEMINI_KEY });
  }
  return client;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const match = body.match;
    if (!match || !match.me) {
      return NextResponse.json({ error: 'match with me field is required' }, { status: 400 });
    }

    const me = match.me;

    const prompt = `
Agis comme un coach professionnel de League of Legends (niveau Challenger).
Analyse ce match pour le joueur "${me.summonerName}" qui jouait "${me.champion.name}".

Résultat du match: ${me.win ? 'Victoire' : 'Défaite'}
KDA: ${me.kills}/${me.deaths}/${me.assists}
CS: ${me.cs}
Dégâts: ${me.totalDamageDealtToChampions}
Vision: ${me.visionScore}
Durée: ${Math.floor(match.gameDuration / 60)} minutes

Donne-moi 3 points clés concis (un positif, deux à améliorer) avec un ton constructif mais direct.
Formate la réponse en Markdown simple. Ne mets pas de titre générique, va droit au but.
`;

    const ai = getClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const text = (response as any).text || 'Impossible de générer l’analyse.';
    return NextResponse.json({ markdown: text });
  } catch (err: any) {
    console.error('[gemini] match-analysis error', err);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}

