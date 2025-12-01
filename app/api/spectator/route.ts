import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // Endpoint spectator réel Riot à brancher ici plus tard.
  // Pour l'instant, on indique simplement qu'aucune partie active n'est trouvée.
  return NextResponse.json({ status: 'NOT_FOUND', hasGame: false });
}
