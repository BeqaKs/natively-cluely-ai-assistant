#!/usr/bin/env node
// The fix-up pass in the two profile modes, judge-free (obj-3): over the named runs, the rows whose shown answer the
// pass replaced, graded as drafted and as shown, and how many shown answers defer ("I'll confirm … come back") where
// the draft did not. Counts only, so it is safe on the unread sets.
//   node evidence-rich/report/pass-in-profile-modes.mjs er11-dev-main,er13-dev-main,…
import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { loadRun, objective, answerOf } from '../objective.mjs';
const ER = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'); const PM = new Set(['looking-for-work', 'technical-interview']);
const DEFER = /\b(?:I(?:'ll| will) (?:confirm|check|get back|come back|follow up)|come back to you|get back to you|follow up with you)\b/i;
const grade = (item, row) => { const o = objective(item, row); const t = String(answerOf(row)).toLowerCase().replace(/[*`]/g, '');
  const forb = (item.oracle?.forbidden_claims ?? []).filter((f) => (f.answer_needles ?? []).length).some((f) => f.answer_needles.some((n) => t.includes(String(n).toLowerCase())));
  const req = o.required_strings.total > 0 ? o.required_strings.found === o.required_strings.total : null; return { right: req !== false && !forb, forb, needs: o.required_strings.total > 0 }; };
const T = {}; const add = (k, f) => { T[k] ??= { rows: 0, edited: 0, dRight: 0, sRight: 0, dForb: 0, sForb: 0, lost: 0, gained: 0, newDefer: 0, newDeferNeeds: 0 }; f(T[k]); };
for (const n of process.argv[2].split(',')) { const R = loadRun(path.join(ER, 'results', n));
  for (const row of R.rows) { const item = R.ds.byId[row.benchmark_id]; if (!item || !PM.has(item.mode)) continue; const missing = item.condition === 'missing_evidence';
    const resume = (row.v3_trace?.profileResumeSources ?? 0) > 0;   // what the app itself knows
    for (const k of ['all', item.mode, missing ? 'evidence missing' : 'evidence present', resume ? 'a résumé is loaded' : 'no résumé loaded']) add(k, (t) => { t.rows++;
      if (row.answer_differs_raw_vs_rendered !== true || !String(row.raw_answer ?? '').trim()) return; t.edited++;
      const d = grade(item, { ...row, rendered_answer: null }), s = grade(item, row); t.dRight += d.right; t.sRight += s.right; t.dForb += d.forb; t.sForb += s.forb; t.lost += d.right && !s.right; t.gained += !d.right && s.right;
      const nd = DEFER.test(String(answerOf(row))) && !DEFER.test(String(row.raw_answer)); t.newDefer += nd; t.newDeferNeeds += nd && s.needs; }); } }
for (const [k, t] of Object.entries(T)) console.log(`${k.padEnd(20)} rows ${String(t.rows).padStart(4)} | edited ${t.edited} (${(100 * t.edited / t.rows).toFixed(1)} %) | right as drafted ${t.dRight} -> as shown ${t.sRight} (lost ${t.lost}, gained ${t.gained}) | forbidden-string rows ${t.dForb} -> ${t.sForb} | shown defers where the draft did not ${t.newDefer} (${t.newDeferNeeds} on questions whose answer is in the documents)`);
