// E34: answering without a fact only the user knows, the reply must not claim the user has NO such experience
// either ("I don't have a clean example", "I haven't built one myself"): that is a statement about them which
// nothing supports. One clause added to the composer rule that already says "Never say the information is missing";
// everything else is the app's prompt, byte for byte. All modes carry this rule.
export const OLD = `Never say the information is missing, never hand the question back`;
export const NEW = `Never say the information is missing, never say the user has no such experience, story, example or project either ("I don't have a clean example of that", "I haven't built one myself": that is a claim about them, and nothing above supports it), never hand the question back`;
export function transform({ system, user, item }) {
  if (!system.includes(OLD)) return { system, user, skipped: true };   // a route whose prompt does not carry the rule
  return { system: system.replace(OLD, NEW), user };
}
