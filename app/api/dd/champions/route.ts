import { NextResponse } from 'next/server';
import { getNormalizedChampions } from '@/lib/server/dd-server';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const patch = url.searchParams.get('patch') || undefined;
    const locale = url.searchParams.get('locale') || undefined;
    try {
      const patchParam = (patch === 'latest' ? undefined : patch);
      const res = await getNormalizedChampions(patchParam, locale);
      if (!res || !res.data || res.data.length === 0) throw new Error('no local champions');
      return NextResponse.json(res);
    } catch (err) {
      // fallback to CDN
      try {
        const cdnUrl = `https://ddragon.leagueoflegends.com/cdn/${patch || 'latest'}/data/${locale || 'en_US'}/champion.json`;
        const r = await fetch(cdnUrl);
        if (r.ok) {
          const json = await r.json();
          const data = Object.values(json.data || {}).map((c: any) => ({ id: c.id, key: c.id, name: c.name, imageFull: c.image?.full || null, image: c.image?.full || null, stats: c.stats || {} }));
          return NextResponse.json({ patch: patch || 'latest', data });
        }
      } catch (err) { }
      return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    }
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
