// Issue #679 (2026-10-23): "Voice input is not transcribed". The reporter had
// Ambient AI Chat on (Settings › General: "Meetings start without capturing mic
// or system audio"), so main never started capture or STT for the meeting. The
// overlay did not know: the Answer button still opened a voice recording and
// drew "Listening..." for as long as the user spoke, and nothing could ever
// arrive in it. These checks hold the overlay to what main actually does:
//
//  - it reads the setting when it mounts and again when a meeting starts
//    (session-reset), because main decides capture at meeting start;
//  - with the setting on it says so in a banner, with the way out;
//  - with the setting on, Answer does not open a recording. It goes straight
//    to What to Answer, which is where a Stop with nothing heard already goes
//    (issue #540), so no "Listening..." is drawn for audio that is not captured.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.resolve(dirname, '../..');
const read = (rel) => fs.readFileSync(path.join(SRC, rel), 'utf8');
const exists = (rel) => fs.existsSync(path.join(SRC, rel));

const NOTICE = 'components/overlay/AmbientChatNotice.tsx';
const TABLE = 'i18n.ambientChat.ts';

test('the overlay has an Ambient AI Chat notice', () => {
  assert.ok(exists(NOTICE), `${NOTICE} is missing`);
});

test('the notice reads the setting on mount and again when a meeting starts', () => {
  const notice = read(NOTICE);
  assert.match(notice, /getAmbientChatEnabled\?\.\(\)/, 'the setting is never read');
  assert.match(notice, /onSessionReset\?\.\(/, 'a meeting start does not re-read the setting');
});

test('the overlay draws the notice in a fold, like the other meeting banners', () => {
  const ui = read('components/NativelyInterface.tsx');
  assert.match(ui, /useAmbientChatMeeting\(\)/, 'the overlay does not use the hook');
  assert.match(ui, /testId="fold-ambient-chat"/, 'no fold for the notice');
  assert.match(ui, /<AmbientChatNoticeBanner\b/, 'the banner is never drawn');
});

test('with Ambient AI Chat on, Answer goes to What to Answer instead of recording', () => {
  const ui = read('components/NativelyInterface.tsx');
  const start = ui.indexOf('const handleAnswerNow = async () => {');
  assert.ok(start > 0, 'handleAnswerNow not found');
  const body = ui.slice(start, ui.indexOf('const selectSkill', start));
  const recordStart = body.indexOf('// Start recording');
  assert.ok(recordStart > 0, 'the start-recording branch moved');
  const startBranch = body.slice(recordStart);
  const gate = startBranch.search(/ambientChat(?:Ref\.current|\.on)\b/);
  const opens = startBranch.indexOf('setIsManualRecording(true)');
  assert.ok(gate >= 0, 'the start branch never checks Ambient AI Chat');
  assert.ok(gate < opens, 'the Ambient AI Chat check comes after the recording opens');
  const gated = startBranch.slice(gate, opens);
  assert.match(gated, /handleWhatToSay\(\)/, 'with Ambient AI Chat on, Answer does not hand off to What to Answer');
  assert.match(gated, /return;/, 'with Ambient AI Chat on, the recording still opens');
});

test('every string in the notice has a row in every language, and no row is left over', async () => {
  const notice = read(NOTICE);
  const used = [...notice.matchAll(/\bt\(\s*(?:'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)")\s*\)/g)]
    .map((m) => (m[1] ?? m[2]).replace(/\\'/g, "'"));
  // The overlay's existing words, with rows of their own.
  const own = [...new Set(used)].filter((s) => s !== 'Dismiss' && s !== 'Open Settings');
  assert.ok(own.length >= 2, `found only ${own.length} strings: the scan is broken`);
  for (const prop of ['title', 'message', 'dismissLabel']) {
    assert.ok(!new RegExp(`${prop}="[A-Za-z]`).test(notice), `${prop} is a bare string`);
  }
  const mod = await import(path.join(SRC, TABLE));
  assert.deepEqual([...mod.AMBIENT_CHAT_EN].sort(), own.sort());
  for (const [lang, table] of Object.entries({ ru: mod.AMBIENT_CHAT_RU, zh: mod.AMBIENT_CHAT_ZH, ja: mod.AMBIENT_CHAT_JA, es: mod.AMBIENT_CHAT_ES })) {
    for (const en of own) {
      assert.ok(typeof table[en] === 'string' && table[en].trim(), `${lang} has no row for "${en}"`);
      assert.notEqual(table[en], en, `${lang} left "${en}" in English`);
      // The setting keeps its English name everywhere, as Settings shows it.
      if (en.includes('Ambient AI Chat')) assert.ok(table[en].includes('Ambient AI Chat'), `${lang} renamed the setting`);
    }
  }
  const i18n = read('i18n.tsx');
  for (const lang of ['RU', 'ZH', 'JA', 'ES']) {
    assert.ok(i18n.includes(`...AMBIENT_CHAT_${lang},`), `the ${lang} dictionary does not include the table`);
  }
});
