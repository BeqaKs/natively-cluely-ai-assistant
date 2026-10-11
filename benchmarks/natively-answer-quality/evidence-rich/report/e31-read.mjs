#!/usr/bin/env node
// E31 (Sales): the judge-free lines of the rule, each arm against the base arm. Replayed answers are graded again
// with the fixed checks (objective.mjs), samples pooled over k. Prints counts and medians only: no ids, questions or
// answers, so it is safe on the unread sets.
//   node evidence-rich/report/e31-read.mjs [--base e31-base] [--arms e31-a,e31-b]
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { loadRun, objective, OBJECTIVE_VERSION } from '../objective.mjs';
const ER = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2); const opt = (k, d = null) => { const i = args.indexOf(`--${k}`); return i >= 0 ? args[i + 1] : d; };
const GROUPS = [['development (dev + dev2)', ['er6-dev-main', 'er6-dev2-main']], ['challenge', ['er7-chal-main']], ['sales1', ['er12-sales1-main']], ['sales1-val (counts only)', ['er12-sales1val-main']], ['challenge-val (counts only)', ['er7-chalval-main']]];
const runs = new Map(); const run = (n) => { if (!runs.has(n)) runs.set(n, loadRun(path.join(ER, 'results', n))); return runs.get(n); };
const lines = (f) => (fs.existsSync(f) ? fs.readFileSync(f, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)) : []);
const words = (t) => String(t ?? '').replace(/\[\[GIST\]\][\s\S]*$/, '').trim().split(/\s+/).filter(Boolean).length;
const med = (xs) => { const v = [...xs].sort((a, b) => a - b); return v.length ? v[Math.floor(v.length / 2)] : null; };
function load(arm) {
  const out = [];
  for (const s of lines(path.join(ER, 'results/replay', `gen-${arm}.jsonl`))) {
    const r = run(s.run); const item = r.ds.byId[s.id]; const base = r.rows.find((x) => x.benchmark_id === s.id); if (!item || !base) continue;
    const row = { ...base, raw_answer: s.text, rendered_answer: s.text, answer_differs_raw_vs_rendered: false };
    const o = objective(item, row); const t = String(s.text ?? '').toLowerCase().replace(/[*`]/g, '');
    const forb = (item.oracle?.forbidden_claims ?? []).filter((f) => (f.answer_needles ?? []).length);
    // the same needle rule as the checks use for required strings would be best; a forbidden string is matched as report/e30-read.mjs does
    const forbHit = forb.some((f) => f.answer_needles.some((n) => t.includes(String(n).toLowerCase())));
    const calc = !!(item.oracle?.requires_calculation && item.oracle?.calculation_oracle); const calcOk = calc ? o.checks.some((x) => x.label === 'calculation result stated' && x.ok) : null;
    const reqOk = o.required_strings.total > 0 ? o.required_strings.found === o.required_strings.total : null;
    out.push({ run: s.run, id: s.id, k: s.k, condition: item.condition, err: s.err, empty: !String(s.text ?? '').trim(), forbHit, reqFound: o.required_strings.found, reqTotal: o.required_strings.total, right: reqOk !== false && !forbHit && calcOk !== false, words: words(s.text) });
  }
  return out;
}
const baseName = opt('base', 'e31-base'); const BASE = load(baseName); const pc = (a, b) => (b ? (100 * a / b).toFixed(1) : '–');
console.log(`checks ${OBJECTIVE_VERSION}; base arm ${baseName}: ${BASE.length} samples`);
const stat = (S) => ({ n: S.length, q: new Set(S.map((s) => `${s.run}|${s.id}`)).size, right: S.filter((s) => s.right).length, forb: S.filter((s) => s.forbHit).length, reqF: S.reduce((a, s) => a + s.reqFound, 0), reqT: S.reduce((a, s) => a + s.reqTotal, 0), bad: S.filter((s) => s.err || s.empty).length, words: med(S.map((s) => s.words)) });
const verdicts = {};
for (const arm of String(opt('arms', 'e31-a,e31-b')).split(',')) {
  const A = load(arm); console.log(`\n=== ${arm}: ${A.length} samples`); const fails = []; let forbDevS1 = 0;
  for (const [label, names] of GROUPS) {
    const b = stat(BASE.filter((s) => names.includes(s.run))), a = stat(A.filter((s) => names.includes(s.run))); if (!b.n && !a.n) continue;
    const dRight = Number(pc(a.right, a.n)) - Number(pc(b.right, b.n)), dReq = b.reqT ? Number(pc(a.reqF, a.reqT)) - Number(pc(b.reqF, b.reqT)) : 0;
    let v = '';
    if (label.startsWith('development')) { const ok = dRight >= -2.0 && a.forb <= b.forb; v = ok ? 'HOLDS (line 1)' : 'FAILS (line 1)'; if (!ok) fails.push(1); forbDevS1 += a.forb; }
    if (label === 'sales1') { const ok = a.forb < b.forb && dReq >= -2.0; v = ok ? 'HOLDS (line 2)' : 'FAILS (line 2)'; if (!ok) fails.push(2); forbDevS1 += a.forb; }
    if (label.startsWith('sales1-val')) { const ok = a.forb <= b.forb && dReq >= -3.0; v = ok ? 'HOLDS (line 3)' : 'FAILS (line 3)'; if (!ok) fails.push(3); }
    console.log(`${label.padEnd(28)} ${String(a.q).padStart(3)} questions, ${a.n} samples (base ${b.n}) | right ${pc(b.right, b.n)} % -> ${pc(a.right, a.n)} % (${dRight >= 0 ? '+' : ''}${dRight.toFixed(1)}) | forbidden-string samples ${b.forb} -> ${a.forb} | required strings ${b.reqF}/${b.reqT} -> ${a.reqF}/${a.reqT} (${dReq >= 0 ? '+' : ''}${dReq.toFixed(1)} points) ${v}`);
  }
  const b = stat(BASE), a = stat(A); const lenOk = a.words <= b.words * 1.15 && a.bad === 0 && a.n === b.n; if (!lenOk) fails.push(4);
  console.log(`all Sales samples: median length ${b.words} -> ${a.words} words; not answered ${a.bad} of ${a.n} (base ${b.bad} of ${b.n}) ${lenOk ? 'HOLDS (line 4)' : 'FAILS (line 4)'}`);
  for (const c of [...new Set(A.map((s) => s.condition))].sort()) { const names = GROUPS.slice(0, 3).flatMap((g) => g[1]); const bb = stat(BASE.filter((s) => s.condition === c && names.includes(s.run))), aa = stat(A.filter((s) => s.condition === c && names.includes(s.run))); if (aa.n) console.log(`   readable sets, ${c.padEnd(18)} ${aa.n} samples | right ${pc(bb.right, bb.n)} % -> ${pc(aa.right, aa.n)} % | forbidden ${bb.forb} -> ${aa.forb} | median ${bb.words} -> ${aa.words} words`); }
  verdicts[arm] = { fails, forbDevS1 }; console.log(`${arm}: ${fails.length ? `lines failing: ${fails.join(', ')}` : 'every judge-free line holds'}; forbidden-string samples on development + sales1: ${forbDevS1}`);
}
const ok = Object.entries(verdicts).filter(([, v]) => !v.fails.length).sort((x, y) => x[1].forbDevS1 - y[1].forbDevS1 || x[0].localeCompare(y[0]));
console.log(`\n${ok.length ? `goes on: ${ok[0][0]}${ok.length > 1 && ok[0][1].forbDevS1 === ok[1][1].forbDevS1 ? ' (tie: the smaller change)' : ''}` : 'no arm holds every line: E31 stops here'}`);
