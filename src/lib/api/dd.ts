function normalizeLocale(locale: string | undefined) {
  if (!locale) return 'en_US';
  const l = locale.toLowerCase();
  if (l.startsWith('fr')) return 'fr_FR';
  if (l.startsWith('en')) return 'en_US';
  return locale;
}

export async function getManifestClient() {
  const res = await fetch('/api/dd/manifest');
  if (!res.ok) throw new Error('Failed to fetch manifest');
  return res.json();
}

export async function fetchChampionsClient(patch = 'latest', locale = 'en') {
  const loc = normalizeLocale(locale);
  const url = `/api/dd/champions?patch=${encodeURIComponent(patch)}&locale=${encodeURIComponent(loc)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch champions');
  const body = await res.json();
  // if locale is not en_US, also fetch en_US for name_en
  if (loc !== 'en_US') {
    try {
      const r2 = await fetch(`/api/dd/champions?patch=${encodeURIComponent(patch)}&locale=en_US`);
      if (r2.ok) {
        const b2 = await r2.json();
        const mapEn = new Map((b2.data || []).map((c:any)=> [c.id, c.name]));
        const data = (body.data || []).map((c:any)=> ({ ...c, name_en: mapEn.get(c.id) || c.name }));
        return { patch: body.patch || patch, data };
      }
    } catch (e) { /* ignore */ }
  }
  return body;
}

export async function fetchItemsClient(patch = 'latest', locale = 'en') {
  const loc = normalizeLocale(locale);
  const url = `/api/dd/items?patch=${encodeURIComponent(patch)}&locale=${encodeURIComponent(loc)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch items');
  const body = await res.json();
  if (loc !== 'en_US') {
    try {
      const r2 = await fetch(`/api/dd/items?patch=${encodeURIComponent(patch)}&locale=en_US`);
      if (r2.ok) {
        const b2 = await r2.json();
        const mapEn = new Map((b2.data || []).map((it:any)=> [it.id, it.name]));
        const data = (body.data || []).map((it:any)=> ({ ...it, name_en: mapEn.get(it.id) || it.name }));
        return { patch: body.patch || patch, data };
      }
    } catch (e) { /* ignore */ }
  }
  return body;
}

export async function fetchRunesClient() {
  const res = await fetch('/api/dd/runes');
  if (!res.ok) throw new Error('Failed to fetch runes');
  return res.json();
}

function parseNumbersFromText(text: string) {
  if (!text) return undefined;
  // find patterns like 50/80/110/140/170 or 50 / 80 / 110
  const m = text.match(/(?:\d+[\.,]?\d*)(?:\s*\/\s*(?:\d+[\.,]?\d*))+?/g);
  if (!m) return undefined;
  // pick first match and split
  const first = m[0];
  const parts = first.split('/').map(p => Number(p.replace(',', '.').trim())).filter(n => !Number.isNaN(n));
  if (parts.length > 0) return parts;
  return undefined;
}

export async function getChampionSpellsClient(championKey: string, patch = 'latest') {
  if (!championKey) return null;
  const name = championKey;
  const url = `https://ddragon.leagueoflegends.com/cdn/${patch}/data/en_US/champion/${encodeURIComponent(name)}.json`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('not ok');
    const json = await res.json();
    const data = json.data && json.data[name];
    if (!data) throw new Error('no data');
    const spells = (data.spells || []).slice(0, 4).map((s: any, idx: number) => {
      // extract scalings (coeff may be array per rank or a number)
      let scalingAD = 0;
      let scalingAP = 0;
      let scalingADByRank: number[] | undefined = undefined;
      let scalingAPByRank: number[] | undefined = undefined;
      if (Array.isArray(s.vars)) {
        for (const v of s.vars) {
          const coeff = v.coeff;
          const link = String(v.key || v.ratio || '').toLowerCase();
          if (Array.isArray(coeff)) {
            const nums = coeff.map((c:any)=>Number(c||0));
            if (link.includes('attackdamage') || link.includes('ad')) {
              scalingADByRank = nums;
              scalingAD = nums[0] || 0;
            }
            if (link.includes('abilitypower') || link.includes('ap')) {
              scalingAPByRank = nums;
              scalingAP = nums[0] || 0;
            }
          } else {
            const cnum = Number(coeff || 0);
            if (link.includes('attackdamage') || link.includes('ad')) scalingAD += cnum;
            if (link.includes('abilitypower') || link.includes('ap')) scalingAP += cnum;
          }
        }
      }

      // attempt to extract base damage per rank from effect arrays
      let baseByRank: number[] | undefined = undefined;
      if (Array.isArray(s.effect)) {
        for (const eff of s.effect) {
          if (Array.isArray(eff)) {
            // pick arrays that contain numbers and at least two numbers (per-rank)
            const nums = eff.slice(1).map((v:any)=>Number(v || 0)).filter(n=>!Number.isNaN(n));
            if (nums.length >= 2) { baseByRank = nums; break; }
          }
        }
      }

      // fallback: parse numbers from tooltip/description
      if (!baseByRank) {
        baseByRank = parseNumbersFromText(s.tooltip || s.description || '') || undefined;
      }

      const maxRank = s.maxrank || (baseByRank ? baseByRank.length : 1);
      const icon = s.image && s.image.full ? `https://ddragon.leagueoflegends.com/cdn/${patch}/img/spell/${s.image.full}` : undefined;
      const type = (scalingAD > scalingAP) ? 'physical' : 'magical';
      return {
        id: ['Q','W','E','R'][idx] || `S${idx+1}`,
        name: s.name,
        description: s.description || s.tooltip || '',
        maxRank: maxRank,
        baseByRank: baseByRank || undefined,
        scalingAD: scalingAD,
        scalingAP: scalingAP,
        scalingADByRank: scalingADByRank,
        scalingAPByRank: scalingAPByRank,
        icon,
        type
      };
    });
    return spells;
  } catch (err) {
    // fallback stub spells
    return [
      { id: 'Q', name: 'Q', description: '', baseByRank: [50,80,110,140,170], scalingAD: 1.0, scalingAP: 0, maxRank: 5, icon: undefined, type: 'physical' },
      { id: 'W', name: 'W', description: '', baseByRank: [40,60,80,100,120], scalingAD: 0.6, scalingAP: 0, maxRank: 5, icon: undefined, type: 'physical' },
      { id: 'E', name: 'E', description: '', baseByRank: [30,45,60,75,90], scalingAD: 0.5, scalingAP: 0, maxRank: 5, icon: undefined, type: 'physical' },
      { id: 'R', name: 'R', description: '', baseByRank: [100,150,200], scalingAD: 0.8, scalingAP: 0, maxRank: 3, icon: undefined, type: 'physical' }
    ];
  }
}
