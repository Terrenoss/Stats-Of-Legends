import fs from 'fs/promises';
import path from 'path';

export async function getPatchesDir(): Promise<string[]> {
  const dataDir = path.join(process.cwd(), 'data');
  try {
    const entries = await fs.readdir(dataDir, { withFileTypes: true });
    return entries.filter(e => e.isDirectory()).map(d => d.name).sort((a, b) => b.localeCompare(a));
  } catch (err) {
    // no data dir
    return [];
  }
}

export async function getLatestPatch(): Promise<string | null> {
  const dirs = await getPatchesDir();
  if (!dirs || dirs.length === 0) return null;
  return dirs[0];
}

export async function readJsonFromPatch(filename: string, patch?: string) {
  const p = patch || (await getLatestPatch());
  if (!p) throw new Error('No patch data found. Run dd:update');
  const filePath = path.join(process.cwd(), 'data', p, filename);
  const content = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(content);
}

export async function readManifest(patch?: string) {
  const p = patch || (await getLatestPatch());
  if (!p) throw new Error('No patch data found. Run dd:update');
  const filePath = path.join(process.cwd(), 'data', p, 'manifest.json');
  const content = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(content);
}

export async function getNormalizedChampions(patch?: string, locale?: string) {
  const p = patch || (await getLatestPatch());
  if (!p) throw new Error('No patch data found. Run dd:update');
  // try localized file first
  const localizedPath = path.join(process.cwd(), 'data', p, 'data', locale || 'en_US', 'champion.json');
  const defaultPath = path.join(process.cwd(), 'data', p, 'champion.json');
  let champions: any;
  try {
    const content = await fs.readFile(localizedPath, 'utf-8');
    champions = JSON.parse(content);
  } catch (err) {
    const content = await fs.readFile(defaultPath, 'utf-8');
    champions = JSON.parse(content);
  }
  const data = champions.data || {};
  const list = Object.values(data).map((c: any) => ({
    id: c.id,
    key: c.key,
    name: c.name,
    tags: c.tags || [],
    imageFull: c.image?.full || null,
    // legacy alias used by some components
    image: c.image?.full || null,
    stats: c.stats || {}
  }));
  return { patch: p, data: list };
}

export async function getNormalizedItems(patch?: string, locale?: string) {
  const p = patch || (await getLatestPatch());
  if (!p) throw new Error('No patch data found. Run dd:update');
  const localizedPath = path.join(process.cwd(), 'data', p, 'data', locale || 'en_US', 'item.json');
  const defaultPath = path.join(process.cwd(), 'data', p, 'item.json');
  let items: any;
  try {
    const content = await fs.readFile(localizedPath, 'utf-8');
    items = JSON.parse(content);
  } catch (err) {
    const content = await fs.readFile(defaultPath, 'utf-8');
    items = JSON.parse(content);
  }
  const data = items.data || {};
  const list = Object.keys(data).map((id) => {
    const it = data[id];
    return {
      id: String(id),
      name: it.name,
      imageFull: it.image?.full || (id + '.png'),
      // alias for client components
      image: it.image?.full || (id + '.png'),
      stats: it.stats || {},
      gold: it.gold || { base: 0, total: 0, sell: 0 },
      plaintext: it.plaintext || '',
      description: it.description || ''
    };
  });
  return { patch: p, data: list };
}
