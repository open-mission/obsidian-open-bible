# Changelog

All notable changes to the **OpenBible** Obsidian plugin are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

## [0.2.1] - 2026-09-15

### Added
- **Page Header Actions**: Registered native Obsidian view header actions (`addAction`) in `BibleReaderView` for Appearance (`sliders-horizontal`) and Reading History (`history`), providing direct access from the desktop tab header.
- **Reading History i18n**: Added full localization strings for reading history menu items across English and Portuguese.

### Fixed
- **Mobile Toolbar Overflow**: Optimized the Bible Reader toolbar on mobile devices by removing the inline Appearance button (accessible via page header `...` menu), enforcing `max-width: 100%`, and refining button min-widths, gaps, and text truncation so navigation arrows never get clipped.
- **Appearance Modal & Mobile Drawer Redesign**:
  - Re-architected `AppearancePanel` using native Obsidian `.setting-item`, `.setting-item-info`, `.setting-item-control`, native `Toggle` components, and responsive `<select class="dropdown">` selectors.
  - Eliminated horizontal button overflow on mobile by replacing wide segmented button bars with clean, native dropdown menus and indented sub-settings (`.mod-sub`).
  - Enabled mobile vertical touch scrolling in the appearance drawer (`overflow-y: auto`, `-webkit-overflow-scrolling: touch`, `touch-action: pan-y`) with bottom safe-area padding.
  - Allowed the mobile appearance drawer to dynamically hug content (`height: auto; max-height: 85dvh`) instead of forcing a rigid 90dvh.

## [0.2.0] - 2026-09-15

### Added
- **Directional Chapter Transitions**: Smooth GPU-accelerated CSS animations (`is-next`, `is-prev`, `is-jump`) when changing chapters, respecting user reduced-motion preferences.
- **Markdown Version Properties Notes (`.md`)**:
  - Automatically creates a markdown note with Obsidian YAML properties (e.g. `ACF.md`) in the `versions/` folder upon importing or discovering a version.
  - Frontmatter properties include `name`, `abbreviation`, `file`, `language`, and `default`.
  - **Bidirectional synchronization**: edits made in Obsidian's native Properties view or markdown editor immediately update plugin version metadata in real time; edits made via the plugin UI update the `.md` note while preserving any user notes and extra custom properties.
  - Quick action button in Settings to open the version's `.md` note directly in Obsidian.
- **Version Search & Filtering**: Live search by name, abbreviation, language, and file path in both the Version Settings tab and the Reader's Version Picker drawer.
- **Primary / Default Bible Version**:
  - Set a preferred default Bible version via General Settings, the Version Settings star toggle, the Version Edit modal, or the `default: true` property in the `.md` note.
  - Automatically selected by default in the Bible Reader, Verse Previews, and future verse citations.
  - Automatic cleanup of `.sqlite` binary and associated `.md` note when a version is deleted.
- **Language Selector Dropdown**: Version metadata editing modal now provides a curated `<select>` dropdown of major biblical and world languages (Português, English, Español, Français, Deutsch, Greek, Hebrew, etc.) with support for custom language input.

### Removed
- **Default Reference Setting**: Removed the legacy "Default reference" input from General settings to focus the page solely on primary version configuration.


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
