import { NextResponse } from 'next/server';
import { getCurrentPatch, startAutoPatchChecker } from '../../../../src/lib/patch/patchServer';

// Ensure checker is started
startAutoPatchChecker();

export async function GET() {
  const data = getCurrentPatch();
  return NextResponse.json(data);
}

