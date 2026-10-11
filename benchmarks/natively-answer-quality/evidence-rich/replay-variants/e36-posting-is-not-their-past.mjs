// E36: in the fix-up pass, a first-person statement that the user built, ran, owned, led or did something which the
// material describes only as the other side's (a job posting's duties, the team or system of the company they are
// talking to, a requirement) is an unsupported [past] claim unless their own résumé or words state it. One clause on
// the [past] kind of LIST_THEN_REWRITE; everything else is the app's prompt, byte for byte.
export const OLD1 = `a number, a price, a policy, a procedure, a capability, a customer, a result;`;
export const NEW1 = `a number, a price, a policy, a procedure, a capability, a customer, a result; and a first-person statement that they built, ran, owned, led or did something which the material describes only as someone else's (the duties in a job posting, the team or system of the company they are talking to, a requirement) is of this kind unless their own résumé or their own words state it;`;
export function systemPrompt(recorded) {
  if (!recorded.includes(OLD1)) throw new Error('e36: the pass prompt no longer holds the [past] sentence this variant extends');
  return recorded.replace(OLD1, NEW1);
}
