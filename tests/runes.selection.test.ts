import useBuildStore from '../src/stores/useBuildStore';

test('secondary selection enforces 2 runes on different rows', ()=>{
  const store = useBuildStore.getState();
  store.clearBuild();
  store.setSecondaryTree('test');
  // pick rune on row 0
  store.toggleSecondaryPick(0, 'r1');
  expect(useBuildStore.getState().runes.secondarySelections.length).toBe(1);
  // pick another rune on same row -> should replace
  store.toggleSecondaryPick(0, 'r2');
  expect(useBuildStore.getState().runes.secondarySelections.length).toBe(1);
  // pick on different row
  store.toggleSecondaryPick(1, 'r3');
  expect(useBuildStore.getState().runes.secondarySelections.length).toBe(2);
});

test('primary keystone unique', ()=>{
  const store = useBuildStore.getState();
  store.clearBuild();
  store.setPrimaryTree('t');
  store.setPrimaryKeystone('k1');
  expect(useBuildStore.getState().runes.keystoneId).toBe('k1');
  store.setPrimaryKeystone('k2');
  expect(useBuildStore.getState().runes.keystoneId).toBe('k2');
});
