#!/usr/bin/env node
// Judge-free reading of replay arms against a base arm (E32, E34): answers graded again with the fixed checks,
// samples pooled over k. Counts and medians only: no ids, questions or answers, so it is safe on the unread sets.
//   node evidence-rich/report/arm-read.mjs --kind gen  --base e34-base --arms e34-a --modes technical-interview,looking-for-work,general
//   node evidence-rich/report/arm-read.mjs --kind pass --base e32-base --arms e32-a,e32-b,e32-c [--modes …]
// --kind gen reads results/replay/gen-<arm>.jsonl (replay-generator.mjs), --kind pass results/replay/<arm>.jsonl
// (replay-claim-pass.mjs). A run whose name contains "val" or "holdout" is an unread set.
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { loadRun, objective, OBJECTIVE_VERSION } from '../objective.mjs';
const ER = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2); const opt = (k, d = null) => { const i = args.indexOf(`--${k}`); return i >= 0 ? args[i + 1] : d; };
const kind = opt('kind', 'gen'); const modes = opt('modes') ? new Set(opt('modes').split(',')) : null;
// A negative self-claim: the speaker says they have no such experience, story, example or project. Written on
// 2026-10-11 before any E34 or E32 replay was read; it is line 3 of E34's rule.
export const NEG = /\b(?:I|we)\s+(?:don['’]t|do not|haven['’]t|have not|never|can['’]t|cannot)\s+(?:really\s+|actually\s+|personally\s+)?(?:have|had|got|built|run|led|worked|done|point to|claim)\b[^.?!]{0,80}\b(?:example|story|stories|experience|pipeline|project|system|one|case|instance|situation|history)\b/i;
const runs = new Map(); const run = (n) => { if (!runs.has(n)) runs.set(n, loadRun(path.join(ER, 'results', n))); return runs.get(n); };
const lines = (f) => (fs.existsSync(f) ? fs.readFileSync(f, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)) : []);
const words = (t) => String(t ?? '').replace(/\[\[GIST\]\][\s\S]*$/, '').trim().split(/\s+/).filter(Boolean).length;
const med = (xs) => { const v = xs.filter((x) => Number.isFinite(x)).sort((a, b) => a - b); return v.length ? v[Math.floor(v.length / 2)] : null; };
const unread = (n) => /val|holdout/.test(n);
function load(arm) {
  const out = [];
  for (const s of lines(path.join(ER, 'results/replay', `${kind === 'gen' ? 'gen-' : ''}${arm}.jsonl`))) {
    const r = run(s.run); const item = r.ds.byId[s.id]; const base = r.rows.find((x) => x.benchmark_id === s.id); if (!item || !base) continue; if (modes && !modes.has(item.mode)) continue;
    const row = { ...base, raw_answer: s.text, rendered_answer: s.text, answer_differs_raw_vs_rendered: false };
    const o = objective(item, row); const t = String(s.text ?? '').toLowerCase().replace(/[*`]/g, '');
    const forb = (item.oracle?.forbidden_claims ?? []).filter((f) => (f.answer_needles ?? []).length);
    const forbHit = forb.some((f) => f.answer_needles.some((n) => t.includes(String(n).toLowerCase())));
    const calc = !!(item.oracle?.requires_calculation && item.oracle?.calculation_oracle); const calcOk = calc ? o.checks.some((x) => x.label === 'calculation result stated' && x.ok) : null;
    const reqOk = o.required_strings.total > 0 ? o.required_strings.found === o.required_strings.total : null;
    out.push({ key: `${s.run}|${s.id}`, run: s.run, mode: item.mode, missing: item.condition === 'missing_evidence', unread: unread(s.run), err: s.err ?? null, empty: !String(s.text ?? '').trim(), forbHit, reqF: o.required_strings.found, reqT: o.required_strings.total,
      right: reqOk !== false && !forbHit && calcOk !== false, words: words(s.text), neg: NEG.test(String(s.text ?? '')), changed: s.changed === true, ms: s.ms ?? s.ms_total ?? null });
  }
  return out;
}
const pc = (a, b) => (b ? 100 * a / b : 0); const f1 = (x) => x.toFixed(1);
const stat = (S) => ({ n: S.length, q: new Set(S.map((s) => s.key)).size, right: S.filter((s) => s.right).length, forb: S.filter((s) => s.forbHit).length, reqF: S.reduce((a, s) => a + s.reqF, 0), reqT: S.reduce((a, s) => a + s.reqT, 0), bad: S.filter((s) => s.err || s.empty).length, words: med(S.map((s) => s.words)), neg: S.filter((s) => s.neg).length, changed: S.filter((s) => s.changed).length, ms: med(S.map((s) => s.ms)) });
const BASE = load(opt('base')); console.log(`checks ${OBJECTIVE_VERSION}; kind ${kind}; base ${opt('base')}: ${BASE.length} samples${modes ? `; modes ${[...modes].join(', ')}` : ''}`);
const row = (label, b, a) => console.log(`${label.padEnd(34)} ${String(a.q).padStart(3)} questions, ${String(a.n).padStart(4)} samples (base ${b.n}) | right ${f1(pc(b.right, b.n))} % -> ${f1(pc(a.right, a.n))} % (${pc(a.right, a.n) - pc(b.right, b.n) >= 0 ? '+' : ''}${f1(pc(a.right, a.n) - pc(b.right, b.n))}) | forbidden-string samples ${b.forb} -> ${a.forb} | required strings ${b.reqF}/${b.reqT} -> ${a.reqF}/${a.reqT} | negative self-claim samples ${b.neg} -> ${a.neg}${kind === 'pass' ? ` | edited ${f1(pc(b.changed, b.n))} % -> ${f1(pc(a.changed, a.n))} % | pass median ${b.ms} -> ${a.ms} ms` : ` | median ${b.words} -> ${a.words} words`} | not answered ${a.bad}`);
for (const arm of String(opt('arms')).split(',')) {
  const A = load(arm); console.log(`\n=== ${arm}: ${A.length} samples`);
  const cut = (S, f) => stat(S.filter(f));
  row('readable sets', cut(BASE, (s) => !s.unread), cut(A, (s) => !s.unread));
  row('unread sets (counts only)', cut(BASE, (s) => s.unread), cut(A, (s) => s.unread));
  row('evidence missing, readable', cut(BASE, (s) => s.missing && !s.unread), cut(A, (s) => s.missing && !s.unread));
  row('evidence missing, unread', cut(BASE, (s) => s.missing && s.unread), cut(A, (s) => s.missing && s.unread));
  row('evidence present, readable', cut(BASE, (s) => !s.missing && !s.unread), cut(A, (s) => !s.missing && !s.unread));
  for (const m of [...new Set(A.map((s) => s.mode))].sort()) row(`  ${m}, readable`, cut(BASE, (s) => s.mode === m && !s.unread), cut(A, (s) => s.mode === m && !s.unread));
  row('everything', stat(BASE), stat(A));
}
