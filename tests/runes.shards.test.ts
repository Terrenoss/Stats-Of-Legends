import useBuildStore from '../src/stores/useBuildStore';

test('shards affect stats', ()=>{
  const store = useBuildStore.getState();
  store.clearBuild();
  store.setChampion({ id: 'Test', key: 'Test', name: 'Test', stats: { hp: 500, hpperlevel: 80, attackdamage: 60, attackdamageperlevel: 3, armor: 30, armorperlevel: 3, spellblock: 30, spellblockperlevel: 1.25, attackspeed: 0.625, attackspeedperlevel: 0.02 } });
  store.setShard('offense', 'adaptive_force');
  store.setShard('flex', 'armor');
  store.setShard('defense', 'hp');
  const s = useBuildStore.getState().computedStats;
  expect(s.hp).toBeGreaterThan(500);
  expect(s.armor).toBeGreaterThan(30);
});

