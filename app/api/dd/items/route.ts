import { NextResponse } from 'next/server';
import { getNormalizedItems } from '@/lib/server/dd-server';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const patch = url.searchParams.get('patch') || undefined;
    const locale = url.searchParams.get('locale') || undefined;
    try {
      const patchParam = (patch === 'latest' ? undefined : patch);
      const res = await getNormalizedItems(patchParam, locale);
      if (!res || !res.data || res.data.length === 0) throw new Error('no local items');
      return NextResponse.json(res);
    } catch (err) {
      // fallback to CDN
      try {
        const cdnUrl = `https://ddragon.leagueoflegends.com/cdn/${patch || 'latest'}/data/${locale || 'en_US'}/item.json`;
        const r = await fetch(cdnUrl);
        if (r.ok) {
          const json = await r.json();
          // normalize quickly
          const data = Object.keys(json.data || {}).map(id => {
            const it = json.data[id];
            return { id: String(id), name: it.name, imageFull: it.image?.full || `${id}.png`, image: it.image?.full || `${id}.png`, stats: it.stats || {}, gold: it.gold || {} };
          });
          return NextResponse.json({ patch: patch || 'latest', data });
        }
      } catch (err) {}
      return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    }
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
