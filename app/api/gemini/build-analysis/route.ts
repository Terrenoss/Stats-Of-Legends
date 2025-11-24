import { NextRequest, NextResponse } from 'next/server';
// @ts-ignore - types non fourris par le SDK
const { GoogleGenAI }: any = require('@google/genai');

const GEMINI_KEY = process.env.GEMINI_API_KEY || '';

let client: GoogleGenAI | null = null;

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
    const { champion, items, stats } = body;
    if (!champion || !items || !stats) {
      return NextResponse.json({ error: 'champion, items and stats are required' }, { status: 400 });
    }

    const itemNames = items.map((i: any) => i.name).join(', ');

    const prompt = `
      Tu es un expert Theorycrafting League of Legends.
      Champion: ${champion.name}
      Build Items: ${itemNames}
      Stats Finales (Lvl 18 approx):
      - AD: ${stats.ad}
      - AP: ${stats.ap}
      - HP: ${stats.hp}
      - Armor/MR: ${stats.armor}/${stats.mr}
  
      Analyse ce build. Est-il viable ? Est-il méta ?
      Quel est le pic de puissance ?
      Quels items changer pour optimiser contre une équipe tanky ?
      Réponds en 3-4 bullet points Markdown, très concis.
    `;

    const ai = getClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const text = (response as any).text || 'Analyse impossible.';
    return NextResponse.json({ markdown: text });
  } catch (err: any) {
    console.error('[gemini] build-analysis error', err);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
