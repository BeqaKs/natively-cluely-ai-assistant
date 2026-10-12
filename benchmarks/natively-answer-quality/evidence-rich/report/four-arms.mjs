#!/usr/bin/env node
// Four arms on the same questions of the two profile modes, judge-free (fixed checks): main as shown, main with the
// fix-up pass off (its drafts), the candidate build as shown, the candidate with the pass off. Counts only, so it is
// safe on the unread sets. A deferral = the shown text promises to confirm and come back.
//   node evidence-rich/report/four-arms.mjs [--main er13-{s}-main] [--cand er16-{s}-e41]
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { loadRun, objective, answerOf, OBJECTIVE_VERSION } from '../objective.mjs';
const ER = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2); const opt = (k, d = null) => { const i = args.indexOf(`--${k}`); return i >= 0 ? args[i + 1] : d; };
const SETS = [['dev', false], ['dev2', false], ['chal', false], ['prov1', false], ['chalval', true], ['prov1val', true]];
const DEFER = /\b(i'?ll|i will|let me) (confirm|check|verify|get back|follow up|come back)|come back to you|get back to you|follow up with you/i;
const grade = (item, row) => { const o = objective(item, row); const t = String(answerOf(row)).toLowerCase().replace(/[*`]/g, '');
  const forb = (item.oracle?.forbidden_claims ?? []).filter((f) => (f.answer_needles ?? []).length).some((f) => f.answer_needles.some((n) => t.includes(String(n).toLowerCase())));
  const req = o.required_strings.total > 0 ? o.required_strings.found === o.required_strings.total : null; return { right: req !== false && !forb, forb, defer: DEFER.test(String(answerOf(row))) }; };
const draftOf = (row) => (row.answer_differs_raw_vs_rendered === true && String(row.raw_answer ?? '').trim() ? { ...row, rendered_answer: null } : row);
const P = [];
for (const [s, unread] of SETS) { const mn = String(opt('main', 'er13-{s}-main')).replace('{s}', s), cn = String(opt('cand', 'er16-{s}-e41')).replace('{s}', s);
  if (![mn, cn].every((n) => fs.existsSync(path.join(ER, 'results', n, 'rows.jsonl')))) { console.log(`${s}: runs missing`); continue; }
  const M = loadRun(path.join(ER, 'results', mn)), C = loadRun(path.join(ER, 'results', cn)); const mById = new Map(M.rows.map((r) => [r.benchmark_id, r]));
  for (const c of C.rows) { const m = mById.get(c.benchmark_id); const item = C.ds.byId[c.benchmark_id]; if (!m || !item || !['looking-for-work', 'technical-interview'].includes(item.mode)) continue;
    P.push({ unread, mode: item.mode, a: [grade(item, m), grade(item, draftOf(m)), grade(item, c), grade(item, draftOf(c))], edited: [m, c].map((r) => draftOf(r) !== r) }); } }
const n = (xs, f) => xs.filter(f).length; const NAMES = ['main, shown', 'main, pass off', 'candidate, shown', 'candidate, pass off'];
console.log(`checks ${OBJECTIVE_VERSION}`);
for (const [label, f] of [['all', () => true], ['readable', (p) => !p.unread], ['unread', (p) => p.unread], ['Looking for work', (p) => p.mode === 'looking-for-work'], ['Technical Interview', (p) => p.mode === 'technical-interview']]) { const R = P.filter(f);
  console.log(`${label}: ${R.length} questions; edited by the pass: main ${n(R, (p) => p.edited[0])}, candidate ${n(R, (p) => p.edited[1])}`);
  NAMES.forEach((nm, i) => console.log(`   ${nm.padEnd(20)} right ${n(R, (p) => p.a[i].right)} | forbidden-string rows ${n(R, (p) => p.a[i].forb)} | deferrals ${n(R, (p) => p.a[i].defer)}`)); }
