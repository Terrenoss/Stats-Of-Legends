import { GoogleGenAI } from "@google/genai";
import { NextResponse } from 'next/server';

// Robust API key lookup: support GEMINI_API_KEY, GOOGLE_API_KEY, or legacy API_KEY
const getApiKey = () => process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.API_KEY || '';
const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const MAX_OUTPUT_TOKENS = Number(process.env.GEMINI_MAX_OUTPUT_TOKENS || '1024');

async function streamResponseToText(ai: any, prompt: string, model: string, maxTokens: number): Promise<string> {
  try {
    const stream = await ai.models.generateContentStream({
      model,
      contents: prompt,
      config: { maxOutputTokens: maxTokens, temperature: 0.2 }
    });
    let collected = '';
    for await (const chunk of stream) {
      // chunk may have .text or nested shapes
      if (chunk && typeof chunk.text === 'string') collected += chunk.text;
      else if (chunk && chunk.candidate && typeof chunk.candidate.text === 'string') collected += chunk.candidate.text;
      else if (typeof chunk === 'string') collected += chunk;
    }
    return collected;
  } catch (e) {
    console.warn('Streaming fallback failed:', e?.message || e);
    return '';
  }
}

function extractTextFromResponse(response: any): { text: string; truncated: boolean } {
  // returns { text, truncated }
  if (!response) return { text: '', truncated: false };

  // helper to extract from content-like objects
  const extractFromContent = (content: any): string | null => {
    if (!content) return null;
    if (typeof content === 'string') return content;
    if (typeof content.text === 'string' && content.text.trim().length) return content.text;
    // Some SDK shapes: content.parts is an array of strings
    if (Array.isArray(content.parts) && content.parts.length) return content.parts.join('');
    // content can be an array-like structure
    if (Array.isArray(content) && content.length) {
      // try first element
      const first = content[0];
      if (typeof first === 'string') return first;
      if (first && typeof first.text === 'string') return first.text;
      if (first && Array.isArray(first.parts)) return first.parts.join('');
    }
    // some shapes may have nested content: content.content[0].text
    if (content.content && Array.isArray(content.content) && content.content[0]) {
      const c0 = content.content[0];
      if (typeof c0 === 'string') return c0;
      if (c0 && typeof c0.text === 'string') return c0.text;
      if (c0 && Array.isArray(c0.parts)) return c0.parts.join('');
    }
    return null;
  };

  // Common top-level text
  if (typeof response === 'string') return { text: response, truncated: false };
  if (response.text && typeof response.text === 'string') return { text: response.text, truncated: response.finishReason === 'MAX_TOKENS' || false };

  // Track truncated if any part indicates MAX_TOKENS
  let truncated = response.finishReason === 'MAX_TOKENS';

  // Check response.output (array form used sometimes)
  try {
    if (response.output && Array.isArray(response.output) && response.output[0]) {
      const first = response.output[0];
      if (first && first.finishReason === 'MAX_TOKENS') truncated = true;
      const t = extractFromContent(first);
      if (t) return { text: t, truncated };
    }
  } catch (e) {}

  // Candidates fallback
  if (response.candidates && Array.isArray(response.candidates) && response.candidates.length) {
    for (const c of response.candidates) {
      if (c && c.finishReason === 'MAX_TOKENS') truncated = true;
      // candidate.output (string) or candidate.content
      if (typeof c.output === 'string' && c.output.trim().length) return { text: c.output, truncated };
      const t = extractFromContent(c.content) || extractFromContent(c);
      if (t) return { text: t, truncated };
    }
  }

  // No safe textual content found — do NOT return raw SDK JSON to the client
  return { text: '', truncated };
}

export async function POST(request: Request) {
  const apiKey = getApiKey();
  if (!apiKey) {
    return NextResponse.json({ error: "Clé API manquante. Définissez GEMINI_API_KEY ou GOOGLE_API_KEY." }, { status: 500 });
  }

  // create client using the resolved key
  const ai = new GoogleGenAI({ apiKey });

  try {
    const body = await request.json();
    const { match } = body;

    const prompt = `
      You are an expert Challenger-level League of Legends coach.
      Analyze this match for the player "${match.me.summonerName}" playing "${match.me.champion.name}".
      
      Match Context:
      - Result: ${match.me.win ? "Victory" : "Defeat"}
      - Mode: ${match.gameMode}
      - Duration: ${Math.floor(match.gameDuration / 60)}m
      
      Player Stats:
      - KDA: ${match.me.kills}/${match.me.deaths}/${match.me.assists}
      - CS: ${match.me.cs}
      - Damage: ${match.me.totalDamageDealtToChampions}
      - Vision Score: ${match.me.visionScore}
      
      Build: ${match.me.items.map((i: any) => i.name).join(', ')}

      Task:
      Provide a high-level strategic analysis.
      1. **Key Turning Point**: Deduce what likely went right or wrong.
      2. **Build Efficiency**: Comment on the itemization.
      3. **Actionable Advice**: Give 1 concrete tip.

      Format:
      Use professional Markdown. Keep it under 200 words. Be direct.
    `;

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        temperature: 0.2,
        maxOutputTokens: MAX_OUTPUT_TOKENS,
      }
    });

    let extracted = extractTextFromResponse(response);

    // If no useful text found (and response indicated truncation), attempt streaming fallback with increased tokens
    if ((!extracted.text || extracted.text.length < 10) && extracted.truncated) {
      const increased = Math.min(MAX_OUTPUT_TOKENS * 2, 8192);
      const streamed = await streamResponseToText(ai, prompt, MODEL, increased);
      if (streamed && streamed.trim().length) {
        extracted = { text: streamed.trim(), truncated: false };
      }
    }

    // If still no usable text, return an error to the client (do not expose SDK JSON)
    if (!extracted.text || extracted.text.trim().length < 10) {
      console.error('Gemini: no usable text returned from model (response truncated or empty).');
      return NextResponse.json({ error: "Erreur IA : impossible de générer l'analyse. Vérifiez votre configuration (GEMINI_API_KEY, GEMINI_MODEL)." }, { status: 502 });
    }

    let resultText = extracted.text;
    if (extracted.truncated) {
      // if we have text but it was truncated, add a short note (safe text)
      resultText = `${resultText}\n\n*Note*: réponse tronquée (MAX_TOKENS). Vous pouvez augmenter GEMINI_MAX_OUTPUT_TOKENS.`;
      console.warn('Gemini response truncated due to MAX_TOKENS');
    }

    return NextResponse.json({ result: resultText });
  } catch (error) {
    console.error("Gemini Error:", error);
    // Return an explicit error status so the frontend can show an error message
    return NextResponse.json({ error: "Erreur IA : impossible de contacter le service externe. Vérifiez votre clé et la configuration." }, { status: 502 });
  }
}