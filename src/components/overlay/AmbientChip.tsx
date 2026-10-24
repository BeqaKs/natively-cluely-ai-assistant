import React from 'react';
import '../../ui-components/LiquidGlassButton.css';
import '../ui/OverlayBanner.css';
import './AmbientChip.css';

/**
 * "Ambient", beside the overlay's settings button, while Ambient AI Chat
 * leaves the meeting with no audio (useAmbientChatMeeting, issue #679). Clear Liquid Glass,
 * like the page chip: the label keeps the overlay's text colour and a small
 * amber dot carries the state. "Ambient" is the setting's name, which
 * Settings does not translate, so it stays English; the tooltip says what it
 * means.
 */
export const AmbientChip: React.FC<{ title: string }> = ({ title }) => (
  <span data-testid="ambient-label" title={title} className="ov-tone-scope lg-button lg-clear lg-sm amb-chip">
    <span className="lg-content">
      <span className="amb-chip-dot" aria-hidden="true" />
      <span className="lg-label">Ambient</span>
    </span>
  </span>
);
