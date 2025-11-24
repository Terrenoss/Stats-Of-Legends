import { NextResponse } from 'next/server';
import { triggerApplyPatch } from '../../../../../../src/lib/patch/patchServer';

export async function POST(req: Request, { params }: { params: { version: string } }) {
  try {
    const adminSecret = process.env.ADMIN_SECRET || 'admin-secret';
    const header = req.headers.get('x-admin-secret');
    if (!header || header !== adminSecret) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
    const version = params.version;
    if (!version) return NextResponse.json({ ok: false, error: 'missing version' }, { status: 400 });
    triggerApplyPatch(version, 'admin');
    return NextResponse.json({ ok: true, message: 'update started' });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

