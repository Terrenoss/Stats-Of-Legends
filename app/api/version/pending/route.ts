import { NextResponse } from 'next/server';
import { getPending, startAutoPatchChecker } from '../../../../src/lib/patch/patchServer';
startAutoPatchChecker();
export async function GET() {
  const p = getPending();
  return NextResponse.json({ pending: p });
}

