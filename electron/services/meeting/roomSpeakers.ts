/**
 * People sharing the user's microphone (a meeting room, a laptop on the table)
 * told apart at save time, from the transcription provider's own voice ids.
 *
 * Natively's two channels are "the mic is me, the system audio is them". That
 * holds for a headset, not for a room: everyone around the laptop lands on
 * the mic channel and the notes credit all of it to "Me". With the room
 * setting on, the mic channel is transcribed with provider diarization
 * (Deepgram, Soniox or Google: audio/sttDiarization.ts), so each mic line
 * carries a provider voice id. This turns those ids into speakers:
 *
 *   - the voice with the most words on the mic channel is the user and stays
 *     "Me" (the user is the one who started the recording and usually talks
 *     the most into their own machine);
 *   - every other voice that is clearly a person — at least MIN_SHARE of the
 *     mic channel's words AND at least MIN_LINES lines — becomes its own
 *     "Speaker N", numbered past every id already in use (the remote people
 *     named from the call's roster), so two people never share a number;
 *   - a voice under those thresholds is diarization flicker, not a person, and
 *     folds back into "Me"; so does every line without a voice id.
 *
 * Providers number voices afresh on every connection (a reconnect, Google's
 * 4.5-minute stream restart), so an id may carry the connection it came from,
 * `speaker_2@3`. Each connection is then its own window: in each, the voice
 * with the most words is the user and the rest rank 1, 2, … by words, and a
 * rank is read as the same person in every window. That is exact for two
 * people in a room, the usual case, and an estimate past that. With a single
 * window it is exactly the per-voice rule above.
 *
 * Pure and deterministic: no model call, no audio, no platform branches. The
 * live transcript is untouched (this runs at save), so there is no latency
 * cost; only the saved transcript and the notes see the split.
 */

import { parseVoiceId } from '../../audio/sttDiarization';

export interface RoomLineLike {
    speaker: string;
    text: string;
    speakerId?: string;
}

export interface RoomSplitOptions {
    /** Speaker ids already taken (the call's named people), never reused here. */
    usedIds?: Iterable<string>;
    /** A voice must carry this share of the mic channel's words to be a person. */
    minShare?: number;
    /** …and have said at least this many lines. */
    minLines?: number;
}

export interface RoomSplit<T> {
    transcript: T[];
    /** Line index → the new speaker name, for a parallel copy (the notes' named transcript). */
    renamed: Map<number, string>;
    /** How many extra people were found on the mic channel. */
    voices: number;
}

export const ROOM_MIN_SHARE = 0.15;
export const ROOM_MIN_LINES = 3;

const MIC = /^(user|me)$/i;
const words = (t: string) => (t.match(/\S+/g) ?? []).length;

/** The next free "Speaker N" number, past every id in use. */
export function nextSpeakerNumber(used: Set<string>, from = 2): number {
    let n = from;
    while (used.has(`speaker_${n}`)) n++;
    return n;
}

export function splitRoomSpeakers<T extends RoomLineLike>(lines: T[], opts: RoomSplitOptions = {}): RoomSplit<T> {
    const minShare = opts.minShare ?? ROOM_MIN_SHARE;
    const minLines = opts.minLines ?? ROOM_MIN_LINES;
    const renamed = new Map<number, string>();
    const unchanged = (): RoomSplit<T> => ({ transcript: lines, renamed, voices: 0 });

    // Words and lines per provider voice on the mic channel.
    const perVoice = new Map<string, { words: number; lines: number }>();
    let total = 0;
    lines.forEach((l) => {
        if (!MIC.test(l.speaker) || !l.speakerId) return;
        const w = words(l.text);
        const v = perVoice.get(l.speakerId) ?? { words: 0, lines: 0 };
        v.words += w; v.lines += 1;
        perVoice.set(l.speakerId, v);
        total += w;
    });
    if (perVoice.size < 2 || total === 0) return unchanged();

    // Rank each voice within its connection window: 0 is the user there.
    const byWords = (a: [string, { words: number }], b: [string, { words: number }]) => b[1].words - a[1].words || a[0].localeCompare(b[0]);
    const windows = new Map<string, Array<[string, { words: number; lines: number }]>>();
    for (const entry of perVoice) {
        const { epoch } = parseVoiceId(entry[0]);
        windows.set(epoch, [...(windows.get(epoch) ?? []), entry]);
    }
    const rankOf = new Map<string, number>();
    for (const voices of windows.values()) voices.sort(byWords).forEach(([id], i) => rankOf.set(id, i));

    // A rank is one person across windows; rank 0 is the user.
    const perRank = new Map<number, { words: number; lines: number }>();
    for (const [id, v] of perVoice) {
        const r = rankOf.get(id) ?? 0;
        const agg = perRank.get(r) ?? { words: 0, lines: 0 };
        agg.words += v.words; agg.lines += v.lines;
        perRank.set(r, agg);
    }
    if (perRank.size < 2) return unchanged();

    // Ids in use: the caller's, plus any speaker_N already on a line.
    const used = new Set<string>(opts.usedIds ?? []);
    for (const l of lines) if (l.speakerId && /^speaker_\d+$/.test(l.speakerId) && !MIC.test(l.speaker)) used.add(l.speakerId);

    const nameForRank = new Map<number, string>();
    for (const [r, v] of [...perRank.entries()].sort((a, b) => b[1].words - a[1].words || a[0] - b[0])) {
        if (r === 0) continue;
        if (v.words / total < minShare || v.lines < minLines) continue;
        const n = nextSpeakerNumber(used);
        used.add(`speaker_${n}`);
        nameForRank.set(r, `Speaker ${n}`);
    }
    if (nameForRank.size === 0) return unchanged();
    const nameFor = new Map<string, string>();
    for (const [id, r] of rankOf) {
        const name = nameForRank.get(r);
        if (name) nameFor.set(id, name);
    }

    const transcript = lines.map((l, i) => {
        if (!MIC.test(l.speaker)) return l;
        const name = l.speakerId ? nameFor.get(l.speakerId) : undefined;
        // The provider's voice id has done its work; it is not a call id and is not kept.
        const { speakerId: _voice, ...rest } = l as T & { speakerId?: string };
        if (!name) return rest as T;
        renamed.set(i, name);
        return { ...rest, speaker: name } as T;
    });
    return { transcript, renamed, voices: nameForRank.size };
}
