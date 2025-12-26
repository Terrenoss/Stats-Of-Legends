import { GoogleGenAI } from "@google/genai";

const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const MAX_OUTPUT_TOKENS = Number(process.env.GEMINI_MAX_OUTPUT_TOKENS || '1024');

export class AIAnalysisService {

    private static async streamResponseToText(ai: any, prompt: string, model: string, maxTokens: number): Promise<string> {
        try {
            const stream = await ai.models.generateContentStream({
                model,
                contents: prompt,
                config: { maxOutputTokens: maxTokens, temperature: 0.2 }
            });
            let collected = '';
            for await (const chunk of stream) {
                if (chunk && typeof chunk.text === 'string') collected += chunk.text;
                else if (chunk && chunk.candidate && typeof chunk.candidate.text === 'string') collected += chunk.candidate.text;
                else if (typeof chunk === 'string') collected += chunk;
            }
            return collected;
        } catch (e: any) {
            console.warn('Streaming fallback failed:', e?.message || e);
            return '';
        }
    }

    private static extractTextFromResponse(response: any): { text: string; truncated: boolean } {
        if (!response) return { text: '', truncated: false };

        const extractFromContent = (content: any): string | null => {
            if (!content) return null;
            if (typeof content === 'string') return content;
            if (typeof content.text === 'string' && content.text.trim().length) return content.text;
            if (Array.isArray(content.parts) && content.parts.length) return content.parts.join('');
            if (Array.isArray(content) && content.length) {
                const first = content[0];
                if (typeof first === 'string') return first;
                if (first && typeof first.text === 'string') return first.text;
                if (first && Array.isArray(first.parts)) return first.parts.join('');
            }
            if (content.content && Array.isArray(content.content) && content.content[0]) {
                const c0 = content.content[0];
                if (typeof c0 === 'string') return c0;
                if (c0 && typeof c0.text === 'string') return c0.text;
                if (c0 && Array.isArray(c0.parts)) return c0.parts.join('');
            }
            return null;
        };

        if (typeof response === 'string') return { text: response, truncated: false };
        if (response.text && typeof response.text === 'string') return { text: response.text, truncated: response.finishReason === 'MAX_TOKENS' || false };

        let truncated = response.finishReason === 'MAX_TOKENS';

        try {
            if (response.output && Array.isArray(response.output) && response.output[0]) {
                const first = response.output[0];
                if (first && first.finishReason === 'MAX_TOKENS') truncated = true;
                const t = extractFromContent(first);
                if (t) return { text: t, truncated };
            }
        } catch (error) {
            console.warn('Error parsing response output:', error);
        }

        if (response.candidates && Array.isArray(response.candidates) && response.candidates.length) {
            for (const c of response.candidates) {
                if (c && c.finishReason === 'MAX_TOKENS') truncated = true;
                if (typeof c.output === 'string' && c.output.trim().length) return { text: c.output, truncated };
                const t = extractFromContent(c.content) || extractFromContent(c);
                if (t) return { text: t, truncated };
            }
        }

        return { text: '', truncated };
    }

    static async generateMatchAnalysis(match: any, apiKey: string): Promise<{ result: string, error?: string }> {
        const ai = new GoogleGenAI({ apiKey });

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

        try {
            const response = await ai.models.generateContent({
                model: MODEL,
                contents: prompt,
                config: {
                    temperature: 0.2,
                    maxOutputTokens: MAX_OUTPUT_TOKENS,
                }
            });

            let extracted = this.extractTextFromResponse(response);

            if ((!extracted.text || extracted.text.length < 10) && extracted.truncated) {
                const increased = Math.min(MAX_OUTPUT_TOKENS * 2, 8192);
                const streamed = await this.streamResponseToText(ai, prompt, MODEL, increased);
                if (streamed && streamed.trim().length) {
                    extracted = { text: streamed.trim(), truncated: false };
                }
            }

            if (!extracted.text || extracted.text.trim().length < 10) {
                console.error('Gemini: no usable text returned from model (response truncated or empty).');
                return { result: '', error: "Erreur IA : impossible de générer l'analyse." };
            }

            let resultText = extracted.text;
            if (extracted.truncated) {
                resultText = `${resultText}\n\n*Note*: réponse tronquée (MAX_TOKENS). Vous pouvez augmenter GEMINI_MAX_OUTPUT_TOKENS.`;
                console.warn('Gemini response truncated due to MAX_TOKENS');
            }

            return { result: resultText };

        } catch (error: any) {
            console.error("Gemini Error:", error);
            return { result: '', error: "Erreur IA : impossible de contacter le service externe." };
        }
    }
}
