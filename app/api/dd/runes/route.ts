import { NextResponse } from 'next/server';
import { readJsonFromPatch } from '@/lib/server/dd-server';

export async function GET(req: Request) {
  try {
    const runes = await readJsonFromPatch('runesReforged.json');
    return NextResponse.json(runes);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

