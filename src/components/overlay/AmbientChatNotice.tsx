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
 * Main decides capture when the meeting starts, so the setting is read on
 * mount and again on session-reset (sent at every meeting start). The banner
 * can be closed for the rest of the meeting; the next meeting shows it again.
 *
 * Every string is passed through t() here; the rows are in
 * src/i18n.ambientChat.ts.
 */
export interface AmbientChatMeeting {
  on: boolean;
  dismissed: boolean;
  dismiss: () => void;
}

export function useAmbientChatMeeting(): AmbientChatMeeting {
  const [on, setOn] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const api = window.electronAPI;
    let mounted = true;
    const read = () => {
      api?.getAmbientChatEnabled?.()
        .then((enabled) => { if (mounted) setOn(enabled === true); })
        .catch(() => {});
    };
    read();
    const unsub = api?.onSessionReset?.(() => {
      setDismissed(false);
      read();
    });
    return () => {
      mounted = false;
      unsub?.();
    };
  }, []);

  return { on, dismissed, dismiss: () => setDismissed(true) };
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
