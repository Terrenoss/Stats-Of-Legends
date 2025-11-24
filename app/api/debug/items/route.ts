import { NextResponse } from 'next/server';
import { getNormalizedItems, getNormalizedChampions } from '@/lib/server/dd-server';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const patch = url.searchParams.get('patch') || undefined;
    const patchParam = patch === 'latest' ? undefined : patch;
    const itemsRes = await getNormalizedItems(patchParam, 'en_US');
    const champsRes = await getNormalizedChampions(patchParam, 'en_US');
    const items = itemsRes.data || [];
    const champs = champsRes.data || [];
    const html = [`<html><head><meta charset="utf-8"><title>Debug Items</title><style>body{background:#0f1720;color:#e6eef8;font-family:system-ui,Segoe UI,Roboto;}table{border-collapse:collapse;width:100%}td,th{border:1px solid #263244;padding:6px}</style></head><body><h2>Items (sample)</h2><table><tr><th>ID</th><th>Name</th><th>Image</th><th>Gold</th></tr>`];
    for (let i=0;i<Math.min(20, items.length); i++){
      const it = items[i];
      html.push(`<tr><td>${it.id}</td><td>${it.name}</td><td><img src="/data/${itemsRes.patch || 'latest'}/img/item-${it.imageFull}" width=32/></td><td>${it.gold?.total||0}</td></tr>`);
    }
    html.push('</table>');
    html.push('<h2>Champions (sample)</h2><table><tr><th>ID</th><th>Name</th><th>Image</th></tr>');
    for (let i=0;i<Math.min(20, champs.length); i++){
      const c = champs[i];
      html.push(`<tr><td>${c.id}</td><td>${c.name}</td><td><img src="/data/${champsRes.patch || 'latest'}/img/champion-${c.imageFull}" width=32/></td></tr>`);
    }
    html.push('</table></body></html>');
    return new NextResponse(html.join('\n'), { headers: { 'Content-Type': 'text/html' } });
  } catch (err:any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

