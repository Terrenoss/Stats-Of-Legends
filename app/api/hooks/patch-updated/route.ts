import { NextResponse } from 'next/server';
import { triggerApplyPatch } from '../../../../src/lib/patch/patchServer';

export async function POST(req: Request) {
  try {
    const secret = process.env.PATCH_HOOK_SECRET || 'dev-secret';
    const header = req.headers.get('x-hook-secret') || req.headers.get('x-patch-secret');
    if (!header || header !== secret) return NextResponse.json({ ok: false, error: 'invalid secret' }, { status: 401 });
    const body = await req.json();
    const version = body.version || body.patch || body.latest;
    if (!version) return NextResponse.json({ ok: false, error: 'missing version' }, { status: 400 });
    triggerApplyPatch(version, 'webhook');
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

