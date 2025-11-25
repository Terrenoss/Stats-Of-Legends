
import { NextResponse } from 'next/server';

const RIOT_API_KEY = process.env.RIOT_API_KEY;
const REGION_ROUTING_MAP: Record<string, string> = {
    'EUW': 'europe',
    'NA': 'americas',
    'KR': 'asia',
    'EUNE': 'europe',
    'BR': 'americas',
    'LAN': 'americas'
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');
  const region = searchParams.get('region') || 'EUW';

  if (!query || query.length < 3) {
    return NextResponse.json({ suggestions: [] });
  }

  // If no Riot Key, return mock suggestions
  if (!RIOT_API_KEY) {
     return NextResponse.json({ 
         suggestions: [
             { gameName: "Faker", tagLine: "KR1", puuid: "mock-1" },
             { gameName: "Caps", tagLine: "EUW", puuid: "mock-2" },
             { gameName: query, tagLine: region, puuid: "mock-3" }
         ]
     });
  }

  try {
    const routing = REGION_ROUTING_MAP[region] || 'europe';
    // Note: Riot Account API usually requires gameName/tagLine, 
    // but for autocomplete we might simulate it or use a cached database.
    // Since Account API doesn't support partial search natively for public use easily,
    // we will return the query itself as a suggestion if it looks like a valid format,
    // or return nothing if it's just a partial string, unless we have a DB.
    
    // For this implementation, we will format the user input to help them complete it.
    const suggestions = [];
    if (query.includes('#')) {
        const [name, tag] = query.split('#');
        if (name && tag) {
             suggestions.push({ gameName: name, tagLine: tag, puuid: 'prediction' });
        }
    } else {
        // Suggest default tags based on region
        suggestions.push({ gameName: query, tagLine: region, puuid: 'prediction-1' });
        if (region === 'EUW') suggestions.push({ gameName: query, tagLine: 'EUW', puuid: 'prediction-2' });
        if (region === 'KR') suggestions.push({ gameName: query, tagLine: 'KR1', puuid: 'prediction-3' });
    }

    return NextResponse.json({ suggestions });

  } catch (error) {
    console.error('Riot Search API Error:', error);
    return NextResponse.json({ suggestions: [] });
  }
}
