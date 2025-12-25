import { NextRequest, NextResponse } from 'next/server';
import { CURRENT_PATCH } from '@/constants';

const DATA_BASE = process.env.DATA_BASE || '';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    let patch = url.searchParams.get('patch') || 'latest';
    const locale = url.searchParams.get('locale') || 'en_US';

    if (patch === 'latest') {
      patch = CURRENT_PATCH;
    }

    if (DATA_BASE) {
      try {
        const upstream = await fetch(`${DATA_BASE}/api/dd/items?patch=${encodeURIComponent(patch)}&locale=${encodeURIComponent(locale)}`);
        if (upstream.ok) {
          return NextResponse.json(await upstream.json());
        }
      } catch (error) {
        console.error('Upstream fetch failed:', error);
      }
    }

    const cdnUrl = `https://ddragon.leagueoflegends.com/cdn/${patch}/data/${locale}/item.json`;
    const response = await fetch(cdnUrl, { next: { revalidate: 3600 } });
    if (!response.ok) return NextResponse.json({ error: 'Failed to fetch items from CDN' }, { status: 500 });
    const json = await response.json();
    const data = Object.keys(json.data || {}).map(id => {
      const item = (json.data as any)[id];
      return {
        id: String(id),
        name: item.name,
        imageFull: item.image?.full || `${id}.png`,
        stats: item.stats || {},
        gold: item.gold || {},
      };
    });
    return NextResponse.json({ patch, data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
