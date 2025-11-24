import { readManifest } from '../src/lib/server/dd-server';

test('read manifest returns object', async ()=>{
  const m = await readManifest();
  expect(m).toBeDefined();
  expect(m.patch).toBeDefined();
});

