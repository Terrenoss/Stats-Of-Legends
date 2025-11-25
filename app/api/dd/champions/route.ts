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

function approximateBaseFromTooltip(spell: any): number[] {
  const t: string = spell.tooltip || '';
  const keys = ['qdamage', 'wdamage', 'edamage', 'rdamage', 'totaldamage', 'damage'];
  const dv = spell.datavalues || spell.dataValues || {};

  for (const key of keys) {
    const val = dv[key];
    if (!val) continue;
    if (Array.isArray(val)) {
      const nums = (val as any[]).map(v => Number(v) || 0);
      if (nums.some(n => n > 0)) return nums;
    } else if (typeof val === 'string') {
      const parts = val.split('/');
      const nums = parts.map(p => {
        const n = parseFloat(p.replace(/[^0-9.]/g, ''));
        return isNaN(n) ? 0 : n;
      });
      if (nums.some(n => n > 0)) return nums;
    }
  }
  return [0, 0, 0, 0, 0];
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
        const upstream = await fetch(`${DATA_BASE}/api/dd/champions?patch=${encodeURIComponent(patch)}&locale=${encodeURIComponent(locale)}`);
        if (upstream.ok) {
          return NextResponse.json(await upstream.json());
        }
      } catch {}
    }

    const cdnUrl = `https://ddragon.leagueoflegends.com/cdn/${patch}/data/${locale}/champion.json`;
    const r = await fetch(cdnUrl, { next: { revalidate: 3600 } });
    if (!r.ok) return NextResponse.json({ error: 'Failed to fetch champions from CDN' }, { status: 500 });
    const json = await r.json();

    const result: any[] = [];
    const entries = Object.values(json.data || {});

    for (const c of entries as any[]) {
      let spells: any[] = [];
      try {
        const detailUrl = `https://ddragon.leagueoflegends.com/cdn/${patch}/data/${locale}/champion/${encodeURIComponent(c.id)}.json`;
        const dr = await fetch(detailUrl, { next: { revalidate: 3600 } });
        if (dr.ok) {
          const djson = await dr.json();
          const champData = djson.data?.[c.id];
          if (champData && Array.isArray(champData.spells)) {
            spells = champData.spells.map((s: any, idx: number) => {
              let base: number[] = [];
              if (Array.isArray(s.effect) && s.effect[1]) {
                base = (s.effect[1] as number[]).map(v => Number(v) || 0);
              } else if (Array.isArray(s.effectBurn) && s.effectBurn[1]) {
                const parts = String(s.effectBurn[1]).split('/');
                base = parts.map(p => {
                  const n = parseFloat(p.replace(/[^0-9.]/g, ''));
                  return isNaN(n) ? 0 : n;
                });
              }
              if (!base || !base.some(n => n > 0)) {
                base = approximateBaseFromTooltip(s);
              }
              const mr = s.maxrank || s.maxRank || 5;
              if (!base || !base.some(n => n > 0)) {
                if (mr === 3) base = [100, 200, 300];
                else if (mr === 4) base = [60, 105, 150, 195];
                else base = [50, 80, 110, 140, 170];
              }

              let apRatio = 0;
              let adRatio = 0;
              if (Array.isArray(s.vars)) {
                for (const v of s.vars) {
                  if (v.link === 'spelldamage' || v.key === 'a') {
                    const coeff = Array.isArray(v.coeff) ? v.coeff[0] : v.coeff;
                    apRatio = Number(coeff) || apRatio;
                  }
                  if (v.link === 'attackdamage' || v.key === 'b') {
                    const coeff = Array.isArray(v.coeff) ? v.coeff[0] : v.coeff;
                    adRatio = Number(coeff) || adRatio;
                  }
                }
              }

              const rawDamageType = (s.damageType || '').toLowerCase();
              const damageType = rawDamageType === 'physical' ? 'physical' : rawDamageType === 'true' ? 'true' : 'magic';

              return {
                id: ['Q', 'W', 'E', 'R'][idx] || String(idx),
                name: s.name,
                imageFull: s.image?.full || null,
                description: s.description || '',
                tooltip: s.tooltip || '',
                maxRank: mr,
                cooldown: s.cooldown || [],
                cost: s.cost || [],
                baseDamage: base,
                ratios: { ap: apRatio, ad: adRatio },
                damageType,
              };
            });
          }
        }
      } catch {}

      result.push({
        id: c.id,
        key: c.key,
        name: c.name,
        title: c.title,
        imageFull: c.image?.full || null,
        stats: c.stats || {},
        spells,
      });
    }

    return NextResponse.json({ patch, data: result });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
