// E32c: E32b widened from the product to anything: saying that something does NOT exist, was never done, is not
// offered, supported, needed or owed is a claim that needs a record, whether it is about the product, the company,
// a document's terms or the person ("I haven't built one myself", "there's nothing to claim").
import { OLD1 } from './e32a-denial-is-a-claim.mjs'; import { OLD2, NEW2 } from './e32b-denial-is-not-absence.mjs';
export const NEW1 = `a number, a price, a policy, a procedure, a capability, a customer, a result, and equally that something does NOT exist, was never done, is not offered, supported, needed or owed ("there's no offline mode", "we're not certified for that", "I haven't built one myself", "there's nothing to claim");`;
export function systemPrompt(recorded) {
  if (!recorded.includes(OLD1) || !recorded.includes(OLD2)) throw new Error('e32c: the pass prompt no longer holds the sentences this variant changes');
  return recorded.replace(OLD1, NEW1).replace(OLD2, NEW2);
}
