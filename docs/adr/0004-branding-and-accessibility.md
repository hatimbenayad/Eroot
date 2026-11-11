# ADR-0004: Original Eroot Visual Identity, Accessibility Redundancy, and Synthesized Audio

- **Status:** Accepted
- **Date:** 2026-11-11
- **Phase:** Inception

## Context

The platform reproduces the gameplay and creator ergonomics of modern live-quiz tools while strictly avoiding Kahoot's trademarks, brand name, mascots, artwork, and audio assets. At the same time, live classroom/event projection and mobile play demand strong contrast and colour-blind safety.

## Decision

1. **Brand & Surface Palette:**
   - Product name: **Eroot** with an original geometric brand mark (clean SVG wordmark/emblem).
   - **Creator & Library / Reports UI:** Clean light workspace (`slate-50` canvas, crisp `white` cards, `indigo-600` primary focus/selection accents, high-contrast neutral typography, violet validation callouts).
   - **Host Big-Screen & Live Stage UI:** Deep indigo/slate stage (`#0f172a` / `#1e1b4b` gradient surfaces) engineered for projector legibility and high contrast.
   - **Player Answer Tiles:** Bold, saturated geometric answer tiles following universal colour-shape conventions so colour is **never** the sole indicator:
     - Option 1: **Red (`#dc2626`) + Triangle**
     - Option 2: **Blue (`#2563eb`) + Diamond**
     - Option 3: **Yellow/Amber (`#ca8a04` / `#eab308` with dark/high-contrast text) + Circle**
     - Option 4: **Green (`#16a34a`) + Square**
     - Options 5-6 (when extended): **Teal + Hexagon**, **Purple + Star** (each with distinct SVG shape + `A..F` or text label).
2. **Audio:**
   - Lobby and countdown music/SFX are generated natively via the **Web Audio API** (synthesized mellow chord loops and gentle tick/chime SFX) with host mute and volume controls. Zero copyrighted or third-party music files required.
3. **Accessibility:**
   - Full keyboard tabbing, `Space` host progression shortcut, ARIA live regions for timer/question state changes, `prefers-reduced-motion` support across Framer Motion transitions, and automated `axe` checks in Playwright.

## Consequences

- **Positive:** Zero IP/licensing risk, instant offline-safe audio without large MP3 bundles, accessible to colour-blind and keyboard-only users by default.
- **Negative:** Yellow/amber tiles require careful foreground contrast (`#0f172a` dark text/icon on bright yellow or darker `#b45309` surface for white text — verify WCAG AA >= 4.5:1 during U1 design system implementation).

