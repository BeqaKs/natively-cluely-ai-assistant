// Diagnostic (2026-10-12): the fix-up pass on a documents-first request, with its material put back in the old order
// (the question section first, no repeated question). The draft is the documents-first build's own.
const AGAIN = /\n# The question again \(answer this\)\n[^\n]*\n/;
const Q = /\n# Question\n[\s\S]*?\n(?=\n# |\n<presentation_instruction)/;
export function message(request) {
  if (!AGAIN.test(request) || !request.startsWith('MATERIAL:\n# Evidence')) throw new Error('diag: not a documents-first material');
  let r = request.replace(AGAIN, '\n'); const q = r.match(Q); if (!q) throw new Error('diag: no question section');
  r = r.replace(Q, '\n'); return r.replace('MATERIAL:\n', `MATERIAL:\n${q[0].trim()}\n\n`);
}
