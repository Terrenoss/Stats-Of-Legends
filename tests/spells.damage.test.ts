import { calcSpellDamageFromSpell } from '../src/lib/calculations/spell';

test('spell damage uses AD and AP scaling', ()=>{
  const stats = { ad: 100, ap: 50, hp:0, armor:0, mr:0, as:0, crit:0, haste:0, mp:0, mp_s:0 };
  const spell = { base: 50, scalingAD: 0.5, scalingAP: 0.2 };
  const raw = calcSpellDamageFromSpell(stats as any, spell as any);
  expect(Math.round(raw)).toBe(50 + 0.5*100 + 0.2*50);
});
