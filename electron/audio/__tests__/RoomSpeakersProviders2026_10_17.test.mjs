// People sharing the microphone, on every provider whose live stream labels
// voices (2026-10-17): Deepgram, Soniox and Google. Covers the shared label
// helpers (sttDiarization.ts), the save-time split across provider
// connections (roomSpeakers.ts: voice numbers restart on a reconnect), the
// Settings list pinned to the backend's, and the wiring in each provider and
// main.ts (from source: the providers open real sockets).
//
// Run (after `npm run build:electron`):
//   node scripts/run-with-env.mjs --default-tmpdir NATIVELY_TEST_USERDATA=natively-test-userdata \
//     --set ELECTRON_RUN_AS_NODE=1 -- electron --test --test-force-exit <this file>
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const read = (rel) => fs.readFileSync(path.join(REPO, rel), 'utf8');
const dia = require(path.join(REPO, 'dist-electron/electron/audio/sttDiarization.js'));
const room = require(path.join(REPO, 'dist-electron/electron/services/meeting/roomSpeakers.js'));

const many = (n, w = 'word') => Array.from({ length: n }, (_, i) => `${w}${i}`).join(' ');
const mic = (speakerId, text) => ({ speaker: 'user', text, timestamp: 1, final: true, ...(speakerId ? { speakerId } : {}) });

describe('voice label helpers', () => {
    test('provider labels become canonical ids', () => {
        assert.equal(dia.voiceIdFromLabel('1'), 'speaker_1');
        assert.equal(dia.voiceIdFromLabel(2), 'speaker_2');
        assert.equal(dia.voiceIdFromLabel(' 3 '), 'speaker_3');
        assert.equal(dia.voiceIdFromLabel('spk A'), 'speaker_spk_A');
        for (const bad of [undefined, null, '', '  ', 0, '0', -1, 1.5, {}]) assert.equal(dia.voiceIdFromLabel(bad), undefined, String(bad));
    });

    test('Soniox tokens split into one run per voice; unlabelled pieces join their run', () => {
        const tokens = [
            { text: 'Hi', speaker: '1' }, { text: ' there' , speaker: '1' }, { text: ',' },
            { text: ' sure', speaker: '2' }, { text: ' thing', speaker: '2' }, { text: '.' },
            { text: ' Great', speaker: '1' },
        ];
        assert.deepEqual(dia.runsByVoice(tokens, (t) => t.text, (t) => t.speaker), [
            { text: 'Hi there,', speakerId: 'speaker_1' },
            { text: ' sure thing.', speakerId: 'speaker_2' },
            { text: ' Great', speakerId: 'speaker_1' },
        ]);
        assert.deepEqual(dia.runsByVoice([{ text: 'no labels' }, { text: ' at all' }], (t) => t.text, (t) => t.speaker),
            [{ text: 'no labels at all' }], 'no labels: one run, no id');
        assert.deepEqual(dia.runsByVoice([{ text: '  ' }], (t) => t.text, (t) => t.speaker), [], 'blank runs dropped');
    });

    test('Google: only the tail of the resent word list counts', () => {
        const words = [
            ...Array.from({ length: 10 }, () => ({ speakerLabel: '1' })), // earlier results
            { speakerLabel: '2' }, { speakerLabel: '2' }, { speakerLabel: '1' },  // this result
        ];
        assert.equal(dia.dominantVoiceOfTail(words, 3), 'speaker_2');
        assert.equal(dia.dominantVoiceOfTail(words, 13), 'speaker_1');
        assert.equal(dia.dominantVoiceOfTail([{ speakerTag: 4 }], 1), 'speaker_4', 'older speakerTag still read');
        assert.equal(dia.dominantVoiceOfTail([], 2), undefined);
        assert.equal(dia.dominantVoiceOfTail(undefined, 2), undefined);
        assert.equal(dia.dominantVoiceOfTail([{}], 1), undefined);
    });

    test('labels are asked for only where opted in', () => {
        assert.equal(dia.shouldDiarize('user', { roomSpeakers: true, remoteFlag: false }), true);
        assert.equal(dia.shouldDiarize('user', { roomSpeakers: false, remoteFlag: true }), false, 'the remote flag never labels the mic');
        assert.equal(dia.shouldDiarize('interviewer', { roomSpeakers: true, remoteFlag: false }), false, 'the room setting never labels the call');
        assert.equal(dia.shouldDiarize('interviewer', { roomSpeakers: false, remoteFlag: true }), true);
        assert.equal(dia.shouldDiarize('other', { roomSpeakers: true, remoteFlag: true }), false);
    });

    test('connection tags round-trip', () => {
        assert.equal(dia.withVoiceEpoch('speaker_2', 3), 'speaker_2@3');
        assert.equal(dia.withVoiceEpoch('speaker_2', undefined), 'speaker_2');
        assert.deepEqual(dia.parseVoiceId('speaker_2@3'), { voice: 'speaker_2', epoch: '3' });
        assert.deepEqual(dia.parseVoiceId('speaker_2'), { voice: 'speaker_2', epoch: '' });
        assert.equal(dia.canDiarize({ setDiarization() {} }), true);
        assert.equal(dia.canDiarize({}), false);
        assert.equal(dia.canDiarize(null), false);
    });
});

describe('the split across provider connections', () => {
    test('labels swapped by a reconnect still give one "Me" and one Speaker', () => {
        // Window 1: speaker_1 is the user. Window 2 (after a reconnect): the
        // provider happened to call the colleague speaker_1.
        const lines = [
            mic('speaker_1@1', many(30)), mic('speaker_2@1', many(8, 'c')), mic('speaker_1@1', many(20)),
            mic('speaker_2@1', many(6, 'c')), mic('speaker_2@1', many(5, 'c')),
            mic('speaker_2@2', many(40)), mic('speaker_1@2', many(9, 'c')), mic('speaker_2@2', many(25)),
            mic('speaker_1@2', many(7, 'c')),
        ];
        const split = room.splitRoomSpeakers(lines);
        assert.equal(split.voices, 1, 'one other person, not two');
        const names = split.transcript.map((l) => l.speaker);
        assert.deepEqual(names, ['user', 'Speaker 2', 'user', 'Speaker 2', 'Speaker 2', 'user', 'Speaker 2', 'user', 'Speaker 2']);
        assert.ok(split.transcript.every((l) => !('speakerId' in l)), 'provider voice ids are not kept');
    });

    test('the user alone, renumbered by reconnects, is never split', () => {
        const lines = [mic('speaker_1@1', many(30)), mic('speaker_1@2', many(30)), mic('speaker_2@3', many(30)), mic('speaker_1@4', many(5))];
        assert.equal(room.splitRoomSpeakers(lines).voices, 0);
    });

    test('a single connection behaves exactly as before', () => {
        const lines = [
            mic('speaker_1', many(40)), mic('speaker_2', many(10, 'b')), mic('speaker_2', many(10, 'b')),
            mic('speaker_2', many(10, 'b')), mic('speaker_3', many(2, 'x')),
        ];
        const split = room.splitRoomSpeakers(lines);
        assert.equal(split.voices, 1);
        assert.deepEqual(split.transcript.map((l) => l.speaker), ['user', 'Speaker 2', 'Speaker 2', 'Speaker 2', 'user']);
    });

    test('a third person gets their own number, past the call\'s named people', () => {
        const lines = [
            mic('speaker_1@1', many(50)), mic('speaker_2@1', many(15, 'b')), mic('speaker_2@1', many(15, 'b')), mic('speaker_2@1', many(15, 'b')),
            mic('speaker_3@1', many(12, 'c')), mic('speaker_3@1', many(12, 'c')), mic('speaker_3@1', many(12, 'c')),
        ];
        const split = room.splitRoomSpeakers(lines, { usedIds: ['speaker_2'] });
        assert.equal(split.voices, 2);
        assert.deepEqual(new Set(split.transcript.filter((l) => l.speaker !== 'user').map((l) => l.speaker)), new Set(['Speaker 3', 'Speaker 4']),
            'numbered past the call\'s named people');
    });
});

describe('which providers can label voices', () => {
    const SOURCES = {
        deepgram: 'electron/audio/DeepgramStreamingSTT.ts',
        soniox: 'electron/audio/SonioxStreamingSTT.ts',
        google: 'electron/audio/GoogleSTT.ts',
    };
    const CANNOT = [
        'electron/audio/ElevenLabsStreamingSTT.ts', 'electron/audio/OpenAIStreamingSTT.ts', 'electron/audio/RestSTT.ts',
        'electron/audio/NvidiaNimStreamingSTT.ts', 'electron/audio/NativelyProSTT.ts', 'electron/audio/AppleSpeechSTT.ts',
        'electron/audio/LocalWhisperSTT.ts',
    ];

    test('the Settings list is the backend\'s list', () => {
        const ui = read('src/components/settings/RoomSpeakersSettings.tsx');
        const m = /ROOM_SPEAKERS_PROVIDERS[^=]*=\s*new Set\(\[([^\]]*)\]\)/.exec(ui);
        assert.ok(m, 'ROOM_SPEAKERS_PROVIDERS found');
        const uiSet = new Set([...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]));
        assert.deepEqual([...uiSet].sort(), [...dia.DIARIZING_STT_PROVIDERS].sort());
        assert.deepEqual([...dia.DIARIZING_STT_PROVIDERS].sort(), Object.keys(SOURCES).sort());
    });

    test('each listed provider can be asked; the others cannot', () => {
        for (const [id, rel] of Object.entries(SOURCES)) assert.match(read(rel), /public setDiarization\(enabled: boolean\): void/, id);
        for (const rel of CANNOT) assert.doesNotMatch(read(rel), /setDiarization\(/, rel);
    });

    test('Soniox: labels are a config field, finals split by voice, the old single final without', () => {
        const src = read(SOURCES.soniox);
        assert.match(src, /if \(this\.diarize\) config\.enable_speaker_diarization = true;/);
        assert.match(src, /const runs = this\.diarize \? runsByVoice\(finalTokens, .*\) : \[\];/);
        assert.match(src, /speakerId: run\.speakerId, voiceEpoch: this\.voiceEpoch/);
        assert.match(src, /this\.configSent = false;\s*this\.voiceEpoch\+\+;/, 'each connection counted');
    });

    test('Google: labels in the request, the result\'s own words, and a refusal never costs the transcript', () => {
        const src = read(SOURCES.google);
        assert.match(src, /\.\.\.\(this\.diarizing\s*\?\s*\{ diarizationConfig: \{ enableSpeakerDiarization: true/);
        assert.match(src, /dominantVoiceOfTail\(alt\.words, \(String\(transcript\)\.match\(\/\\S\+\/g\) \?\? \[\]\)\.length\)/);
        const err = src.slice(src.indexOf(".on('error'"), src.indexOf(".on('data'"));
        const dropAt = err.lastIndexOf('this.dropDiarization(');
        const fatalAt = err.indexOf('const isPermanent');
        assert.ok(dropAt > 0 && fatalAt > dropAt, 'labels are dropped before an INVALID_ARGUMENT can be fatal');
        assert.match(err, /grpcCode === 3 && this\.diarizing && \/diariz\|speaker\/i/);
    });

    test('main.ts asks any capable provider, before start, and tags only mic ids', () => {
        const main = read('electron/main.ts');
        assert.doesNotMatch(main, /dg\.setDiarization/, 'no Deepgram-only switch-on left');
        const askAt = main.indexOf('if (wantLabels && canDiarize(stt)) stt.setDiarization(true);');
        const startAt = main.indexOf('stt.start();', askAt);
        assert.ok(askAt > 0 && startAt > askAt, 'labels are switched on before the stream starts');
        assert.match(main, /const speakerId = segment\.speakerId && speaker === 'user'\s*\? withVoiceEpoch\(segment\.speakerId, segment\.voiceEpoch\)\s*: segment\.speakerId;/);
    });
});
