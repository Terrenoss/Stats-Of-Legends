import { GoogleGenAI } from "@google/genai";
import { NextResponse } from 'next/server';

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export async function POST(request: Request) {
  if (!apiKey) {
    return NextResponse.json({ error: "API Key missing" }, { status: 500 });
  }

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

    // Using Gemini 3.0 Pro with Thinking
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        thinkingConfig: {
            thinkingBudget: 32768
        }
      }
    });

    return NextResponse.json({ result: response.text });
  } catch (error) {
    console.error("Gemini Error:", error);
    return NextResponse.json({ result: "Analysis currently unavailable due to high server load. Please try again later." }, { status: 200 });
  }
}