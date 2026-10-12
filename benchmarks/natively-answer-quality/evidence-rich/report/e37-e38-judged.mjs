#!/usr/bin/env node
// The judged lines of E38 (touched rows, candidate against main) and of E37 (the drafts of the profile-mode rows the
// fix-up pass edited, against the shown answers of the same rows). Exact gpt-6-astra judgments only. Readable
// development sets; prints counts and means, and with --rows the per-row scores of these readable rows.
//   node evidence-rich/report/e37-e38-judged.mjs e38 [--rows]
//   node evidence-rich/report/e37-e38-judged.mjs e37 [--rows]
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { loadRun, objective } from '../objective.mjs'; import { officialScore, mean, ci95 } from '../judge/score-er.mjs';
const ER = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [which, ...rest] = process.argv.slice(2); const showRows = rest.includes('--rows');
const lines = (f) => (fs.existsSync(f) ? fs.readFileSync(f, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)) : []);
const J = (f) => new Map(lines(f).filter((j) => j.ok && j.judge_model === 'gpt-6-astra').map((j) => [j.benchmark_id, j]));
const shownJ = (run) => J(path.join(ER, 'judge/out/base', `${run}.astra.jsonl`)); const draftJ = (run) => new Map([...J(path.join(ER, 'judge/out', `${run}.draft.astra.jsonl`)), ...J(path.join(ER, 'judge/out/base', `${run}.draft.astra.jsonl`))]);
const runs = new Map(); const run = (n) => { if (!runs.has(n)) { if (/val|holdout/.test(n)) throw new Error('readable sets only'); runs.set(n, loadRun(path.join(ER, 'results', n))); } return runs.get(n); };
const plan = (f) => JSON.parse(fs.readFileSync(path.join(ER, 'results/replay', f), 'utf8')).need;
const f2 = (x) => (Number.isFinite(x) ? x.toFixed(2) : '–'); const hard = (xs) => xs.filter((x) => x.hard_fail).length;
// The score of a judged answer under the current fixed checks. A draft is graded as the judge tool grades it: the
// streamed text, with the shown text set aside.
const score = (runName, id, j, draft = false) => { const r = run(runName); const item = r.ds.byId[id]; const row = r.rows.find((x) => x.benchmark_id === id);
  const graded = draft ? { ...row, rendered_answer: null } : row; const o = objective(item, graded); return { item, row, o, off: officialScore(j.judgment, item.mode, o) }; };
const report = (label, P, a, b) => { if (!P.length) { console.log(`${label}: no pair judged on both sides`); return; }
  const d = P.map((p) => p[b].off.overall - p[a].off.overall);
  console.log(`${label}: ${P.length} pairs | ${a} ${f2(mean(P.map((p) => p[a].off.overall)))} -> ${b} ${f2(mean(P.map((p) => p[b].off.overall)))} | difference ${mean(d) >= 0 ? '+' : ''}${f2(mean(d))} (95 % ±${f2(ci95(d))}) | hard fails ${hard(P.map((p) => p[a].off))} -> ${hard(P.map((p) => p[b].off))} | higher ${d.filter((x) => x > 0.05).length}, lower ${d.filter((x) => x < -0.05).length}, same ${d.filter((x) => Math.abs(x) <= 0.05).length}`); };

if (which === 'e38') {
  const need = plan('astra-plan-e38.json'); const P = []; let wanted = 0;
  for (const [mainRun, ids] of Object.entries(need).filter(([k]) => k.endsWith('-main'))) { const candRun = mainRun.replace(/-main$/, '-e38'); const jm = shownJ(mainRun), jc = shownJ(candRun);
    for (const id of ids) { wanted++; const a = jm.get(id), b = jc.get(id); if (!a || !b) continue; P.push({ id, main: score(mainRun, id, a), cand: score(candRun, id, b) }); } }
  console.log(`E38, touched rows: ${wanted} planned, ${P.length} judged on both sides`);
  report('Q1. touched rows', P, 'main', 'cand');
  report('Q2. touched rows that need no document fact', P.filter((p) => p.main.o.required_strings.total === 0), 'main', 'cand');
  if (showRows) for (const p of P) console.log(`   ${p.id} | ${p.main.item.mode} | main ${p.main.off.overall.toFixed(1)}${p.main.off.hard_fail ? ' hard' : ''} [${(p.main.off.flags ?? []).join(',') || '-'}] -> candidate ${p.cand.off.overall.toFixed(1)}${p.cand.off.hard_fail ? ' hard' : ''} [${(p.cand.off.flags ?? []).join(',') || '-'}]`);
} else if (which === 'e37') {
  const need = plan('astra-plan-e37-drafts.json'); const P = []; let wanted = 0;
  for (const [k, ids] of Object.entries(need)) { const r = k.replace('::draft', ''); const js = shownJ(r), jd = draftJ(r);
    for (const id of ids) { wanted++; const s = js.get(id), d = jd.get(id); if (!s || !d) continue; P.push({ id, run: r, draft: score(r, id, d, true), shown: score(r, id, s) }); } }
  console.log(`E37, profile-mode rows the pass edited: ${wanted} planned, ${P.length} judged on both sides (draft and shown)`);
  report('all', P, 'draft', 'shown');
  for (const m of ['looking-for-work', 'technical-interview']) report(`  ${m}`, P.filter((p) => p.shown.item.mode === m), 'draft', 'shown');
  report('  evidence missing', P.filter((p) => p.shown.item.condition === 'missing_evidence'), 'draft', 'shown');
  report('  evidence present', P.filter((p) => p.shown.item.condition !== 'missing_evidence'), 'draft', 'shown');
  if (showRows) for (const p of P) console.log(`   ${p.id} | ${p.shown.item.mode} | ${p.shown.item.condition} | draft ${p.draft.off.overall.toFixed(1)}${p.draft.off.hard_fail ? ' hard' : ''} -> shown ${p.shown.off.overall.toFixed(1)}${p.shown.off.hard_fail ? ' hard' : ''}`);
} else { console.log('usage: e37-e38-judged.mjs e38|e37 [--rows]'); }
