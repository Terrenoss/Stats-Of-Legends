#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function mkdirp(p) {
  fs.mkdirSync(p, { recursive: true });
}

async function download(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed ${url} -> ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(dest, buf);
}

async function main() {
  try {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      console.error('No data dir found. Run dd:update to fetch JSON first.');
      process.exit(1);
    }
    const patches = fs.readdirSync(dataDir).filter(d => fs.statSync(path.join(dataDir, d)).isDirectory());
    if (patches.length === 0) {
      console.error('No patch directories in data/.');
      process.exit(1);
    }
    const patch = patches[0];
    const outDir = path.join(process.cwd(), 'public', 'data', patch, 'img');
    mkdirp(outDir);

    const championBase = `https://ddragon.leagueoflegends.com/cdn/${patch}/img/champion`;
    const itemBase = `https://ddragon.leagueoflegends.com/cdn/${patch}/img/item`;

    const champions = JSON.parse(fs.readFileSync(path.join(dataDir, patch, 'champion.json')));
    const items = JSON.parse(fs.readFileSync(path.join(dataDir, patch, 'item.json')));

    // champions data contains data object with champion keys
    const champKeys = Object.keys(champions.data || {});
    for (const key of champKeys) {
      const file = `${key}.png`;
      const url = `${championBase}/${file}`;
      const dest = path.join(outDir, 'champion-' + file);
      try {
        console.log('Downloading', url);
        await download(url, dest);
      } catch (err) {
        console.warn('Failed to download champion icon', url, err.message);
      }
    }

    // items: keys are item ids
    const itemKeys = Object.keys(items.data || {});
    for (const id of itemKeys) {
      const file = `${id}.png`;
      const url = `${itemBase}/${file}`;
      const dest = path.join(outDir, 'item-' + file);
      try {
        console.log('Downloading', url);
        await download(url, dest);
      } catch (err) {
        console.warn('Failed to download item icon', url, err.message);
      }
    }

    console.log('Images copied to', outDir);
  } catch (err) {
    console.error(err);
    process.exitCode = 1;
  }
}

main();

