#!/usr/bin/env node
// E29: both repetitions together, one value per question (the mean of its repetitions), split by which pass edited.
// Also the same arm against itself across the two repetitions, as the size of replay-to-replay movement.
//   node evidence-rich/report/e29-pooled.mjs
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { loadRun, objective } from '../objective.mjs'; import { officialScore, mean } from '../judge/score-er.mjs';
const ER = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const lines = (f) => (fs.existsSync(f) ? fs.readFileSync(f, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)) : []);
const jc = new Map(); const judged = (n) => { if (!jc.has(n)) { const m = new Map(); for (const j of lines(path.join(ER, 'judge/out/base', `${n}.astra.jsonl`))) if (j.ok && j.judge_model === 'gpt-6-astra') m.set(j.benchmark_id, j); jc.set(n, m); } return jc.get(n); };
const rc = new Map(); const run = (n) => { if (!rc.has(n)) rc.set(n, loadRun(path.join(ER, 'results', n))); return rc.get(n); };
const INV = /^(unsupported_|fabricated_)/; const all = [];
for (const [K, file] of [[0, 'astra-plan-e29.json'], [1, 'astra-plan-e29-k1.json']]) {
  const plan = JSON.parse(fs.readFileSync(path.join(ER, 'results/replay', file), 'utf8')); const [A, B] = plan.arms.map((a) => a.replace(/@\d+$/, ''));
  const outcome = (arm) => new Map(lines(path.join(ER, 'results/replay', `${arm.replace(/-k\d+$/, '')}.jsonl`)).filter((r) => r.k === K).map((r) => [`${r.run}|${r.id}`, r.changed]));
  const oa = outcome(A), ob = outcome(B);
  for (const p of plan.pairs) { const item = run(p.run).ds.byId[p.id]; const base = run(p.run).rows.find((r) => r.benchmark_id === p.id);
    const one = (s, armIdx) => { const name = s === 'new' ? `rp-${plan.arms[armIdx]}--${p.run}` : s === 'draft' ? `${p.run}.draft` : p.run; const j = judged(name).get(p.id); if (!j) return null;
      const row = s === 'new' ? run(name).rows.find((r) => r.benchmark_id === p.id) : s === 'draft' ? { ...base, answer: base.draft_answer ?? base.draft ?? base.answer } : base;
      const off = officialScore(j.judgment, item.mode, objective(item, row)); return { overall: off.overall, hard: off.hard_fail ? 1 : 0, inv: (off.flags ?? []).some((f) => INV.test(f)) ? 1 : 0 }; };
    const a = one(p.sa, 0), b = one(p.sb, 1); if (!a || !b) continue; const key = `${p.run}|${p.id}`; const ea = !!oa.get(key), eb = !!ob.get(key);
    all.push({ key, K, a, b, cat: ea && eb ? 'both passes edited' : ea ? 'only the old pass edited' : eb ? 'only the E19 pass edited' : 'neither' }); } }
const ci = (xs) => { const m = mean(xs); const sd = Math.sqrt(xs.reduce((s, x) => s + (x - m) ** 2, 0) / Math.max(1, xs.length - 1)); return 1.96 * sd / Math.sqrt(xs.length); };
const show = (label, rs) => { if (!rs.length) return; const byQ = new Map(); for (const r of rs) { if (!byQ.has(r.key)) byQ.set(r.key, []); byQ.get(r.key).push(r.b.overall - r.a.overall); }
  const d = [...byQ.values()].map((v) => mean(v)); const m = mean(d), h = ci(d);
  console.log(`${label.padEnd(28)} ${String(rs.length).padStart(2)} row-repetitions on ${String(byQ.size).padStart(2)} questions | before E19 ${mean(rs.map((r) => r.a.overall)).toFixed(3)} -> E19 ${mean(rs.map((r) => r.b.overall)).toFixed(3)} | per question ${m >= 0 ? '+' : ''}${m.toFixed(3)} (95 % ${(m - h).toFixed(2)} to ${(m + h).toFixed(2)}) | hard ${rs.reduce((s, r) => s + r.a.hard, 0)} -> ${rs.reduce((s, r) => s + r.b.hard, 0)} | invention-flag ${rs.reduce((s, r) => s + r.a.inv, 0)} -> ${rs.reduce((s, r) => s + r.b.inv, 0)}`); };
show('ALL differing rows', all); for (const c of [...new Set(all.map((r) => r.cat))].sort()) show(c, all.filter((r) => r.cat === c));
// the same arm against itself: questions that differ in both repetitions
const by = new Map(); for (const r of all) { if (!by.has(r.key)) by.set(r.key, {}); by.get(r.key)[r.K] = r; }
const both = [...by.values()].filter((v) => v[0] && v[1]);
for (const [name, f] of [['pass before E19', (r) => r.a], ['pass with E19', (r) => r.b]]) { const d = both.map((v) => f(v[1]).overall - f(v[0]).overall);
  console.log(`repetition 0 -> 1, ${name}, ${both.length} questions in both: mean ${mean(both.map((v) => f(v[0]).overall)).toFixed(3)} -> ${mean(both.map((v) => f(v[1]).overall)).toFixed(3)}, mean absolute move ${mean(d.map(Math.abs)).toFixed(2)}, hard ${both.reduce((s, v) => s + f(v[0]).hard, 0)} -> ${both.reduce((s, v) => s + f(v[1]).hard, 0)}, questions whose hard-fail state changed ${both.filter((v) => f(v[0]).hard !== f(v[1]).hard).length}`); }
