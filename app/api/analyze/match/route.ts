import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AIAnalysisService } from '@/services/AIAnalysisService';
import { HTTP_BAD_GATEWAY } from '@/constants/api';

const getApiKey = () => process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.API_KEY || '';
const ANALYSIS_VERSION = '1.0';

export async function POST(request: Request) {
  const apiKey = getApiKey();
  if (!apiKey) {
    return NextResponse.json({ error: 'Clé API manquante. Définissez GEMINI_API_KEY ou GOOGLE_API_KEY.' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { match } = body;

    if (!match || !match.id) {
      return NextResponse.json({ error: 'Données de match invalides.' }, { status: 400 });
    }

    // 1. Check Cache
    const cachedAnalysis = await prisma.matchAnalysis.findUnique({
      where: { matchId: match.id }
    });

    if (cachedAnalysis && cachedAnalysis.version === ANALYSIS_VERSION) {
      return NextResponse.json(cachedAnalysis.jsonResult);
    }

    // 2. Generate with AI
    const { result, error } = await AIAnalysisService.generateMatchAnalysis(match, apiKey);

    if (error) {
      return NextResponse.json({ error }, { status: HTTP_BAD_GATEWAY });
    }

    const finalResult = { result };

    // 3. Save to Cache
    try {
      await prisma.matchAnalysis.upsert({
        where: { matchId: match.id },
        update: {
          jsonResult: finalResult,
          version: ANALYSIS_VERSION,
        },
        create: {
          matchId: match.id,
          jsonResult: finalResult,
          version: ANALYSIS_VERSION,
        }
      });
    } catch (dbError) {
      console.warn(`[Cache Save Failed] Could not save analysis to DB. Match ID ${match.id} might not exist in Match table yet.`, dbError);
    }

    return NextResponse.json(finalResult);
  } catch (error) {
    console.error('Gemini Error:', error);
    return NextResponse.json({ error: 'Erreur IA : impossible de contacter le service externe. Vérifiez votre clé et la configuration.' }, { status: HTTP_BAD_GATEWAY });
  }
}