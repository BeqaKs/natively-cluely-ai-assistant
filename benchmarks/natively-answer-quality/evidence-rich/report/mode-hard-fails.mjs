#!/usr/bin/env node
// One mode's hard-fail rows in a judged run (development sets only: this prints questions and answers).
//   node evidence-rich/report/mode-hard-fails.mjs --mode sales --runs er6-dev-main,er6-dev2-main [--prev er4-dev-main,er4-dev2-main] [--full]
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { loadRun, objective, answerOf } from '../objective.mjs'; import { officialScore } from '../judge/score-er.mjs';
const ER = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2); const opt = (k, d = null) => { const i = args.indexOf(`--${k}`); return i >= 0 ? args[i + 1] : d; };
const mode = opt('mode'), full = args.includes('--full');
const lines = (f) => (fs.existsSync(f) ? fs.readFileSync(f, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)) : []);
const read = (names) => { const m = new Map(); for (const n of names.split(',')) { if (/holdout|val/.test(n)) throw new Error('development sets only');
  const run = loadRun(path.join(ER, 'results', n)); const J = new Map(lines(path.join(ER, 'judge/out/base', `${n}.astra.jsonl`)).filter((j) => j.ok && j.judge_model === 'gpt-6-astra').map((j) => [j.benchmark_id, j]));
  for (const row of run.rows) { const item = run.ds.byId[row.benchmark_id]; const j = J.get(row.benchmark_id); if (!item || !j || item.mode !== mode) continue;
    const o = objective(item, row); m.set(row.benchmark_id, { n, item, row, j: j.judgment, off: officialScore(j.judgment, item.mode, o), o}); } } return m; };
const A = read(opt('runs')); const P = opt('prev') ? read(opt('prev')) : new Map();
const cut = (s, n) => { s = String(s ?? '').replace(/\s+/g, ' ').trim(); return full || s.length <= n ? s : s.slice(0, n) + ' …'; };
let k = 0;
for (const [id, r] of A) { if (!r.off.hard_fail) continue; k++; const p = P.get(id);
  console.log(`\n=== ${k}. ${id} | ${r.item.condition} | ${r.row.surface} | score ${r.off.overall.toFixed(1)}${p ? ` (before: ${p.off.overall.toFixed(1)}${p.off.hard_fail ? ' hard' : ''})` : ''} | flags ${(r.off.flags ?? []).join(',') || '-'} | pass edited ${r.row.answer_differs_raw_vs_rendered === true} | second requests ${r.row.second_pass_requests ?? 0} | required ${r.o.required_strings.found}/${r.o.required_strings.total}`);
  console.log(`Q: ${cut(r.row.question, 400)}`);
  console.log(`EXPECTED: ${cut(r.j.expected_behavior, 500)}`);
  console.log(`ISSUE: ${cut(r.j.specific_issue, 700)}`);
  console.log(`SHOWN: ${cut(answerOf(r.row), 900)}`);
  if (r.row.answer_differs_raw_vs_rendered === true) console.log(`DRAFT: ${cut(r.row.raw_answer, 900)}`); }
console.log(`\n${k} hard-fail rows of ${A.size} judged in ${mode}`);
