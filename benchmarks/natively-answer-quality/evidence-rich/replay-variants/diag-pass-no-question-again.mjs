// Diagnostic (2026-10-12): the fix-up pass on a documents-first request, with the repeated question section removed
// from the material it reads. Nothing else changes. For finding why the pass removes supported sentences there.
const AGAIN = /\n# The question again \(answer this\)\n[^\n]*\n/;
export function message(request) {
  if (!AGAIN.test(request)) throw new Error('diag: the material holds no repeated question section');
  return request.replace(AGAIN, '\n');
}
