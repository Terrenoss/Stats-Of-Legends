import { NextRequest, NextResponse } from 'next/server';

const DATA_BASE = process.env.DATA_BASE || '';

async function fetchLatestPatch() {
  try {
    const res = await fetch('https://ddragon.leagueoflegends.com/api/versions.json', { next: { revalidate: 60 } });
    if (!res.ok) throw new Error('Failed versions');
    const versions: string[] = await res.json();
    return versions[0];
  } catch {
    return '15.22.1';
  }
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    let patch = url.searchParams.get('patch') || 'latest';
    const locale = url.searchParams.get('locale') || 'en_US';

    if (patch === 'latest') {
      patch = await fetchLatestPatch();
    }

    if (DATA_BASE) {
      try {
        const upstream = await fetch(`${DATA_BASE}/api/dd/items?patch=${encodeURIComponent(patch)}&locale=${encodeURIComponent(locale)}`);
        if (upstream.ok) {
          return NextResponse.json(await upstream.json());
        }
      } catch {
        // fallback CDN
      }
    }

    const cdnUrl = `https://ddragon.leagueoflegends.com/cdn/${patch}/data/${locale}/item.json`;
    const r = await fetch(cdnUrl, { next: { revalidate: 3600 } });
    if (!r.ok) return NextResponse.json({ error: 'Failed to fetch items from CDN' }, { status: 500 });
    const json = await r.json();
    const data = Object.keys(json.data || {}).map(id => {
      const it = (json.data as any)[id];
      return {
        id: String(id),
        name: it.name,
        imageFull: it.image?.full || `${id}.png`,
        stats: it.stats || {},
        gold: it.gold || {},
      };
    });
    return NextResponse.json({ patch, data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
