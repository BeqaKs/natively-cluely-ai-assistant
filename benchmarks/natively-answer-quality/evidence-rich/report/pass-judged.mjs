#!/usr/bin/env node
// The fix-up pass, judged: on the rows it edited, the draft (what the user would see with the pass off) against the
// shown answer (pass on), and what the mode's mean would be with the pass off (unedited rows keep their shown score).
// Exact gpt-6-astra judgments only; readable development runs. Drafts are graded as the judge tool grades them.
//   node evidence-rich/report/pass-judged.mjs er6-dev-main,er6-dev2-main [--modes a,b] [--rows]
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { loadRun, objective } from '../objective.mjs'; import { officialScore, mean, ci95 } from '../judge/score-er.mjs';
const ER = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2); const opt = (k, d = null) => { const i = args.indexOf(`--${k}`); return i >= 0 ? args[i + 1] : d; };
const MODES = String(opt('modes', 'technical-interview,looking-for-work,general')).split(','); const showRows = args.includes('--rows');
const J = (f) => new Map((fs.existsSync(f) ? fs.readFileSync(f, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)) : []).filter((j) => j.ok && j.judge_model === 'gpt-6-astra').map((j) => [j.benchmark_id, j]));
const R = [];
for (const name of args[0].split(',')) { if (/val|holdout/.test(name)) throw new Error('readable sets only');
  const run = loadRun(path.join(ER, 'results', name)); const js = J(path.join(ER, 'judge/out/base', `${name}.astra.jsonl`)); const jd = new Map([...J(path.join(ER, 'judge/out', `${name}.draft.astra.jsonl`)), ...J(path.join(ER, 'judge/out/base', `${name}.draft.astra.jsonl`))]);
  for (const row of run.rows) { const item = run.ds.byId[row.benchmark_id]; const s = js.get(row.benchmark_id); if (!item || !s || !MODES.includes(item.mode)) continue;
    const shown = officialScore(s.judgment, item.mode, objective(item, row)); const d = jd.get(row.benchmark_id);
    const draft = d ? officialScore(d.judgment, item.mode, objective(item, { ...row, rendered_answer: null })) : null;
    R.push({ id: row.benchmark_id, mode: item.mode, cond: item.condition, pi: item.pi ?? item.profile ?? null, shown, draft }); } }
const f2 = (x) => (Number.isFinite(x) ? x.toFixed(2) : '–'); const hard = (xs) => xs.filter((x) => x.hard_fail).length;
for (const m of [...MODES, 'all']) { const A = R.filter((r) => m === 'all' || r.mode === m); const E = A.filter((r) => r.draft); if (!A.length) continue;
  const d = E.map((r) => r.shown.overall - r.draft.overall); const off = A.map((r) => (r.draft ?? r.shown));
  console.log(`${m}: ${A.length} judged rows, ${E.length} with a judged draft | on those: draft ${f2(mean(E.map((r) => r.draft.overall)))} -> shown ${f2(mean(E.map((r) => r.shown.overall)))} (pass effect ${mean(d) >= 0 ? '+' : ''}${f2(mean(d))}, 95 % ±${f2(ci95(d))}); hard fails ${hard(E.map((r) => r.draft))} -> ${hard(E.map((r) => r.shown))}; pass raised ${d.filter((x) => x > 0.05).length}, lowered ${d.filter((x) => x < -0.05).length}, same ${d.filter((x) => Math.abs(x) <= 0.05).length}`);
  console.log(`   mode mean: pass on ${f2(mean(A.map((r) => r.shown.overall)))} (hard ${hard(A.map((r) => r.shown))}) | pass off ${f2(mean(off.map((r) => r.overall)))} (hard ${hard(off)})`);
  if (showRows) for (const r of E.filter((r) => Math.abs(r.shown.overall - r.draft.overall) > 0.05)) console.log(`     ${r.id} | ${r.cond} | draft ${r.draft.overall.toFixed(1)}${r.draft.hard_fail ? ' hard' : ''} [${r.draft.flags.join(',') || '-'}] -> shown ${r.shown.overall.toFixed(1)}${r.shown.hard_fail ? ' hard' : ''} [${r.shown.flags.join(',') || '-'}]`);
}
