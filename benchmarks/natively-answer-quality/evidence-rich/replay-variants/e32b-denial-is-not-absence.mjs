// E32b: E32a plus one clause on E19's exemption: "that isn't in what I have" speaks of what they have in front of
// them, never of what the product, the company or a person has, offers or needs.
import { OLD1, NEW1 } from './e32a-denial-is-a-claim.mjs';
export const OLD2 = `which is the honest answer when the asked thing is absent;`;
export const NEW2 = `which is the honest answer when the asked thing is absent (it speaks of what they have in front of them, never of what the product, the company or a person has, offers or needs);`;
export function systemPrompt(recorded) {
  if (!recorded.includes(OLD1) || !recorded.includes(OLD2)) throw new Error('e32b: the pass prompt no longer holds the sentences this variant changes');
  return recorded.replace(OLD1, NEW1).replace(OLD2, NEW2);
}
