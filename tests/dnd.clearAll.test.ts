import useBuildStore from '../src/stores/useBuildStore';

beforeEach(()=>{
  useBuildStore.setState({ items: Array.from({ length: 6 }).map(()=>({ id: null, data: null })) });
});

test('clearAllItems empties all slots', ()=>{
  useBuildStore.getState().setItemInSlot(0, { id: '1001', name: 'Test', stats: {}, gold: { total: 300 } } as any);
  expect(useBuildStore.getState().items[0].id).toBe('1001');
  useBuildStore.getState().clearAllItems();
  expect(useBuildStore.getState().items.every((s:any)=>s.id===null)).toBe(true);
});
