// A turn that carries document evidence gets the hidden working step even when the question's wording is not on the
// quantity word list (2026-10-09). On the evidence-rich benchmark 59 of the 131 questions whose answer needs a
// calculation carried no calculation notice: a deadline counted in business days, a weighted score, the 45th day
// after a month end, a length of service. Replayed four times each, graded by the deterministic calculation check:
// 72.0 % right as prompted, 83.1 % with the lighter notice. The word-list notice itself is NOT widened: on document
// turns that need no calculation its text cost completeness (95.2 % -> 91.5 %), the lighter text did not (94.2 %).
// See calculationNoticeForTurn in electron/context-intelligence/generation/prompt-composer.ts.

import assert from 'node:assert/strict';
import { test, describe } from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  calculationNotice, calculationNoticeForTurn, CALCULATION_NOTICE, CALCULATION_NOTICE_EVIDENCE,
} from '../../../dist-electron/electron/context-intelligence/generation/prompt-composer.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const COMPOSER = fs.readFileSync(path.join(HERE, '..', 'generation', 'prompt-composer.ts'), 'utf8');

const EVIDENCE = '<evidence source_type="REFERENCE_FILE">Panel debrief within 2 business days of the loop. The candidate is told the outcome within 3 business days after the debrief.</evidence>';

describe('a turn the word list does not reach, with evidence in the prompt', () => {
  test('a date counted from another date gets the lighter notice', () => {
    assert.equal(
      calculationNoticeForTurn('Say I come up and do the panel on Tuesday the 20th of October. When would I actually hear how it went?', '', EVIDENCE),
      CALCULATION_NOTICE_EVIDENCE,
    );
  });
  test('a weighted score and a length of service get it too', () => {
    const scorecard = '<evidence>Weights: technical 40%, leadership 25%, ownership 20%, communication 15%. Advance at 3.0 or above with no 1.</evidence>';
    assert.equal(calculationNoticeForTurn('technical 3, leadership 4, ownership 3, communication 2. does that clear the bar to move her on?', '', scorecard), CALCULATION_NOTICE_EVIDENCE);
    const resume = '<evidence>Quillhaven, Software Engineer II, March 2023 to present. Promoted to Senior in April 2024.</evidence>';
    assert.equal(calculationNoticeForTurn('how long have I been at quillhaven as of this month?', '', resume), CALCULATION_NOTICE_EVIDENCE);
  });
  test('a follow-up with no quantity word of its own gets it when the evidence holds the figures', () => {
    assert.equal(calculationNoticeForTurn('Is that going to be a problem?', 'User: the freeze moved from 18 September to 9 October', EVIDENCE), CALCULATION_NOTICE_EVIDENCE);
  });
});

describe('what does not change', () => {
  test('a question on the word list keeps the notice it has today, word for word', () => {
    const q = 'Ballpark, what would year one run us for 320 sensors?';
    const ev = '<evidence>HL-T3 sensor: $89 each. Gateway $340.</evidence>';
    assert.equal(calculationNoticeForTurn(q, '', ev), CALCULATION_NOTICE);
    assert.equal(calculationNoticeForTurn(q, '', ev), calculationNotice(q, '', ev));
  });
  test('the word-list notice text is the one measured since 2026-09-30', () => {
    assert.match(CALCULATION_NOTICE, /When an amount is asked about or disputed/);
    assert.match(CALCULATION_NOTICE, /Use only numbers stated above/);
    assert.match(CALCULATION_NOTICE, /Skip it for a direct lookup of one stated figure\.$/);
  });
  test('no evidence in the prompt: nothing beyond the word list', () => {
    assert.equal(calculationNoticeForTurn('When would I actually hear how it went?', 'User: the panel is on the 20th, they said 5 days', ''), '');
    assert.equal(calculationNoticeForTurn('Tell me about yourself', 'User: I have 9 years and 2 roles', undefined), '');
    assert.equal(calculationNoticeForTurn('When would I hear?', '', '   '), '');
  });
  test('a code question gets neither notice, with or without evidence', () => {
    const sheet = '<evidence>Problem 3: top_k_words(words, k). Return the k most frequent words; ties go to the earlier word. 1 <= k <= 100.</evidence>';
    assert.equal(calculationNoticeForTurn('What is the time complexity of that for n = 10 and 20?', '', sheet), '');
    assert.equal(calculationNoticeForTurn('Write the function for problem 3 in Python.', '', sheet), '');
  });
  test('evidence with fewer than two figures in play: no notice', () => {
    assert.equal(calculationNoticeForTurn('Who owns the rollout?', '', '<evidence>Dorrin owns the store submission. Tobiah owns the SDK list.</evidence>'), '');
  });
  test('an empty question: no notice', () => {
    assert.equal(calculationNoticeForTurn('', '', EVIDENCE), '');
    assert.equal(calculationNoticeForTurn('   ', '', EVIDENCE), '');
  });
});

describe('the lighter notice', () => {
  test('asks for the same hidden block the stream filter removes', () => {
    assert.match(CALCULATION_NOTICE_EVIDENCE, /^# Calculation\n/);
    assert.match(CALCULATION_NOTICE_EVIDENCE, /\[\[CALC\]\] and \[\[\/CALC\]\]/);
    assert.match(CALCULATION_NOTICE_EVIDENCE, /The block is removed before anyone sees it\./);
  });
  test('names dates, lengths of time and weighted scores', () => {
    assert.match(CALCULATION_NOTICE_EVIDENCE, /a weighted score/);
    assert.match(CALCULATION_NOTICE_EVIDENCE, /a date or deadline counted from another date/);
    assert.match(CALCULATION_NOTICE_EVIDENCE, /business days one weekday per line/);
  });
  test('does not carry the disputed-amount sentences that cost completeness on plain lookups', () => {
    assert.doesNotMatch(CALCULATION_NOTICE_EVIDENCE, /Use only numbers stated above/);
    assert.doesNotMatch(CALCULATION_NOTICE_EVIDENCE, /asked about or disputed/);
    assert.doesNotMatch(CALCULATION_NOTICE_EVIDENCE, /do not reconcile/);
  });
  test('ends by saying a stated fact needs no working and the answer stays complete', () => {
    assert.match(CALCULATION_NOTICE_EVIDENCE, /If the answer is a fact stated above, there is nothing to work out: answer as you otherwise would, with everything the question needs\.$/);
  });
  test('its examples use no figure of a benchmark document', () => {
    assert.doesNotMatch(CALCULATION_NOTICE_EVIDENCE, /\b(?:45|27|3\.15|2\.95|14 November|Quillhaven)\b/);
  });
});

describe('wiring', () => {
  test('the composer calls the per-turn function with the question, the conversation and the evidence block', () => {
    assert.match(COMPOSER, /push\('calculation', calculationNoticeForTurn\(d\.resolvedQuestion, input\.conversationSummary, packed\.evidenceBlock\)\)/);
    assert.doesNotMatch(COMPOSER, /push\('calculation', calculationNotice\(/);
  });
});
