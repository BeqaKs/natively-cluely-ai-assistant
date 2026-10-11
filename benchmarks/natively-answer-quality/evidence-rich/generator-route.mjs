// Which route the replay tools use for the generator model (2026-10-12, Evin: "use agentrouter for deepseek model
// also instead of current direct deepseek api key").
//   ER_GENERATOR=agentrouter (default from 2026-10-12)  https://agentrouter.org/v1/messages, model deepseek-v4-flash,
//                                                        the app's own route for an AgentRouter key (Anthropic format,
//                                                        thinking disabled: on the OpenAI route the gateway ignores it)
//   ER_GENERATOR=direct                                  https://api.deepseek.com/chat/completions, model deepseek-flash
// genFetch() takes the OpenAI-format request the tools already build and returns a response whose body yields
// OpenAI-format SSE lines, so the callers' parsing is unchanged. The key is never printed.
// Stop rules: 402 or the gateway's quota 403 ("insufficient_user_quota") moves to the next key; any other 403 is an
// access block: every further call of this process fails at once and nothing is retried.
import fs from 'node:fs';
export const ROUTE = (process.env.ER_GENERATOR || 'agentrouter').toLowerCase() === 'direct' ? 'direct' : 'agentrouter';
export const ROUTE_MODEL = ROUTE === 'direct' ? 'deepseek-flash' : 'deepseek-v4-flash';
const ENV = fs.readFileSync(process.env.NATIVELY_ENV_FILE || '/Users/evin/natively-cluely-ai-assistant/.env', 'utf8');
const envKey = (n) => (ENV.match(new RegExp(`^${n}=(.*)$`, 'm'))?.[1] ?? '').trim().replace(/^["']|["']$/g, '');
const KEYS = ['AGENTROUTER_API_KEY', 'AGENTROUTER_API_KEY_1'].map(envKey).filter(Boolean);
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
  if (ROUTE === 'direct') return fetch(url, init);
  if (blocked) throw new Error('agentrouter access block: no further calls in this process');
  if (!KEYS.length) throw new Error('no AgentRouter key in the env file');
  const body = JSON.parse(init.body); const system = body.messages.filter((m) => m.role === 'system').map((m) => m.content).join('\n\n');
  const payload = { model: ROUTE_MODEL, max_tokens: body.max_tokens ?? 8192, temperature: body.temperature ?? 0.2, stream: true, thinking: { type: 'disabled' }, ...(system ? { system } : {}), messages: body.messages.filter((m) => m.role !== 'system') };
  for (;;) {
    const k = KEYS[keyIndex];
    const res = await fetch('https://agentrouter.org/v1/messages', { method: 'POST', signal: init.signal, headers: { Authorization: `Bearer ${k}`, 'x-api-key': k, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json', originator: 'codex_cli_rs' }, body: JSON.stringify(payload) });
    if (res.ok) return { ok: true, status: res.status, body: asOpenAiSse(res) };
    let text = ''; try { text = await res.text(); } catch { /* */ }
    const quota = res.status === 402 || (res.status === 403 && QUOTA.test(text));
    if (quota && keyIndex < KEYS.length - 1) { keyIndex++; continue; }
    if (res.status === 403 && !quota) blocked = true;
    return { ok: false, status: res.status, body: (async function* () {})() };
  }
}
