const BASE = 'https://www.leagueoflegends.com';

function normalizeVersion(version: string) {
  // Accept 15.23.1 or 15-23-1 or 15.23 etc.
  if (!version) return '';
  const v = version.replace(/[^0-9.\-]/g, '').trim();
  const parts = v.includes('-') ? v.split('-') : v.split('.');
  const nums = parts.filter(Boolean);
  return nums.join('.');
}

function buildCandidates(version: string) {
  // return candidate slugs based on spec
  // version normalized like 15.23.1 or 15.23
  const parts = version.split('.');
  const major = parts[0];
  const minor = parts[1] || '0';
  const build = parts[2] || null;
  const baseDash = `${major}-${minor}`;
  const candidates: string[] = [];
  // prefer patch-15-23-notes
  candidates.push(`patch-${baseDash}-notes`);
  candidates.push(`patch-${baseDash}`);
  candidates.push(`patch-${major}.${minor}`);
  if (build) candidates.push(`patch-${baseDash}-${build}-notes`);
  // also try with minor as single digit maybe
  return candidates;
}

async function probeUrl(url: string, timeoutMs = 2500) {
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    // Try HEAD first
    let res = await fetch(url, { method: 'HEAD', signal: controller.signal });
    clearTimeout(id);
    if (res.ok) return true;
    // Some CDNs don't support HEAD properly; try GET minimal
    const controller2 = new AbortController();
    const id2 = setTimeout(() => controller2.abort(), timeoutMs);
    res = await fetch(url, { method: 'GET', signal: controller2.signal });
    clearTimeout(id2);
    return res.ok;
  } catch (err) {
    return false;
  }
}

export async function buildPatchNotesUrl(input: { version: string; locale?: string; timeoutMs?: number }): Promise<string> {
  const versionRaw = input.version || '';
  const localeRaw = (input.locale || 'fr-fr').toLowerCase();
  const timeoutMs = input.timeoutMs ?? 2500;

  const normalized = normalizeVersion(versionRaw);
  const candidates = buildCandidates(normalized);

  // try given locale first
  const localesToTry = [localeRaw];
  if (!localeRaw.startsWith('en')) localesToTry.push('en-us');

  for (const locale of localesToTry) {
    for (const slug of candidates) {
      // normalize locale path: ensure e.g. fr-fr -> fr-fr (no duplicates)
      const url = `${BASE}/${locale}/news/game-updates/${slug}/`.replace(`/${locale}/${locale}/`, `/${locale}/`);
      const ok = await probeUrl(url, timeoutMs);
      if (ok) return fixDuplicateLocale(url);
    }
  }

  // fallback generic patch-notes page
  const fallback = `${BASE}/${localeRaw}/news/tags/patch-notes`;
  console.warn(`[patchNotes] no patch notes resolved for version=${versionRaw} locales=[${localesToTry.join(',')}] - falling back to ${fallback}`);
  return fixDuplicateLocale(fallback);
}

function fixDuplicateLocale(url: string) {
  // Replace any double locales like /fr-fr/fr/ -> /fr-fr/
  return url.replace(/\/([a-z]{2}-[a-z]{2})\/(?:\1\/)+/i, '/$1/');
}

export default buildPatchNotesUrl;
