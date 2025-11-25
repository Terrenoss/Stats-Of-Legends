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
    const { champion, itemNames, stats } = body;

    const prompt = `
      You are a Grandmaster Theorycrafter in League of Legends.
      
      Subject: ${champion.name}
      Build: ${itemNames}
      
      Projected Stats (Lvl 18):
      - AD: ${Math.round(stats.ad)}
      - AP: ${Math.round(stats.ap)}
      - HP: ${Math.round(stats.hp)}
      
      Analyze this specific build synergy.
      1. **Identity**: What is this build trying to achieve?
      2. **Viability Score**: Rate it /10.
      3. **Optimization**: Suggest one item swap.
      
      Format using clean Markdown bullet points.
    `;

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
    return NextResponse.json({ result: "Analysis unavailable. Please check configuration." }, { status: 200 });
  }
}