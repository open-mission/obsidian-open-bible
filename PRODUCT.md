# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Obsidian users, students of Scripture, researchers, writers, and daily readers seeking a focused, personal study companion for reading, note-taking, highlighting, and exploring cross-references without leaving their local vault.

## Product Purpose

Provide an offline-first Bible reader and study companion deeply integrated into Obsidian. Enables users to read Scripture, compare translations side by side, trace Thompson cross-references, preview verses interactively, and synthesize biblical insights into their personal knowledge base with total privacy.

## Positioning

Unlike web-based Bible applications or cloud services, OpenBible operates 100% offline via local SQLite databases compiled to WebAssembly. Unlike generic note-taking or static markdown text imports, it provides a structured, responsive study experience (fast passage picker, multi-translation switching, cross-references, popover previews, and text comparison) native to Obsidian's pane layout and themes.

## Operating Context

Runs directly inside Obsidian on Desktop (macOS, Windows, Linux) and Mobile (iOS, Android). Operates in main reading panes, docked sidebars (left or right), or modal popovers. Fits within workflows ranging from quiet daily devotional reading and side-by-side note-taking alongside personal notes to deep multi-version comparison and study.

## Capabilities and Constraints

- **Capabilities**:
  - Offline SQLite querying powered by WebAssembly (sql.js).
  - Instant passage selector with fuzzy search and Testament filtering.
  - Multi-version Bible translation support and management.
  - Inline and panel Thompson cross-references with verse preview popovers.
  - Side-by-side and parallel text comparison across versions.
  - Bilingual UI localized for English and Portuguese.
- **Constraints**:
  - 100% offline; zero telemetry or external network calls.
  - Strict adherence to Obsidian theme variables (`--text-normal`, `--background-primary`, etc.) for seamless light and dark mode integration without hardcoded color values.
  - Local vault storage for databases and settings; mobile and desktop viewport responsiveness.

## Brand Commitments

- **Name**: OpenBible (by Open Mission).
- **Voice**: Respectful, clean, scholarly yet accessible, distraction-free.
- **Design Philosophy**: The interface recedes to keep Scripture front and center; follows Obsidian styling conventions and standard UI components.

## Evidence on Hand

- Shipped Obsidian community plugin (`manifest.json` v0.4.1, Svelte components in `src/`, bundled `styles.css`).
- Cross-reference dataset sourced from OpenBible.info (CC-BY).
- Architectural and feature documentation in `docs/` (`ARCHITECTURE.md`, `text-comparison.md`, `verse-previews.md`, `notes-and-highlights.md`, `GUIDELINES-COMPLIANCE.md`).

## Product Principles

1. **Offline Sovereignty & Privacy**: Everything runs locally on device; user notes and Scripture reading remain entirely private and local.
2. **Unobtrusive Scripture Immersion**: Clean, high-legibility typography and spacing designed for extended reading without visual clutter.
3. **Native Obsidian Harmony**: Behave as an organic part of Obsidian; adapt dynamically to community themes, light/dark modes, and workspace layouts.
4. **Instantaneous Navigation**: Switching books, chapters, translations, or previewing cross-references must feel immediate and maintain reading flow.

## Accessibility & Inclusion

- Responsive typography respecting Obsidian font size preferences.
- High-contrast compatibility across diverse Obsidian themes (light and dark).
- Keyboard accessibility for navigation and search.
- Bilingual localization for English and Portuguese.
