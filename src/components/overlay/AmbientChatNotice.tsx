import React, { useEffect, useState } from 'react';
import { MicOff } from 'lucide-react';
import { OverlayBanner, OverlayBannerButton } from '../ui/OverlayBanner';
import { useT } from '../../i18n';
import '../ui/OverlayBanner.css';

/**
 * Ambient AI Chat (Settings › General), as the meeting overlay sees it.
 *
 * With the setting on, main starts a meeting without mic or system audio
 * capture and without STT (electron/main.ts, the `_ambientChatEnabled` gate in
 * the meeting's audio init). Nothing is ever transcribed, so the overlay says
 * so instead of drawing "Listening..." for audio that is not captured
 * (issue #679).
 *
 * Main owns the fact, per meeting (`_meetingWithoutAudio`): set when a
 * meeting starts with the setting on, cleared when anything starts a capture
 * after all (a speech-engine change in Settings › Audio rebuilds the pipeline
 * mid-meeting) and when the meeting ends. The setting alone is not enough: it
 * can change mid-meeting, and main reads it only at the start. The fact is
 * read on mount (a reloaded overlay mid-meeting) and at session-reset, and
 * every change is pushed as 'meeting-audio-capture'. A pushed change wins over
 * a read that was already in flight when it came.
 *
 * The banner can be closed for the rest of the meeting; the next meeting
 * shows it again.
 *
 * Every string is passed through t() here; the rows are in
 * src/i18n.ambientChat.ts.
 */
export interface AmbientChatMeeting {
  /** This meeting captures no audio: it started with Ambient AI Chat on. */
  on: boolean;
  dismissed: boolean;
  dismiss: () => void;
}

export function useAmbientChatMeeting(): AmbientChatMeeting {
  const [withoutAudio, setWithoutAudio] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const api = window.electronAPI;
    let mounted = true;
    let pushes = 0;
    const read = () => {
      const pushesAtRead = pushes;
      api?.getMeetingAudioCapture?.()
        .then((state) => {
          if (mounted && pushes === pushesAtRead) setWithoutAudio(state?.withoutAudio === true);
        })
        .catch(() => {});
    };
    read();
    const unsubReset = api?.onSessionReset?.(() => {
      setDismissed(false);
      read();
    });
    const unsubPush = api?.onMeetingAudioCapture?.((state) => {
      pushes += 1;
      setWithoutAudio(state?.withoutAudio === true);
    });
    return () => {
      mounted = false;
      unsubReset?.();
      unsubPush?.();
    };
  }, []);

  return { on: withoutAudio, dismissed, dismiss: () => setDismissed(true) };
}

export const AmbientChatNoticeBanner: React.FC<{ ambientChat: AmbientChatMeeting }> = ({ ambientChat }) => {
  const t = useT();
  return (
    <OverlayBanner
      className="mx-4"
      tone="warning"
      icon={<MicOff strokeWidth={2.2} />}
      title={t('Not listening: Ambient AI Chat is on')}
      message={t('This meeting does not capture your microphone or system audio, so nothing is transcribed. Type your question, or turn off Ambient AI Chat in Settings › General before your next meeting.')}
      onDismiss={ambientChat.dismiss}
      dismissLabel={t('Dismiss')}
      actions={
        <OverlayBannerButton
          variant="primary"
          onClick={() => window.electronAPI?.openSettingsTab?.('general')}
        >
          {t('Open Settings')}
        </OverlayBannerButton>
      }
    />
  );
};
