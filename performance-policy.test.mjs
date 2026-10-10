// Static policy checks, not browser benchmarks or a release approval.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL(path,import.meta.url),'utf8');
const policy=read('docs/performance-release.md');

test('Mini App policy links canonical CRM quality/fidelity and keeps all six profiles',()=>{
  for(const name of ['RELEASE-PERFORMANCE.md','RELEASE-UI-QUALITY.md','UI-PROTOTYPE-FIDELITY-PROTOCOL.md'])assert.ok(policy.includes('/CRM/blob/main/docs/'+name));
  for(const viewport of ['320×568','390×844','430×932','440×956','932×430','1440×900'])assert.ok(policy.includes(viewport));
  assert.match(policy,/ui_quality\.report_url/);
  assert.match(policy,/Safari\/PWA e Telegram su iPhone fisico rimangono obbligatori/);
  assert.match(policy,/almeno 5 campioni per flusso e profilo a cache fredda e 5 a cache calda/);
  assert.match(policy,/sia sulla baseline sia sul candidato/);
});

test('policy preserves budgets, Pages boundary and honest automation status',()=>{
  for(const budget of ['≤ 200 ms','≤ 2,5 s','≤ 3 s','> 20%','> 100 ms','> 250 ms'])assert.ok(policy.includes(budget));
  assert.match(policy,/raccolta e la validazione automatiche dei tempi restano da implementare/);
  assert.match(policy,/non è un benchmark/);
  assert.match(read('AGENTS.md'),/merge\s+che pubblica Pages/);
  assert.match(read('_config.yml'),/- AGENTS\.md/);
  assert.match(read('_config.yml'),/- docs/);
  assert.match(read('_config.yml'),/\*\.test\.mjs/);
});
