#!/usr/bin/env node
// E38: the profile-read build against main's runs of the same hour, the two profile modes (judge-free, obj-3).
// "Touched" = a row main answered on the no-retrieval path with a profile loaded and no evidence in the prompt, and
// the candidate answered with evidence in the prompt. Counts and medians only (safe on the unread sets); with
// --ids it also prints the ids of the touched rows of the READABLE sets, for the judging plan.
//   node evidence-rich/report/e38-read.mjs [--plan evidence-rich/results/replay/astra-plan-e38.json]
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { loadRun, objective, answerOf, OBJECTIVE_VERSION } from '../objective.mjs';
const ER = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2); const opt = (k, d = null) => { const i = args.indexOf(`--${k}`); return i >= 0 ? args[i + 1] : d; };
const SETS = [['dev', false], ['dev2', false], ['chal', false], ['prov1', false], ['chalval', true], ['prov1val', true]];
const grade = (item, row) => { const o = objective(item, row); const t = String(answerOf(row)).toLowerCase().replace(/[*`]/g, '');
  const forb = (item.oracle?.forbidden_claims ?? []).filter((f) => (f.answer_needles ?? []).length).some((f) => f.answer_needles.some((n) => t.includes(String(n).toLowerCase())));
  const req = o.required_strings.total > 0 ? o.required_strings.found === o.required_strings.total : null; return { right: req !== false && !forb, forb, needs: o.required_strings.total > 0 }; };
const hasEvidence = (run, id) => /<evidence\b/.test((run.wire[id]?.messages ?? []).filter((m) => m.role !== 'system').map((m) => m.text ?? '').join('\n'));
const med = (xs) => { const v = xs.filter((x) => Number.isFinite(x)).sort((a, b) => a - b); return v.length ? Math.round(v[Math.floor(v.length / 2)]) : null; };
const P = []; const need = {};
for (const [s, unread] of SETS) {
  const mn = `er13-${s}-main`, cn = String(opt('cand', 'er13-{s}-e38')).replace('{s}', s);   // --cand er16-{s}-e41: another build against the same main runs (E41) if (!fs.existsSync(path.join(ER, 'results', mn, 'rows.jsonl')) || !fs.existsSync(path.join(ER, 'results', cn, 'rows.jsonl'))) { console.log(`${s}: runs missing`); continue; }
  const M = loadRun(path.join(ER, 'results', mn)), C = loadRun(path.join(ER, 'results', cn)); const mById = new Map(M.rows.map((r) => [r.benchmark_id, r]));
  for (const c of C.rows) { const m = mById.get(c.benchmark_id); const item = C.ds.byId[c.benchmark_id]; if (!m || !item) continue;
    const mt = m.v3_trace ?? {}; const touched = mt.path === 'FAST' && (mt.profileSources ?? 0) > 0 && !hasEvidence(M, m.benchmark_id) && hasEvidence(C, c.benchmark_id);
    const bad = !c.success || !!c.error_type || !!c.timeout || !String(answerOf(c)).trim();
    P.push({ unread, touched, bad, mode: item.mode, m: grade(item, m), c: grade(item, c), mt: m.ttft_ms, ct: c.ttft_ms, cFast: (c.v3_trace ?? {}).path === 'FAST', cEv: hasEvidence(C, c.benchmark_id) });
    if (touched) { (need[mn] ??= []).push(c.benchmark_id); (need[cn] ??= []).push(c.benchmark_id); } }
}
const n = (xs, f) => xs.filter(f).length; const pc = (a, b) => (b ? (100 * a / b).toFixed(1) : '–');
console.log(`checks ${OBJECTIVE_VERSION}; ${P.length} questions in both arms (${n(P, (p) => !p.unread)} readable, ${n(P, (p) => p.unread)} unread)`);
const bad = n(P, (p) => p.bad); console.log(`P1. candidate rows not answered: ${bad} of ${P.length} ${bad === 0 ? 'HOLDS' : 'FAILS'}`);
const T = P.filter((p) => p.touched); const tm = n(T, (p) => p.m.right), tc = n(T, (p) => p.c.right), fm = n(T, (p) => p.m.forb), fc = n(T, (p) => p.c.forb);
console.log(`P2. touched rows: ${T.length} (${n(T, (p) => !p.unread)} readable, ${n(T, (p) => p.unread)} unread; Looking for work ${n(T, (p) => p.mode === 'looking-for-work')}, Technical Interview ${n(T, (p) => p.mode === 'technical-interview')}); right ${tm} -> ${tc}; forbidden-string rows ${fm} -> ${fc} ${tc > tm && fc <= fm ? 'HOLDS' : 'FAILS'} (more right than main; forbidden at most main)`);
const U = P.filter((p) => !p.touched); const ur = U.filter((p) => !p.unread), uu = U.filter((p) => p.unread);
const d = Number(pc(n(ur, (p) => p.c.right), ur.length)) - Number(pc(n(ur, (p) => p.m.right), ur.length)); const du = n(uu, (p) => p.c.right) - n(uu, (p) => p.m.right);
console.log(`P3. untouched rows: readable ${ur.length}, right ${pc(n(ur, (p) => p.m.right), ur.length)} % -> ${pc(n(ur, (p) => p.c.right), ur.length)} % (${d >= 0 ? '+' : ''}${d.toFixed(1)}); unread ${uu.length}, right ${n(uu, (p) => p.m.right)} -> ${n(uu, (p) => p.c.right)} ${d >= -2.0 && du >= -2 ? 'HOLDS' : 'FAILS'} (readable not more than 2.0 points below; unread at most 2 rows fewer)`);
const tmed = [med(T.map((p) => p.mt)), med(T.map((p) => p.ct))], amed = [med(P.map((p) => p.mt)), med(P.map((p) => p.ct))];
console.log(`P4. first word median: touched rows ${tmed[0]} -> ${tmed[1]} ms (${tmed[1] - tmed[0] >= 0 ? '+' : ''}${tmed[1] - tmed[0]}); all rows ${amed[0]} -> ${amed[1]} ms (${amed[1] - amed[0] >= 0 ? '+' : ''}${amed[1] - amed[0]}) ${(!T.length || tmed[1] - tmed[0] <= 400) && amed[1] - amed[0] <= 100 ? 'HOLDS' : 'FAILS'} (touched not more than 400 ms later; all not more than 100 ms later)`);
const G = T.filter((p) => !p.m.needs); const gm = n(G, (p) => p.m.right), gc = n(G, (p) => p.c.right);
console.log(`P5. touched rows that need no document fact: ${G.length}; right ${gm} -> ${gc}; forbidden-string rows ${n(G, (p) => p.m.forb)} -> ${n(G, (p) => p.c.forb)} ${gc >= gm && n(G, (p) => p.c.forb) <= n(G, (p) => p.m.forb) ? 'HOLDS' : 'FAILS'}`);
console.log(`   context: candidate rows still on the no-retrieval path with no evidence in the prompt: ${n(P, (p) => p.cFast && !p.cEv)}; rows right overall ${n(P, (p) => p.m.right)} -> ${n(P, (p) => p.c.right)} of ${P.length}`);
if (opt('plan')) { fs.writeFileSync(path.resolve(opt('plan')), JSON.stringify({ made: new Date().toISOString(), what: 'E38: the touched rows, both arms', need }, null, 1)); console.log(`plan written: ${Object.values(need).reduce((a, x) => a + x.length, 0)} judgments in ${Object.keys(need).length} runs`); }
