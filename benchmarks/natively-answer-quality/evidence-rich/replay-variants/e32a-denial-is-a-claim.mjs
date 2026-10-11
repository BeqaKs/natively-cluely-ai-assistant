// E32a: in the claim pass, saying that the product, the company or a plan does NOT have, offer, support or need
// something is a claim that needs a record, like saying that it does. Extends the [past] kind of LIST_THEN_REWRITE;
// everything else is the app's prompt, byte for byte.
export const OLD1 = `a number, a price, a policy, a procedure, a capability, a customer, a result;`;
export const NEW1 = `a number, a price, a policy, a procedure, a capability, a customer, a result, and equally that the product, the company or a plan does NOT have, offer, support, include or need something ("there's no offline mode", "we're not certified for that", "we don't integrate with it", "you won't need one");`;
export function systemPrompt(recorded) {
  if (!recorded.includes(OLD1)) throw new Error('e32a: the pass prompt no longer holds the [past] sentence this variant extends');
  return recorded.replace(OLD1, NEW1);
}
