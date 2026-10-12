#!/usr/bin/env node
// Where the judged points of a mode go: the mean as scored, the mean before the hard-fail caps, the rows capped, and
// the mean of each judged dimension (weight beside it). Readable development runs only; exact gpt-6-astra judgments.
//   node evidence-rich/report/where-points-go.mjs er6-dev-main,er6-dev2-main [--modes technical-interview,looking-for-work,general]
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { loadRun, objective } from '../objective.mjs'; import * as S from '../judge/score-er.mjs';
const ER = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2); const opt = (k, d = null) => { const i = args.indexOf(`--${k}`); return i >= 0 ? args[i + 1] : d; };
const MODES = String(opt('modes', 'technical-interview,looking-for-work,general')).split(',');
const rows = [];
for (const name of args[0].split(',')) { if (/val|holdout/.test(name)) throw new Error('readable sets only');
  const run = loadRun(path.join(ER, 'results', name)); const f = path.join(ER, 'judge/out/base', `${name}.astra.jsonl`); if (!fs.existsSync(f)) { console.log(`${name}: not judged`); continue; }
  const J = new Map(fs.readFileSync(f, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)).filter((j) => j.ok && j.judge_model === 'gpt-6-astra').map((j) => [j.benchmark_id, j]));
  for (const row of run.rows) { const item = run.ds.byId[row.benchmark_id]; const j = J.get(row.benchmark_id); if (!item || !j || !MODES.includes(item.mode)) continue;
    rows.push({ mode: item.mode, cond: item.condition, sc: j.judgment?.scores ?? {}, off: S.officialScore(j.judgment, item.mode, objective(item, row)) }); } }
const f2 = (x) => (Number.isFinite(x) ? x.toFixed(2) : '–'); const W = S.WEIGHTS ?? {};
for (const m of [...MODES, 'all three']) { const R = rows.filter((r) => m === 'all three' || r.mode === m); if (!R.length) continue;
  const capped = R.filter((r) => r.off.capped); const lost = S.mean(R.map((r) => r.off.raw - r.off.overall));
  console.log(`\n${m}: ${R.length} rows | scored ${f2(S.mean(R.map((r) => r.off.overall)))} | before caps ${f2(S.mean(R.map((r) => r.off.raw)))} | lost to caps ${f2(lost)} (${capped.length} rows capped, ${R.filter((r) => r.off.hard_fail).length} hard) | rows at 9.5 or more ${R.filter((r) => r.off.overall >= 9.5).length}, 9.0 to 9.5 ${R.filter((r) => r.off.overall >= 9 && r.off.overall < 9.5).length}, below 9 uncapped ${R.filter((r) => r.off.overall < 9 && !r.off.capped).length}`);
  console.log('  dimension (weight): mean | ' + Object.entries(W).map(([k, w]) => `${k} (${w}): ${f2(S.mean(R.map((r) => Number(r.sc[k] ?? NaN)).filter(Number.isFinite)))}`).join(' | '));
  const flags = {}; for (const r of R) for (const fl of r.off.flags) flags[fl] = (flags[fl] ?? 0) + 1; console.log('  flags: ' + (Object.entries(flags).sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} ${n}`).join(', ') || 'none'));
}
