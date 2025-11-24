import useBuildStore from '../src/stores/useBuildStore';

test('set, swap, remove items and recompute', ()=>{
  const store = useBuildStore.getState();
  // clear first
  store.clearBuild();
  store.setItemInSlot(0, { id: '1001', name: 'Boots', stats: { FlatHPPoolMod: 50 } });
  expect(useBuildStore.getState().items[0].id).toBe('1001');
  store.setItemInSlot(1, { id: '6653', name: 'AD Item', stats: { FlatPhysicalDamageMod: 60 } });
  expect(useBuildStore.getState().items[1].id).toBe('6653');
  store.swapItems(0,1);
  expect(useBuildStore.getState().items[0].id).toBe('6653');
  store.removeItem(0);
  expect(useBuildStore.getState().items[0].id).toBeNull();
});

