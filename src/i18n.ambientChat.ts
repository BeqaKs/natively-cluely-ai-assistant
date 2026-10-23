// src/i18n.ambientChat.ts
//
// What the meeting overlay says when Ambient AI Chat is on and the meeting
// captures no audio (src/components/overlay/AmbientChatNotice.tsx). English
// source → [ru, zh, ja, es], one row per sentence, so a language can never miss
// a row the others have. Same shape as src/i18n.trial.ts.
//
// "Ambient AI Chat" is the setting's name as Settings › General shows it, and
// stays in English in every language, as it does there.
//
// The rows must match the strings the component passes to t() exactly:
// src/components/__tests__/AmbientChatNotListening2026_10_23.test.mjs fails on
// a missing row or a leftover row.

type Row = readonly [ru: string, zh: string, ja: string, es: string];

const ROWS: Record<string, Row> = {
  'Not listening: Ambient AI Chat is on': [
    'Не слушаю: включён Ambient AI Chat',
    '未在收听：Ambient AI Chat 已开启',
    '聞き取りオフ：Ambient AI Chat がオンです',
    'Sin escuchar: Ambient AI Chat está activado',
  ],
  'This meeting does not capture your microphone or system audio, so nothing is transcribed. Type your question, or turn off Ambient AI Chat in Settings › General before your next meeting.': [
    'Эта встреча не записывает микрофон и системный звук, поэтому ничего не расшифровывается. Напишите вопрос или отключите Ambient AI Chat в Настройках › Основные перед следующей встречей.',
    '本次会议不会采集你的麦克风或系统音频，因此不会进行任何转写。请直接输入问题，或在下次会议前到“设置 › 通用”中关闭 Ambient AI Chat。',
    'この会議ではマイクとシステム音声を取り込まないため、文字起こしは行われません。質問を入力するか、次の会議の前に「設定 › 一般」で Ambient AI Chat をオフにしてください。',
    'Esta reunión no capta tu micrófono ni el audio del sistema, así que no se transcribe nada. Escribe tu pregunta o desactiva Ambient AI Chat en Ajustes › General antes de tu próxima reunión.',
  ],
};

function column(i: 0 | 1 | 2 | 3): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [en, row] of Object.entries(ROWS)) out[en] = row[i];
  return out;
}

export const AMBIENT_CHAT_EN = Object.freeze(Object.keys(ROWS));
export const AMBIENT_CHAT_RU = column(0);
export const AMBIENT_CHAT_ZH = column(1);
export const AMBIENT_CHAT_JA = column(2);
export const AMBIENT_CHAT_ES = column(3);
