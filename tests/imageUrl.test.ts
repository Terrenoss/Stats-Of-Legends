import { championIconCandidates, itemIconCandidates } from '../src/lib/dd/imageUrl';

test('championIconCandidates returns cdn and local', ()=>{
  const res = championIconCandidates('Aatrox.png', '15.22.1');
  expect(res.cdn).toContain('/cdn/15.22.1/');
  expect(res.local).toContain('/data/15.22.1/img/');
});

test('itemIconCandidates returns cdn and local', ()=>{
  const res = itemIconCandidates('1001.png', '15.22.1');
  expect(res.cdn).toContain('/cdn/15.22.1/');
  expect(res.local).toContain('/data/15.22.1/img/');
});

