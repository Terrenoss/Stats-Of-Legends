import { NextResponse } from 'next/server';
import { readManifest } from '@/lib/server/dd-server';

export async function GET(req: Request) {
  try {
    const m = await readManifest();
    return NextResponse.json(m);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

