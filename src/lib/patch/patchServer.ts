import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const PATCH_STATE_FILE = path.join(DATA_DIR, 'patch-state.json');

export type PatchStatus = 'idle' | 'pending' | 'in_progress' | 'success' | 'failed';

export interface PatchRecord {
  version: string;
  detectedAt?: string;
  startedAt?: string;
  completedAt?: string;
  status: PatchStatus;
  triggeredBy?: string; // 'auto' or admin user
  error?: string | null;
}

// Ensure data dir
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function readState(): { currentPatch?: string; pending?: PatchRecord } {
  try {
    const raw = fs.readFileSync(PATCH_STATE_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    return {};
  }
}

function writeState(state: any) {
  fs.writeFileSync(PATCH_STATE_FILE, JSON.stringify(state, null, 2));
}

async function fetchLatestDDragonVersion(): Promise<string | null> {
  try {
    const res = await fetch('https://ddragon.leagueoflegends.com/api/versions.json');
    if (!res.ok) return null;
    const arr = await res.json();
    if (Array.isArray(arr) && arr.length) return arr[0];
    return null;
  } catch (err) {
    console.error('[patchServer] fetchLatestDDragonVersion error', err);
    return null;
  }
}

async function fetchAndSaveJson(url: string, outPath: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetch ${url} failed ${res.status}`);
  const json = await res.json();
  const dir = path.dirname(outPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(json, null, 2));
}

export async function runPatchUpdate(version: string, triggeredBy = 'auto') {
  const state = readState();
  const pending: PatchRecord = {
    version,
    detectedAt: new Date().toISOString(),
    startedAt: new Date().toISOString(),
    status: 'in_progress',
    triggeredBy,
  };
  writeState({ ...state, pending });
  const start = Date.now();
  try {
    // Fetch champion and item JSON (en_US)
    const base = `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US`;
    const outDir = path.join(DATA_DIR, version);
    await fetchAndSaveJson(`${base}/champion.json`, path.join(outDir, 'champion.json'));
    await fetchAndSaveJson(`${base}/item.json`, path.join(outDir, 'item.json'));
    await fetchAndSaveJson(`${base}/runesReforged.json`, path.join(outDir, 'runesReforged.json'));

    // Pre-validation: simple checks
    const championFile = path.join(outDir, 'champion.json');
    const itemFile = path.join(outDir, 'item.json');
    const champ = JSON.parse(fs.readFileSync(championFile, 'utf-8'));
    const items = JSON.parse(fs.readFileSync(itemFile, 'utf-8'));
    if (!champ || !champ.data || typeof champ.data !== 'object') throw new Error('champion data invalid');
    if (!items || !items.data) throw new Error('item data invalid');

    // Promote: set currentPatch and clear pending
    const finalState = readState();
    finalState.currentPatch = version;
    finalState.pending = { ...pending, completedAt: new Date().toISOString(), status: 'success' };
    writeState(finalState);

    console.info(`[patchServer] patch ${version} applied in ${(Date.now()-start)/1000}s`);
    return { ok: true };
  } catch (err: any) {
    console.error('[patchServer] runPatchUpdate failed', err);
    const state2 = readState();
    state2.pending = { ...pending, completedAt: new Date().toISOString(), status: 'failed', error: String(err) };
    writeState(state2);
    return { ok: false, error: String(err) };
  }
}

let intervalStarted = false;

export function startAutoPatchChecker(opts?: { intervalMs?: number }) {
  if (intervalStarted) return;
  intervalStarted = true;
  const intervalMs = opts?.intervalMs ?? 1000 * 60 * 30; // 30 min default

  async function check() {
    try {
      const latest = await fetchLatestDDragonVersion();
      if (!latest) return;
      const state = readState();
      const current = state.currentPatch || null;
      if (latest !== current) {
        console.info('[patchServer] Detected new patch', latest, 'current', current);
        // create pending if not exist or different
        if (!state.pending || state.pending.version !== latest) {
          state.pending = { version: latest, detectedAt: new Date().toISOString(), status: 'pending' };
          writeState(state);
          // trigger update automatically
          // Do not await to avoid blocking
          runPatchUpdate(latest, 'auto');
        }
      }
    } catch (err) {
      console.error('[patchServer] check error', err);
    }
  }

  // initial check
  check();
  setInterval(check, intervalMs);
}

export function getCurrentPatch() {
  const state = readState();
  return { currentPatch: state.currentPatch || null, pending: state.pending || null };
}

export function getPending() {
  const state = readState();
  return state.pending || null;
}

export function triggerApplyPatch(version: string, triggeredBy = 'manual') {
  // kick off a run in background
  runPatchUpdate(version, triggeredBy);
}

