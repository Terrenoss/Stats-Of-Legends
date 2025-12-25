import { NextRequest, NextResponse } from 'next/server';
import { CURRENT_PATCH } from '@/constants';

const DATA_BASE = process.env.DATA_BASE || '';

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
      patch = CURRENT_PATCH;
    }

    if (DATA_BASE) {
      try {
        const upstream = await fetch(`${DATA_BASE}/api/dd/champions?patch=${encodeURIComponent(patch)}&locale=${encodeURIComponent(locale)}`);
        if (upstream.ok) {
          return NextResponse.json(await upstream.json());
        }
      } catch (error) {
        console.error('Upstream fetch failed:', error);
      }
    }

    // Use championFull.json to get all data in one go
    const cdnUrl = `https://ddragon.leagueoflegends.com/cdn/${patch}/data/${locale}/championFull.json`;
    const response = await fetch(cdnUrl, { next: { revalidate: 3600 } });
    if (!response.ok) return NextResponse.json({ error: 'Failed to fetch champions from CDN' }, { status: 500 });
    const json = await response.json();

    const result: any[] = [];
    const entries = Object.values(json.data || {});

    for (const championEntry of entries as any[]) {
      let spells: any[] = [];

      // championEntry in championFull.json already has spells and detailed stats
      if (Array.isArray(championEntry.spells)) {
        spells = championEntry.spells.map((spell: any, idx: number) => {
          let base: number[] = [];
          if (Array.isArray(spell.effect) && spell.effect[1]) {
            base = (spell.effect[1] as number[]).map(v => Number(v) || 0);
          } else if (Array.isArray(spell.effectBurn) && spell.effectBurn[1]) {
            const parts = String(spell.effectBurn[1]).split('/');
            base = parts.map(p => {
              const n = parseFloat(p.replace(/[^0-9.]/g, ''));
              return isNaN(n) ? 0 : n;
            });
          }

          if (!base || !base.some(n => n > 0)) {
            base = approximateBaseFromTooltip(spell);
          }

          const mr = spell.maxrank || spell.maxRank || 5;
          if (!base || !base.some(n => n > 0)) {
            if (mr === 3) base = [100, 200, 300];
            else if (mr === 4) base = [60, 105, 150, 195];
            else base = [50, 80, 110, 140, 170];
          }

          let apRatio = 0;
          let adRatio = 0;
          if (Array.isArray(spell.vars)) {
            for (const v of spell.vars) {
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

          const rawDamageType = (spell.damageType || '').toLowerCase();
          const damageType = rawDamageType === 'physical' ? 'physical' : rawDamageType === 'true' ? 'true' : 'magic';

          return {
            id: ['Q', 'W', 'E', 'R'][idx] || String(idx),
            name: spell.name,
            imageFull: spell.image?.full || null,
            description: spell.description || '',
            tooltip: spell.tooltip || '',
            maxRank: mr,
            cooldown: spell.cooldown || [],
            cost: spell.cost || [],
            baseDamage: base,
            ratios: { ap: apRatio, ad: adRatio },
            damageType,
          };
        });
      }

      result.push({
        id: championEntry.id,
        key: championEntry.key,
        name: championEntry.name,
        title: championEntry.title,
        imageFull: championEntry.image?.full || null,
        stats: championEntry.stats || {},
        spells,
      });
    }

    return NextResponse.json({ patch, data: result });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
