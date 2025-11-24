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
    const { champion, items, stats } = body;
    if (!champion || !items || !stats) {
      return NextResponse.json({ error: 'champion, items and stats are required' }, { status: 400 });
    }

    const itemNames = items.map((i: any) => i.name).join(', ');

    const prompt = `
Tu es un expert en theorycraft League of Legends.
Champion: ${champion.name}
Build Items: ${itemNames}
Stats finales approximatives:
- AD: ${stats.ad}
- AP: ${stats.ap}
- HP: ${stats.hp}
- Armor/MR: ${stats.armor}/${stats.mr}

Analyse ce build en 3-4 bullet points Markdown, très concis, en disant :
- Dans quels cas ce build est bon
- Ses faiblesses
- 1 ou 2 suggestions d’items alternatifs
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

