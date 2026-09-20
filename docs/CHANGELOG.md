# Changelog

All notable changes to the **OpenBible** Obsidian plugin are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

## [0.4.2] - 2026-09-20

### Added
- **Verse Preview Modal Keyboard Navigation**: `ArrowLeft` and `ArrowRight` navigate through cross-reference chains dynamically, accompanied by an accessible tabular-numeric position counter (`currentIndex + 1 / total`).
- **Resource Hub Active State Highlighting**: Cards highlight the currently viewed resource (`.is-active`) with an Obsidian accent ring and subtle background tint when returning from the detail panel.
- **Image Error Fallback for Resources**: Automatic fallback to category-themed placeholders on image loading errors (`onerror`), eliminating broken image boxes.
- **Full Internationalization (i18n)**: Replaced all remaining hardcoded strings and Portuguese fallbacks across the Resource Hub, detail view, verse preview modals, and reader selectors with reactive localized strings in English and Portuguese.

### Improved
- **Resource Hub Cards Craft Polish**:
  - Proportional 94px media header with smooth hover zoom on images (`transform: scale(1.04)`).
  - Themed radial ambient placeholders with category accent colors and animated icon container.
  - Two-line title clamps (`-webkit-line-clamp: 2`) with normalized minimum height for uniform card alignment across rows.
  - Removed obstructive top-left type badges for clean media presentation while preserving category context through grouping and accessible `aria-label` metadata.
  - Touch-friendly 32px targets and persistent button visibility on mobile devices (`@media (hover: none)`).
- **Native Obsidian Settings & Picker Standards**:
  - Preserved standard Obsidian `.setting-item`, `.setting-item-info`, `.setting-item-name`, and `select.dropdown` markup in `AppearancePanel`, ensuring complete compatibility with community themes.
  - Added semantic `role="tablist"` and `role="tab"` with `aria-selected` to `BookPicker`.
  - Added `aria-current="true"` on active book and chapter tiles for assistive technologies.
- **Bible Text Comparison Toolbar**:
  - Streamlined single-row header layout (`Referência` on the left; `Copiar`, `Layout`, and `...` menu on the right), unifying modal and workspace views.
- **Thompson Gutter & Cross-References**:
  - Upgraded touch padding, hover styling, and dual-ring `:focus-visible` outlines on margin triggers and cross-reference tiles.

### Fixed
- **Cross-References Panel Resizer Jank**: Replaced layout-animating width transition with GPU-accelerated `transform: scaleX(1.5)` on `.open-bible-footnotes-resizer-line` and removed `transition: max-height, height` during panel drag-resizing.
- **Side-Tab Visual Anti-Patterns**: Replaced artificial thick colored borders (`border-left: 3px solid ...`) on active cross-references and secondary passage cards with subtle Obsidian-native boundary rings (`box-shadow: 0 0 0 1px var(--interactive-accent)`).
- **Keyboard Action Isolation**: Prevented `Enter` and `Space` keystrokes on card action buttons (`IconButton`) from bubbling and triggering card selection.

## [0.4.1] - 2026-09-20

### Added
- **Multi-Version Bible Text Comparison**:
  - **Interactive Comparison Modal (`BibleCompareModal` & `BibleCompareApp.svelte`)**: Compare passages across any combination of installed Bible translations with multi-select version chips.
  - **Dedicated Workspace View (`BibleCompareView` / `open-bible-compare-view`)**: Open comparisons in dedicated workspace tabs or editor split panes for persistent comparative study side-by-side with your notes.
  - **Modal Pop-Out Button**: Convert any active modal comparison into a workspace tab with one click.
  - **Drag-and-Drop Column & Chip Reordering**: Reorder translation columns or active selection chips by dragging them into the desired order.
  - **Dual Layout Modes**:
    - **Columns by Version**: Each translation rendered in a side-by-side card with horizontal scrolling, drag handle, translation badge, full name, and continuous text with superscript verse numbers.
    - **Verse-by-Verse Rows**: Groups translations together under each verse number for micro-comparative and textual analysis.
  - **Copy Markdown Comparison**: Formats and copies the complete multi-version comparison to the clipboard with 1 click.
  - **Passage Navigation**: Switch between passages directly from within the modal using the integrated passage picker.
- **Obsidian Canvas Export (JSON Canvas 1.0 Spec)**:
  - Generates native `.canvas` files compliant with the open [JSON Canvas 1.0 Specification](https://jsoncanvas.org/spec/1.0/).
  - Automatically arranges a central reference banner node connected with arrows to individual translation cards with preset color coding.
  - Saves generated boards to `OpenBible/comparisons` (configurable) and opens them immediately in a new workspace tab.
- **Excalidraw Integration (`obsidian-excalidraw-plugin`)**:
  - Leverages the official `ExcalidrawAutomate` workbench API to create visual study diagrams with translation cards, borders, and connecting arrows.
  - **Bound Text Containers**: Uses `ea.addText` with `{ box: "box" }` to automatically compute container height and wrap text cleanly without overflow or broken box layouts.
  - Detects plugin availability with friendly feedback notices and automated diagram opening.
- **Multiple Entry Points & Commands**:
  - Added `[Comparar]` button to the floating `VerseActionBar` on verse selection.
  - Added "Comparar versões" to the verse right-click context menu in the reader.
  - Added "Comparar versões" to the editor right-click context menu on scripture references.
  - Added "Comparar versões" to the Bible Reader pane menu (`...`).
  - Added command `open-bible-compare` ("Comparar versículos bíblicos" / "Compare Bible verses").
  - Added command `open-bible-compare-tab` ("Abrir comparação em nova aba" / "Open comparison in new tab").
  - Added command `open-bible-compare-split` ("Dividir tela com comparação de versões" / "Split editor with version comparison").

### Changed
- **Comparison Header & Context Menu Reorganization**:
  - **Clean Single-Line Toolbar**: Reorganized the top row into a balanced two-sided layout:
    - **Left**: Clickable passage reference selector (`[📖 Romanos 9:3-5 ▾]`).
    - **Right**:
      - **Copy Comparison** button (`[📋 Copiar comparação]`) with responsive label hiding on narrow viewports.
      - **Layout Tabs**: Icon-only segmented buttons (`[ ⊞ | ☰ ]`) with tooltips (`aria-label`) for columns and verse-by-verse modes.
      - **Context Menu (`...`)**: Native Obsidian popup `Menu` containing "Exportar para o Canvas" and "Exportar para o Excalidraw", removing visual clutter from the toolbar.
  - **Streamlined Versions Strip**: Shortened prompt to "Versões:" / "Versions:" to prevent horizontal wrapping and fixed double colons.
  - **Unified Single-Row Action Bar**: Both modal and workspace views share the same clean single-line header (`Referencia -------------------- Botoes`) with Copy, Layout Toggle, and Canvas/Excalidraw options, eliminating the redundant bottom footer.
  - **Modal Pop-Out Button Positioning**: Fixed button anchoring in the top right of the modal header adjacent to the close button.
  - **Native Modal Header**: Integrated the comparison title directly into Obsidian's native `modal-header` (`modal-title`).
  - **Seamless Modal Styling**: Configured `BibleCompareModal` with `padding: 0 !important` and removed the secondary background from `open-bible-compare-header` for a clean, modern aesthetic.

### Fixed
- **Modal Header "Open in Tab" Button Placement**: Fixed the placement of the "Open in tab" (`panel-top`) button in `BibleCompareModal` so it is anchored cleanly at the top-right corner next to Obsidian's native `.modal-close-button`, eliminating the bug where it was rendered at the bottom of the dialog.
- **Modal Close Button**: Removed redundant custom close button inside `BibleCompareApp.svelte` header to eliminate duplicate "X" buttons, seamlessly aligning the header actions alongside Obsidian's native `.modal-close-button`.


## [0.4.0] - 2026-09-17

### Added
- **Secondary Resource Panel & Workspace Views (Dual-Mode)**:
  - **Embedded Secondary Panel (`"reader"` mode)**: Integrated directly inside `BibleReader.svelte` to display rich resource details side-by-side with Bible verses, with a draggable splitter resizer and persistence across sessions.
  - **Dedicated Workspace View (`"workspace"` mode)**: Registered `open-bible-resource-detail-view` (`ResourceDetailView` + `ResourceDetailPanel.svelte`) allowing users to dock study resources anywhere in Obsidian's workspace (right sidebar, tabs, vertical/horizontal splits).
  - **Configurable Default Target**: Added **Settings → OpenBible → Study Resources → Abrir detalhes de recursos em** (`resourceOpenTarget`: `"reader"` [default] or `"workspace"`).
  - **Rich Detail Panel**: Displays hero banners, markdown note preview, occurrence counters, linked chapter passages, fast unlink/edit actions, and promotion to workspace leaf.
- **Resource Home Hub (Central de Recursos)**:
  - **Central catalog** of all resource notes (people, places, definitions, custom categories) across the entire vault (`ResourceHomePanel.svelte` / `ResourceHubView.ts`).
  - **Real-time search**: Instant filtering across resource titles, aliases, and folder paths.
  - **Filter chips with badges**: Filter by individual entity types with dynamic count badges.
  - **Sorting options**: Sort by total biblical citations, name (A-Z, Z-A), or recently modified date.
  - **Quick creation**: Integrated `+ Novo Recurso` modal (`CreateResourceModal.ts`) to create notes with pre-filled category frontmatter.
  - **Integrated navigation**: Seamlessly toggle between Home Hub (`"home"`) and Resource Details (`"detail"`), with a `Voltar à Central` back button.
  - **Workspace integration**: Registered view `open-bible-resource-hub-view`, ribbon/header actions, and commands (`commands.openResourceHub`, `commands.openResourceHubRightSidebar`, `commands.openResourceHubNewTab`).
- **Grouped Category View & Collapsible Accordions**:
  - **Layout toggle**: Switch between structured **Grouped View** (`layers`) and continuous **Flat Grid** (`layout-grid`).
  - **Dynamic category sections**: Groups resources into thematic sections (e.g. *Pessoas*, *Lugares*, *Definições*) with item counters and category add buttons.
  - **Collapsible accordions**: Each category group header is interactive, expanding or collapsing with a smooth rotating chevron animation.
  - **Global Collapse/Expand All**: Dedicated toolbar button to collapse or expand all category sections simultaneously.

### Changed
- **Reader Header Cleanup**: Removed redundant page header action buttons (`addAction`) from the Obsidian view tab header (`BibleReaderView`), keeping the view title bar clean and uncluttered. All actions (Selection Mode, Highlights, Resources, Resource Home Hub, Appearance, and Reading History) remain fully accessible inside the tab's more options menu (`...`), the bottom reader toolbar, and the command palette.

### Fixed
- **Editor Verse Preview Click Target & Caret Placement**: Fixed an issue where clicking in the empty space of a line after a Bible reference (e.g. `Mateus 10`) mistakenly triggered the Verse Preview Modal and blocked caret positioning. The editor extension now strictly verifies `event.target` and `DOMRect` boundaries of the reference decoration element (`.open-bible-verse-preview-link`) before intercepting click and hover events, allowing smooth caret positioning and uninterrupted writing.

## [0.3.3] - 2026-09-17

### Added
- **Study Resources System & Encyclopedic Previews**:
  - Introduced biblical study resources architecture with user-definable resource types (e.g., People, Places, Events) with customizable folder locations, Lucide icons, and theme accent colors.
  - Integrated resource links directly into Bible verse text with configurable display modes (icon marker, text underline, or both) and colorization.
  - Interactive resource clicking: click any underlined text or marker icon to open the redesigned encyclopedic preview card (`ResourcePreviewModal`) or chooser modal (`ResourceChooserModal`).
  - Support for `image`, `cover`, and `banner` metadata in resource frontmatter with automatic resolution of vault-relative files, wikilinks (`[[image.png]]`), and web URLs.
  - Dedicated study resources explorer view (`ResourcesView`) registered globally and per-resource-type in sidebar docks.
- **Multiple Bible Reader Panes and Split Views**:
  - Enabled native Obsidian pane navigation by setting `this.navigation = true` in `BibleReaderView`, allowing native "Split right", "Split down", "Open in new window", and drag-and-drop tab splitting.
  - Added commands: "Open reader in new tab" (`commands.openReaderNewTab`) and "Split reader (side-by-side)" (`commands.openReaderSplit`).
  - Added "Split reader (side-by-side)" and "Open reader in new tab" actions directly in the reader pane menu (`...`).
  - Added ribbon icon right-click context menu and modifier click (`Ctrl` / `Cmd` or middle-click) to open the reader in a new tab.
  - Updated `openOrRevealView` to support `"new-tab"` and `"split"` splits while automatically copying current passage state into newly opened tabs/splits, and reusing empty tabs.
  - Refactored `BibleTextService` to maintain a pool of open SQLite databases (`openDbs: Map<string, SqlDatabase>`) instead of a single active database, preventing SQLite database reload thrashing when reading multiple Bible versions side-by-side.
  - Updated `navigateToPassage` to prioritize the currently active reader leaf when multiple reader panes are open.
- **Word-Selection Right-Click Context Menu in Reader**:
  - Replaced the previous two-column layout toggle from the right-click context menu with three focused actions: "Create Note" (`contextMenu.createNote`), "Highlight" (`contextMenu.highlight`), and "Link Resources" (`contextMenu.linkResource`).
  - Clicking "Create Note" directly creates the note from the selection.
  - Clicking "Highlight" opens `HighlightPickerModal` with configured color options.
  - Clicking "Link Resources" opens `ResourceTypePickerModal` to choose the resource type before linking.
  - Added support for right-clicking directly on an unselected word in verse text to automatically detect and highlight the word under the cursor and open the context menu.
- **Resource Occurrence Scope Selection (This Occurrence vs All Occurrences)**:
  - Added an occurrence scope selector in `ResourceLinkModal` when linking a selected word or phrase: choose between "Only this occurrence" (`matchAllOccurrences: false`, default) and "All occurrences of this word" (`matchAllOccurrences: true`).
  - Updated `autoMatchesByVerse` so resource markers only propagate across the chapter when `matchAllOccurrences` is explicitly set to `true`, preventing unwanted markers on polysemous words (e.g. "céus" in Genesis 1:1 referring to the heavens vs later verses referring to the sky/firmament).
  - Added frontmatter persistence for `match_all_occurrences: true` in resource link notes and updated `ResourceService.detectLink` and `ResourceService.addOrUpdateLink`.
- **Redesigned Resource Preview Modal & Image Metadata Support**:
  - Added support for `image` (as well as `cover` and `banner`) in resource frontmatter with automatic resolution of vault relative paths, wikilinks (`[[image.png]]`), and external web URLs (`https://...`).
  - Redesigned `ResourcePreviewModal` with a modern encyclopedic card layout:
    - Panoramic hero image banner with smooth bottom gradient overlay and frosted glass close button.
    - Resource type pill badge with icon and custom theme color.
    - Clean, spacious typography for resource title and scrollable markdown content.
    - Dedicated linked passage context card displaying the scripture reference and quote snippet, with 1-click navigation to the passage in reader.
    - Refined 2-sided footer actions: unlink on the left, "View in chapter" and primary CTA "Open in editor" on the right.

### Fixed
- **Missing i18n Translation Key**:
  - Added missing `reader.selectionMode` translation key to `TranslationStrings`, `locales/pt.ts`, and `locales/en.ts`.
- **Study Resources Click on Underlined Verse Text**:
  - Made `.open-bible-resource-text` fully interactive: clicking underlined linked text now opens `ResourcePreviewModal` (single link) or `ResourceChooserModal` (multiple links), bringing parity with clicking marker icons (`.open-bible-resource-marker`).
  - Added support for `Ctrl/Cmd + Click` on underlined resource text to open the resource directly in the Obsidian editor.
  - Added accessibility roles (`role="button"`, `tabindex="0"`) and keyboard activation (`Enter` / `Space`).
  - Added `cursor: pointer` and subtle hover transitions to `.open-bible-resource-text` in `styles.css`.
  - Added mouse drag and text selection guards (`justCapturedTextRange`, `segment.isSelected`, and window selection checks) so selecting text across linked words for highlights or copying remains smooth without accidentally opening modals.
  - Declared `justCapturedTextRange` as `$state(false)` in `VersesView.svelte` and passed it down to `VerseRow.svelte`.

## [0.3.2] - 2026-09-15

### Added
- **"Open Scripture" Command (`open-bible:open-bible-passage`)**:
  - Added new command "Open Scripture" ("Abrir texto bíblico") to open the Passage Picker modal and navigate the reader view directly to the chosen book, chapter, or verse.
  - Added `openPassage` mode to `PassagePickerModal` and `PassagePickerApp` with `"Abrir no leitor"` ("Open in reader") action CTA button.

### Changed
- **Renamed Insert Scripture Command**:
  - Renamed `open-bible:insert-verse-at-cursor` to "Insert Scripture" ("Inserir texto bíblico"), removing the redundant "at cursor" ("no cursor") suffix to match the dialog header.
- **Removed Obsolete Text View Command**:
  - Removed legacy `open-open-bible` ("Abrir visão de texto" / "Open text view") command from the command palette.
- **Improved Stepper Navigation Wording**:
  - Updated breadcrumb and back button label to plural "Livros" ("Books") for consistent step navigation.

### Fixed
- **Search Icon Overlap in Passage Picker**:
  - Enclosed search input and magnifying glass icon inside `.open-bible-picker-search-wrap` using flexbox, preventing the icon from overlapping user search input text.
- **Duplicate Close Button in Passage Picker Modal**:
  - Removed redundant custom close button inside the modal content header, keeping only Obsidian's native `.modal-close-button`.
- **Confusing "Livro" Badge on Initial Picker Step**:
  - Only show the stepper breadcrumbs header when a book has already been selected (`step !== "books"`), removing the solitary "Livro" button floating above the tabs.
- **Auto-Reset Step on Search**:
  - Automatically resets to book view when the user begins typing in the search field while browsing chapters or verses.

## [0.3.0] - 2026-09-15

### Added
- **Scripture Quote Insertion via Context Menu**:
  - Added editor and reading view right-click context menu on Bible reference links to insert formatted Scripture blockquotes into notes.
  - Configurable insertion position in Settings: `"below"` (default) or `"above"` the current paragraph/block (`verseInsertPosition`).
  - Added corner action menu (`more-vertical`) in `VersePreviewModal` with options to insert into active note (below/above), create a Bible note, or copy formatted quote.
- **Commands to Insert Scripture and Create Notes**:
  - `open-bible:insert-verse-at-cursor` ("Insert Scripture at cursor"): Opens the Passage Picker and inserts the formatted blockquote at the active editor caret.
  - `open-bible:create-bible-note` ("Create Bible note"): Opens the Passage Picker from anywhere in Obsidian, allowing selection of book, chapter, verses, and note category, creating a vault-native note with YAML frontmatter in `OpenBible/notes`.
  - Unified `PassagePickerModal`: Fast smart search with real-time reference parsing, verse preview, category pills, and multi-step (Book → Chapter → Verses) visual picker.
- **Smart Book & Reference Search in BookPicker**:
  - Typing references directly into the BookPicker search bar (e.g. `Gn 10`, `Sl 23`, `Jo 3:16`, `Mateus 10`) keeps the book in the filtered list and highlights the target book tile (`.is-reference-target`).
  - Displays a recognized reference badge banner with keyboard shortcut hint (`Enter` to open).
  - Pressing `Enter` or clicking the highlighted book tile navigates directly to the detected chapter.

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
  - Rendered prominent active visual highlight (`mark.open-bible-selected-text-range`) on selected words/phrases in the reader, replacing the full-verse bounding box with targeted text selection feedback.
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
