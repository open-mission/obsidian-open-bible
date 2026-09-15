# Changelog

All notable changes to the **OpenBible** Obsidian plugin are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added
- **Directional Chapter Transitions**: Smooth GPU-accelerated CSS animations (`is-next`, `is-prev`, `is-jump`) when changing chapters, respecting user reduced-motion preferences.

## [0.1.0] - 2026-09-15

### Added
- **Bible Reader View (`BibleReaderView`)**: Native Obsidian workspace leaf with responsive single and two-column chapter reading layouts.
- **Passage Selector (`BookPicker`)**: Fast book picker with search, Old/New Testament filters, and chapter selection.
- **SQLite Database Engine**: Embedded WebAssembly-compiled SQLite runtime via `sql.js`, allowing offline Bible databases (`.sqlite`, `.db`, `.sqlite3`).
- **Thompson Cross-References**: Compact binary decoding (`crossRefsBytes.ts`) of comprehensive cross-reference datasets (`cross-refs.bin`).
- **Backlinks-style Cross-Reference Panel (`CrossRefBottomPanel`)**: Bottom drawer displaying incoming and outgoing references for the active chapter.
- **Verse Preview Modal (`VersePreviewModal`)**: Interactive preview modal to view referenced passages and copy text without navigating away.
- **Bilingual Interface**: Reactive i18n support in English (`en`) and Portuguese (`pt`), including auto-detection of Obsidian UI language.
- **Hierarchical Settings App (`SettingsApp`)**: Multi-page settings dashboard with categories for Reader, Data, Study, Language, and About.
- **CI / CD Pipelines**:
  - `.github/workflows/ci.yml`: Automated pull request and branch validation (`svelte-check` and `build`).
  - `.github/workflows/release.yml`: Automated GitHub release builds with cryptographic artifact attestations (`actions/attest@v4`).
- **Guidelines Compliance**: Full compliance with Obsidian Community Plugin policies and review checklists.
- **Documentation**: Developer docs in `docs/` (`README.md`, `ARCHITECTURE.md`, `GUIDELINES-COMPLIANCE.md`, `RELEASING.md`).
