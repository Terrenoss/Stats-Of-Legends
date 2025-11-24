#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return res.json();
}

async function main() {
  try {
    console.log('Fetching versions...');
    const versions = await fetchJson('https://ddragon.leagueoflegends.com/api/versions.json');
    const patch = versions[0];
    console.log('Latest patch:', patch);

    const outDir = path.join(process.cwd(), 'data', patch);
    fs.mkdirSync(outDir, { recursive: true });

    const base = `https://ddragon.leagueoflegends.com/cdn/${patch}/data/en_US`;
    const files = [
      { url: `${base}/champion.json`, name: 'champion.json' },
      { url: `${base}/item.json`, name: 'item.json' },
      { url: `${base}/runesReforged.json`, name: 'runesReforged.json' }
    ];

    for (const f of files) {
      console.log('Downloading', f.url);
      const data = await fetchJson(f.url);
      fs.writeFileSync(path.join(outDir, f.name), JSON.stringify(data, null, 2));
    }

    const manifest = { patch, fetchedAt: new Date().toISOString() };
    fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));

    console.log('Data saved to', outDir);
  } catch (err) {
    console.error('Error in fetch-ddragon:', err);
    process.exitCode = 1;
  }
}

main();

