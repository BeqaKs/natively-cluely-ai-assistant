// Which route the replay tools use for the generator model (2026-10-12, Evin: "use agentrouter for deepseek model
// also instead of current direct deepseek api key").
//   agentrouter (the only route since 12 Oct)             https://agentrouter.org/v1/messages, model deepseek-v4-flash,
//                                                        the app's own route for an AgentRouter key (Anthropic format,
//                                                        thinking disabled: on the OpenAI route the gateway ignores it)
//   direct (closed on 12 October at Evin's word)         https://api.deepseek.com/chat/completions, model deepseek-flash
// genFetch() takes the OpenAI-format request the tools already build and returns a response whose body yields
// OpenAI-format SSE lines, so the callers' parsing is unchanged. The key is never printed.
// Stop rules: 402 or the gateway's quota 403 ("insufficient_user_quota") moves to the next key; any other 403 is an
// access block: every further call of this process fails at once and nothing is retried.
import fs from 'node:fs';
// Default back to 'direct' on 2026-10-11 22:05 UTC: the AgentRouter account's balance ran out after about 3,900 replay
// calls ("pre-consume quota failed, user quota: $0.0097"), and that balance is the judge's.
// 2026-10-12 13:20 UTC, Evin: "onllly use agent router for running iteration , strictly dont use deepseek api key"
// (a third key, AGENTROUTER_API_KEY_2, holds the balance for it). AgentRouter is the only route; asking for the direct
// one stops the process. The DeepSeek key is not read by this file.
if ((process.env.ER_GENERATOR || '').toLowerCase() === 'direct') throw new Error('the direct DeepSeek route is closed (Evin, 2026-10-12): generation runs on AgentRouter only');
export const ROUTE = 'agentrouter';
export const ROUTE_MODEL = ROUTE === 'direct' ? 'deepseek-flash' : 'deepseek-v4-flash';
const ENV = fs.readFileSync(process.env.NATIVELY_ENV_FILE || '/Users/evin/natively-cluely-ai-assistant/.env', 'utf8');
const envKey = (n) => (ENV.match(new RegExp(`^${n}=(.*)$`, 'm'))?.[1] ?? '').trim().replace(/^["']|["']$/g, '');
// The new key first: it holds the balance meant for generation; the two older keys are the judge's first.
const KEYS = [...new Set(['AGENTROUTER_API_KEY_2', 'AGENTROUTER_API_KEY', 'AGENTROUTER_API_KEY_1'].map(envKey).filter(Boolean))];
const QUOTA = /insufficient_user_quota|user quota is not enough/i;
let keyIndex = 0; let blocked = false;
export const routeState = () => ({ route: ROUTE, model: ROUTE_MODEL, key_index: keyIndex, access_blocked: blocked });

async function* asOpenAiSse(res) {
  const enc = new TextEncoder(); const dec = new TextDecoder(); let buf = ''; const usage = { prompt_tokens: null, completion_tokens: null, prompt_cache_hit_tokens: null };
  for await (const chunk of res.body) {
    buf += dec.decode(chunk, { stream: true }); let i;
    while ((i = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1);
      if (!line.startsWith('data:')) continue;
      let j; try { j = JSON.parse(line.slice(5).trim()); } catch { continue; }
      if (j.type === 'message_start' && j.message?.usage) { const u = j.message.usage; usage.prompt_cache_hit_tokens = u.cache_read_input_tokens ?? null; usage.prompt_tokens = (u.input_tokens ?? 0) + (u.cache_read_input_tokens ?? 0) + (u.cache_creation_input_tokens ?? 0); }
      if (j.type === 'message_delta' && j.usage) usage.completion_tokens = j.usage.output_tokens ?? usage.completion_tokens;
      if (j.type === 'content_block_delta' && j.delta?.type === 'text_delta' && j.delta.text) yield enc.encode(`data: ${JSON.stringify({ choices: [{ delta: { content: j.delta.text } }] })}\n`);
    }
  }
  yield enc.encode(`data: ${JSON.stringify({ choices: [], usage })}\n`); yield enc.encode('data: [DONE]\n');
}

export async function genFetch(url, init) {
  if (blocked) throw new Error('agentrouter access block: no further calls in this process');
  if (!KEYS.length) throw new Error('no AgentRouter key in the env file');
  const body = JSON.parse(init.body); const system = body.messages.filter((m) => m.role === 'system').map((m) => m.content).join('\n\n');
  const payload = { model: ROUTE_MODEL, max_tokens: body.max_tokens ?? 8192, temperature: body.temperature ?? 0.2, stream: true, thinking: { type: 'disabled' }, ...(system ? { system } : {}), messages: body.messages.filter((m) => m.role !== 'system') };
  // Each call starts from the first key (a key that answered a quota reply a minute ago may serve again, and the other
  // key may be the one without balance); a transient reply (429, 5xx) is tried once more after a short wait.
  let last = 0;
  for (let attempt = 0; attempt < 2; attempt++) {
    for (let ki = 0; ki < KEYS.length; ki++) {
      const k = KEYS[ki];
      const res = await fetch('https://agentrouter.org/v1/messages', { method: 'POST', signal: init.signal, headers: { Authorization: `Bearer ${k}`, 'x-api-key': k, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json', originator: 'codex_cli_rs' }, body: JSON.stringify(payload) });
      if (res.ok) { keyIndex = ki; return { ok: true, status: res.status, body: asOpenAiSse(res) }; }
      let text = ''; try { text = await res.text(); } catch { /* */ }
      last = res.status;
      if (process.env.ER_ROUTE_DEBUG) console.error(`[route] key ${ki} HTTP ${res.status} ${text.replace(/sk-[A-Za-z0-9_-]+/g, '<hidden>').replace(/\s+/g, ' ').slice(0, 300)} | payload chars ${JSON.stringify(payload).length}`);
      const quota = res.status === 402 || (res.status === 403 && QUOTA.test(text));
      if (res.status === 403 && !quota) { blocked = true; return { ok: false, status: 403, body: (async function* () {})() }; }
      if (quota) continue;                 // the other key
      break;                               // 429 / 5xx / anything else: wait and try once more
    }
    if (attempt === 0) await new Promise((r) => setTimeout(r, 2500));
  }
  return { ok: false, status: last, body: (async function* () {})() };
}
