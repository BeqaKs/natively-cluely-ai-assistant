// E31b: E31a plus one paragraph: what the seller adds after the answer (the prospect's own plan or fleet, a benefit,
// an offer to change a term or match what they ask for) meets the same bar as the answer.
import { OLD, NEW as NEW_A } from './e31a-sales-confirm-whether.mjs';
export const ADDED = `What you add after the answer meets the same bar. The prospect's own plan, fleet size or setup, a benefit, or an offer to change a term, add something or match what they ask for is said only when the material or the prospect said it; an offer to change a term is a commitment.`;
export const NEW = `${NEW_A}\n\n${ADDED}`;
export function transform({ system, user, item }) {
  if (item.mode !== 'sales') return { system, user };
  if (!system.includes('<active_mode name="sales">')) return { system, user };
  if (!system.includes(OLD)) throw new Error('e31b: the Sales mode block no longer holds the paragraph this variant replaces');
  return { system: system.replace(OLD, NEW), user };
}
