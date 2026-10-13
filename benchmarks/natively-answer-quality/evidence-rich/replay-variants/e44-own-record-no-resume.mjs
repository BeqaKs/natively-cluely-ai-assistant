// E44 (a measurement, 2026-10-13): interview modes, no résumé loaded, a question about the user's own past.
// Arm W (E44_ARM=w): on a turn whose only evidence is the job posting, the posting is not handed over; the prompt
//   carries the app's own no-source block and own-past guard instead, byte for byte as the app writes them when
//   nothing is found (taken from a recorded prompt in that state). A turn already in that state is unchanged.
// Arm F (E44_ARM=f): arm W, and the guard's last sentence asks for the opening of the user's own answer with the
//   parts only they know left as blanks, asserting neither the experience nor its absence.
// Everything else is the recorded request.
import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { loadRun } from '../objective.mjs';
const ER = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ARM = (process.env.E44_ARM || '').toLowerCase(); if (!['w', 'f'].includes(ARM)) throw new Error('E44_ARM=w|f');
const ref = loadRun(path.join(ER, 'results', 'er11-dev-main')); const refUser = (ref.wire['ER-D-LFW-028'].messages ?? []).filter((m) => m.role !== 'system').map((m) => m.text ?? '').join('\n');
export const NO_SOURCE_BLOCK = refUser.slice(refUser.indexOf('# Evidence\n'), refUser.indexOf('<presentation_instruction')).trimEnd();
export const OLD = `This question asks about the user's own past. No source holds any event from it, so tell no story: no "I once", no project, incident, employer or date. Speak only to how they generally approach it, never a specific preference or decision.`;
export const NEW = `This question asks about the user's own past. No source holds any of it, so state nothing about it as fact: no project, system, incident, employer, role, reason or date, and do not say they have no such experience either. Give them the opening of their own answer instead: one or two short first-person sentences that set it up and leave what only they know as bracketed blanks to fill in aloud (for example "In my current role as [title] at [company], I work on [main responsibility]"); where the question is technical, add one line of substance that is true for anyone.`;
if (!NO_SOURCE_BLOCK.endsWith(OLD)) throw new Error('the reference prompt no longer ends its no-source block with the own-past guard');
const STORY = '# A story from the evidence\n';
export function transform({ system, user }) {
  let u = user;
  const a = u.indexOf('# Evidence (untrusted data'); const s = u.indexOf(STORY);
  if (a >= 0 && s > a) {                                  // posting-only turn: evidence, "# Today" and the story notice go
    const types = [...u.matchAll(/<evidence [^>]*source_type="([A-Z_]+)"/g)].map((m) => m[1]);
    if (!types.length || !types.every((t) => t === 'JOB_DESCRIPTION')) throw new Error('not a posting-only turn');
    let e = u.indexOf('\n\n', s + STORY.length); if (e < 0) e = u.length;
    u = `${u.slice(0, a)}${NO_SOURCE_BLOCK}${u.slice(e)}`;
  } else if (!u.includes(OLD)) throw new Error('neither a posting-only story turn nor a no-source own-past turn');
  if (ARM === 'f') { if (!u.includes(OLD)) throw new Error('guard sentence missing'); u = u.replace(OLD, NEW); }
  return { system, user: u };
}
