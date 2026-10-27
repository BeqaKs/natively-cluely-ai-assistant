// src/lib/__tests__/MeetingInterfaceThemeSurface2026_10_24.test.mjs
//
// The Lavender meeting style (2026-10-24) paints a LIGHT panel under both app
// colour themes, the mirror of liquid glass and modern, which are always dark.
// Every window that picks light or dark classes for the overlay (the overlay,
// the settings popup, the model picker) asks interfaceThemeSurface(), so a
// wrong answer here repaints white text on the white panel.

import assert from 'node:assert/strict';
import { test, describe } from 'node:test';
import { interfaceThemeSurface, isCssOwnedInterfaceTheme } from '../meetingInterfaceTheme.ts';

describe('interfaceThemeSurface', () => {
  test('default follows the app theme', () => {
    assert.equal(interfaceThemeSurface('default', 'light'), 'light');
    assert.equal(interfaceThemeSurface('default', 'dark'), 'dark');
  });

  test('liquid glass and modern are dark under both app themes (unchanged)', () => {
    for (const theme of ['liquid-glass', 'modern']) {
      assert.equal(interfaceThemeSurface(theme, 'light'), 'dark');
      assert.equal(interfaceThemeSurface(theme, 'dark'), 'dark');
    }
  });

  test('lavender is light under both app themes', () => {
    assert.equal(interfaceThemeSurface('lavender', 'light'), 'light');
    assert.equal(interfaceThemeSurface('lavender', 'dark'), 'light');
  });
});

describe('isCssOwnedInterfaceTheme', () => {
  test('liquid glass and lavender paint their own surfaces; default and modern take the inline opacity styles', () => {
    assert.equal(isCssOwnedInterfaceTheme('liquid-glass'), true);
    assert.equal(isCssOwnedInterfaceTheme('lavender'), true);
    assert.equal(isCssOwnedInterfaceTheme('default'), false);
    assert.equal(isCssOwnedInterfaceTheme('modern'), false);
  });
});
