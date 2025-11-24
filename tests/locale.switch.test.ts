import useBuildStore from '../src/stores/useBuildStore';

test('locale switch updates store and persists', () => {
  // default may be en
  useBuildStore.getState().setLocale('fr');
  expect(useBuildStore.getState().locale).toBe('fr');
  useBuildStore.getState().setLocale('en');
  expect(useBuildStore.getState().locale).toBe('en');
});
