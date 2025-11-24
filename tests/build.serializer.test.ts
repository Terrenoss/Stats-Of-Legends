import { exportBuildToJson, importBuildFromJson } from '../src/lib/utils/buildSerializer';

test('export/import roundtrip', ()=>{
  const build = { champion: { id: 'Aatrox' }, level: 9, items: [{ id: '1001' }], runes: { primaryTreeId: '8000', keystoneId: '8010', primarySelections: ['8005', '8008', '8014'], secondaryTreeId: '8100', secondarySelections: [{ slotIndex: 0, runeId: '8100' }, { slotIndex: 2, runeId: '8128' }], shards: { offense: 'adaptive_force', flex: 'armor', defense: 'hp' } } };
  const json = exportBuildToJson(build);
  const parsed = importBuildFromJson(json);
  expect(parsed).toEqual(build);
});

