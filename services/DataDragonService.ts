import { CURRENT_PATCH } from '@/constants';

const DATA_BASE = process.env.DATA_BASE || '';

export class DataDragonService {

    private static approximateBaseFromTooltip(spell: any): number[] {
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

    private static processSpell(spell: any, idx: number) {
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
            base = this.approximateBaseFromTooltip(spell);
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
        let damageType = 'magic';
        if (rawDamageType === 'physical') damageType = 'physical';
        else if (rawDamageType === 'true') damageType = 'true';

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
    }

    static async getChampions(patch: string = 'latest', locale: string = 'en_US') {
        if (patch === 'latest') {
            patch = CURRENT_PATCH;
        }

        if (DATA_BASE) {
            try {
                const upstream = await fetch(`${DATA_BASE}/api/dd/champions?patch=${encodeURIComponent(patch)}&locale=${encodeURIComponent(locale)}`);
                if (upstream.ok) {
                    return await upstream.json();
                }
            } catch (error) {
                console.error('Upstream fetch failed:', error);
            }
        }

        const cdnUrl = `https://ddragon.leagueoflegends.com/cdn/${patch}/data/${locale}/championFull.json`;
        const response = await fetch(cdnUrl, { next: { revalidate: 3600 } });
        if (!response.ok) throw new Error('Failed to fetch champions from CDN');
        const json = await response.json();

        const result: any[] = [];
        const entries = Object.values(json.data || {});

        for (const championEntry of entries as any[]) {
            let spells: any[] = [];

            if (Array.isArray(championEntry.spells)) {
                spells = championEntry.spells.map((spell: any, idx: number) => this.processSpell(spell, idx));
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

        return { patch, data: result };
    }
}
