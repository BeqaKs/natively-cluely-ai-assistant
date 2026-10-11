// E31a: Sales only. When the material does not cover what was asked, the seller neither confirms nor denies, does not
// presuppose the thing exists ("I'll check how the X integration works"), and adds no product detail around the
// deferral. Replaces one paragraph of the Sales mode block; everything else is the app's prompt, byte for byte.
// The example product is one that appears nowhere in the benchmark's documents.
export const OLD = `Capabilities, integrations, security, compliance, SLAs, support, timelines, prices, discounts, ROI and terms: only what the material states. Otherwise never guess or commit: offer to confirm and ask what they need it to do. WRONG: "Yes, we sync NetSuite custom fields." RIGHT: "I'll confirm how the sync handles custom fields. Which ones matter?"`;
export const NEW = `Capabilities, integrations, security, compliance, SLAs, support, timelines, prices, discounts, ROI and terms: only what the material states about that very thing. Otherwise never guess or commit in either direction: do not say it exists, does not exist, is not needed, or how it works. Give what the material does state about it, offer to confirm whether, and ask what they need it to do; add no other product detail, benefit or reassurance. WRONG: "Yes, we sync NetSuite custom fields." WRONG: "I'll check how the Zendesk connector works." (says there is one) RIGHT: "I'll confirm whether we connect to Zendesk. What would you want it to do?"`;
export function transform({ system, user, item }) {
  if (item.mode !== 'sales') return { system, user };
  if (!system.includes('<active_mode name="sales">')) return { system, user };   // a Sales turn on a route without the mode block
  if (!system.includes(OLD)) throw new Error('e31a: the Sales mode block no longer holds the paragraph this variant replaces');
  return { system: system.replace(OLD, NEW), user };
}
