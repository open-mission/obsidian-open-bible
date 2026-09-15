# Changelog

All notable changes to the **OpenBible** Obsidian plugin are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added
- **Vault-Native Notes & Highlights**:
  - Saved as standard Markdown files in the vault with structured YAML frontmatter (`type: note` and `type: highlight`).
  - Configurable storage folders (default: `OpenBible/notes` and `OpenBible/highlights`).
  - Customizable highlight colors and labels in Settings (e.g. green for Tithing, yellow for Promise).
  - Configurable note categories, labels, and colors in Settings (default: Geral, Devocional, Estudo, Teologia, Aplicação, Contexto), with direct category selection menu when creating notes from the Verse Action Bar.
  - Floating Verse Action Bar (popover) appearing on verse selection, multi-verse selection (Shift+click), or word/phrase selection.
  - Mobile bottom drawer for selecting and managing highlights on touch devices.
  - Colored underline (`.open-bible-hl-line`) for highlights and word-level selections in the reader.
  - Colored vertical indicator lines (`.open-bible-verse-note-line`) in the gutter for notes, connecting multi-verse spans and supporting hover preview (`Ctrl`/`Cmd`) and click-to-preview/edit.
  - Quick actions to copy scripture text, copy reference, and create notes directly from the popover.

- **Highlights Panel Drawer & Sidebar View**:
  - Added dedicated drawer panel and standalone Obsidian `ItemView` (`open-bible-highlights-view`) to browse, search, and manage all Bible highlights across the vault.
  - Can be docked in right or left sidebar via commands (`open-bible-highlights-right-sidebar`, `open-bible-highlights-left-sidebar`) or opened as a drawer inside the reader.
  - Supports full-text search by reference, snippet text, and label, plus category filter chips based on `highlight_label`.
  - Displays label badges on each highlight card.
  - One-click navigation directly to passage/verse, open highlight markdown file in editor, and delete highlight with confirmation.
  - Accessible via Reader Toolbar (`highlighter`), view header action, reader pane context menu, and command palette.
- **`highlight_label` YAML Frontmatter Metadata**:
  - Added `highlight_label` to frontmatter of generated highlights and notes (`type: highlight` and `type: note`), enabling direct querying and grouping in Dataview, Obsidian Bases, and search.
  - Automatically resolves label from palette configuration when creating highlights or notes.
- **Verse Selection Mode & Mobile Support**:
  - Implemented single-verse click-to-select (clicking again deselects).
  - Shift-click multi-verse range selection.
  - Added clear visual styling for selected verses (`.open-bible-reader-verse.is-selected`) with accent left-border and tinted background.
  - Added dedicated Selection Mode (`check-square` button in toolbar, page header action, and command palette `toggle-selection-mode`) rendering touch-friendly checkboxes on every verse row for mobile devices.

### Fixed
- **Selection Mode Clutter / Checkbox Overlap**:
  - Automatically hides note indicator gutter lines and text highlight underlines whenever Selection Mode is active, preventing visual overlap with checkboxes. Highlights and note indicators are seamlessly restored upon exiting selection mode.
- **Natural Text Selection vs. Whole Verse Selection**:
  - Isolated whole-verse selection to clicking the verse number (e.g. `5`) or using Selection Mode checkboxes, freeing the verse text (`cursor: text`, `user-select: text`) for natural word double-clicking and click-and-drag phrase selection.
  - Eliminated premature popovers and whole-verse selection conflicts when attempting to highlight phrases or words.
  - Clicking on the text when an action bar is open cleanly dismisses it.
- **Selected Verse Visibility**:
  - Added a complete 1.5px accent border (`var(--interactive-accent)`) with subtle glow around selected verses, ensuring they remain immediately recognizable even when adjacent to note indicators.
- **Mobile Floating Popover Navigation Bar Collision**:
  - Adjusted mobile docked offset to `calc(80px + env(safe-area-inset-bottom, 0px))`, positioning the floating Verse Action Bar cleanly above Obsidian's mobile navigation bar.
- **Note Indicator Vertical Hover**:
  - Hovering any segment of a multi-verse vertical note line now synchronously highlights and expands the entire vertical bar across all spanned verses in the gutter.
  - Eliminated duplicate OS-native tooltip by removing redundant `title` attribute in favor of Obsidian's `aria-label` tooltip.
- **Removed Auto-Scroll to Cross-References**:
  - Removed the automatic scrolling behavior that caused the viewport to jump down to the cross-reference bottom panel when a verse was clicked.
- **Chapter-Only Reference Parsing in Notes**:
  - Fixed verse reference detection in `VerseReferenceParser` (`findAllReferencesInText`): chapter references without explicit verse numbers (e.g. `Mateus 10`, `Sl 23`, `Gênesis 1 NVI`) are now recognized and highlighted in running text rather than requiring a verse suffix (such as `Mateus 10.1`).
  - Previews for chapter-only references display the full chapter text and title (e.g. `Mateus 10 (ARA)`), and navigate directly to chapter 1 in the reader.
  - Automatically rewinds regex scanner position when a trailing non-version word is encountered, ensuring adjacent references (e.g. `Mateus 10 Jo 3:16`) are correctly parsed.
  - Excluded YAML frontmatter syntax nodes from CodeMirror live preview decoration to avoid highlighting frontmatter properties as verse links.
- **History Modal i18n**: Resolved untranslated `history.*` keys displaying raw key names in the Reading History modal by adding missing localization strings (`title`, `countSingle`, `countPlural`, `clearHistory`, `emptyTitle`, `emptyDesc`, `justNow`, `yesterday`, `close`, and `notices.historyCleared`) in English and Portuguese.
- **Reader Toolbar Cleanup**: Removed the redundant History button from `ReaderToolbar` since reading history is already accessible from the view's page header action and pane context menu.

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
