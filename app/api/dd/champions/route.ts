import { NextRequest, NextResponse } from 'next/server';
import { DataDragonService } from '@/services/DataDragonService';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const patch = url.searchParams.get('patch') || 'latest';
    const locale = url.searchParams.get('locale') || 'en_US';

    const data = await DataDragonService.getChampions(patch, locale);
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
