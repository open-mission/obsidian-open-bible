# OpenBible Architecture

This document describes the design, directory structure, data layer, UI architecture, and technical patterns used across the **OpenBible** Obsidian plugin.

---

## 1. System Overview

OpenBible is engineered to be **100% offline-first**, running inside Obsidian's desktop and mobile environments. It combines Obsidian's native TypeScript API with a modern **Svelte 5** reactive interface and a WebAssembly-compiled **SQLite** database engine.

```
┌─────────────────────────────────────────────────────────────┐
│                       Obsidian Core                         │
│  (Vault, Workspace, Leaves, Command Palette, Settings)      │
└───────────────▲─────────────────────────────▲───────────────┘
                │                             │
    ┌───────────┴───────────┐     ┌───────────┴───────────┐
    │    OpenBiblePlugin    │     │   Obsidian Adapters   │
    │     (src/main.ts)     │     │     (Files/Vault)     │
    └───────────┬───────────┘     └───────────┬───────────┘
                │                             │
  ┌─────────────┼─────────────────────────────┼─────────────┐
  │ Services    ▼                             ▼             │
  │  • BibleVersionService  ──▶ Scans SQLite DBs in Vault   │
  │  • BibleTextService     ──▶ Executes SQL queries (Wasm) │
  │  • BibleComparisonService──▶ Text comparison & Canvas   │
  │  • CrossReferenceService──▶ Binary Thompson references  │
  │  • VersePreviewService  ──▶ Modals and passage preview  │
  └─────────────┬───────────────────────────────────────────┘
                │
  ┌─────────────▼───────────────────────────────────────────┐
  │ UI Layer (Svelte 5 with Runes)                          │
  │  • BibleReaderView (ItemView leaf)                      │
  │  • BibleReader (Main reading UI, 1 or 2 columns)        │
  │  • ResourceDetailPanel (Secondary Study Panel)          │
  │  • BookPicker (Fuzzy book/chapter navigation)           │
  │  • CrossRefBottomPanel (Backlinks-style references)     │
  │  • OpenBibleGuideApp (Searchable capability catalog)    │
  │  • SettingsApp (Hierarchical multi-page settings)       │
  └─────────────────────────────────────────────────────────┘
```

---

## 2. Directory Structure

```text
obsidian-open-bible/
├── .github/
│   └── workflows/
│       ├── ci.yml                 # PR & push check (svelte-check + build)
│       └── release.yml            # Automated GitHub releases with attestations
├── docs/                          # Developer & architecture documentation
│   ├── ARCHITECTURE.md            # System architecture and directory map
│   ├── guided-command-center.md   # Capability catalog and executable discovery surface
│   ├── text-comparison.md         # Multi-version comparison, Canvas & Excalidraw exports
│   └── verse-previews.md          # Scripture reference auto-detection & previews
├── src/
│   ├── main.ts                    # Plugin entry point & lifecycle registration
│   ├── BibleReaderView.ts         # Obsidian ItemView wrapper for the Svelte reader
│   ├── HighlightsView.ts          # Highlights browser workspace view
│   ├── ResourcesView.ts           # General and per-type resources list view
│   ├── ResourceDetailView.ts      # Dedicated study resource secondary workspace view
│   ├── OpenBibleView.ts           # Guided command center ItemView wrapper
│   ├── bibleCanon.ts              # Canonical book metadata (testaments, chapters, verses)
│   ├── constants.ts               # Shared constants, book abbreviation mappings, paths
│   ├── settings.ts                # Settings interface & defaults
│   ├── core/                      # Low-level helpers (paths, sqlite, confirm)
│   ├── data/
│   │   ├── sqlEngine.ts           # SQLite query runner via sql.js
│   │   ├── sqlWasm.ts             # Embedded WebAssembly binary provider
│   │   ├── crossRefModel.ts       # Cross-reference data structures
│   │   ├── crossRefsBytes.ts      # Binary cross-reference decoder
│   │   └── generated/             # Precompiled binary data (cross-refs.bin)
│   ├── editor/                    # CodeMirror 6 editor extensions
│   │   └── VerseReferenceEditorExtension.ts # Live preview detection, underlines & hover/click
│   ├── i18n/                      # Reactive localization system (EN & PT)
│   │   ├── index.ts               # Public barrel (t, setLocale, getLocale)
│   │   ├── store.svelte.ts        # Runes-based locale store
│   │   ├── types.ts               # TypeScript translation schema
│   │   └── locales/               # en.ts & pt.ts dictionaries
│   ├── models/                    # Data models (bible.ts, bibleVersion.ts)
│   ├── services/
│   │   ├── bibleTextService.ts    # Chapter, verse, and search SQL queries
│   │   ├── bibleVersionService.ts # Detection, import, and registry of SQLite DBs
│   │   ├── versionMetadata.ts     # Markdown frontmatter properties parser & serializer (.md notes)
│   │   ├── CrossReferenceService.ts # Thomson cross-reference lookups
│   │   ├── MarkdownVerseProcessor.ts # Reading view reference post-processor
│   │   ├── VersePreviewService.ts # Preview orchestration & DB resolution
│   │   └── VerseReferenceParser.ts# Scripture reference string parser
│   ├── ui/                        # User interface
│   │   ├── actions/               # Svelte actions (portal, icon)
│   │   ├── components/            # UI components (VerseHoverTooltip)
│   │   ├── core/                  # Core primitives (EmptyState, LoadingState, icons)
│   │   ├── kit/                   # UI Kit (buttons, search, drawers, modals)
│   │   ├── guide/                 # Typed capability catalog, search, and action routing
│   │   ├── modals/                # Obsidian Modal dialogs (VersePreviewModal, EditVersionModal)
│   │   ├── reader/                # Bible Reader component tree
│   │   └── settings/              # Plugin settings pages & subpages
│   └── workspace/                 # Workspace leaf split and reveal utilities
├── styles.css                     # Stylesheet utilizing Obsidian CSS variables
├── manifest.json                  # Obsidian plugin manifest
├── package.json                   # Build scripts and dependencies
├── version-bump.mjs               # Script to sync versions across JSON files
└── versions.json                  # Obsidian version compatibility map
```

---

## 3. Core Technologies & Patterns

### Svelte 5 with Runes
The UI is constructed using **Svelte 5 runes**:
- `$state()`: Local component state (e.g., active verse, search queries, drawer toggles).
- `$derived()`: Pure computations (e.g., filtered book lists, formatted references, dynamic i18n strings).
- `$effect()`: Lifecycle hooks and DOM synchronization (e.g., scrolling to active verse, title sync).
- `$bindable()`: Two-way binding for reusable components (e.g., `SearchField`).

### WebAssembly SQLite (`sql.js`)
- Standard SQLite engine compiled to WebAssembly.
- The WASM binary (`sql-wasm-browser.wasm`) is bundled directly via esbuild's `binary` loader, ensuring zero network calls and full compatibility on desktop and mobile.
- Operates directly on `ArrayBuffer` data read from the vault adapter.

### Binary Cross-Reference Store
- Cross-reference datasets contain hundreds of thousands of connections.
- Rather than shipping heavy JSON or bulky SQL files, Thompson cross-references are encoded into a compact binary representation (`cross-refs.bin`).
- Fast random-access decoding via `crossRefsBytes.ts` keeps startup time under 100ms and memory footprint minimal.

### Workspace & Leaf Management
- The reader view is registered via `this.registerView(BIBLE_READER_VIEW_TYPE, (leaf) => new BibleReaderView(leaf, this))`.
- Views can be opened as main workspace tabs, or docked into the right or left sidebars.
- Layout preferences (single column vs. two-column, text width, verse spacing) are scoped reactively.

### Guided Command Center
- `OpenBibleView` preserves the historical `open-bible-view` type and mounts `OpenBibleGuideApp.svelte` for compatibility with persisted workspace leaves.
- `capabilityCatalog.ts` defines 35 real capabilities, six task families, 38 safe action IDs, contexts, requirements, bilingual keywords, related entries, and localized PT/EN copy.
- The plugin resolves actions through existing public methods. Reader actions reveal or create a reader first; settings actions open the exact `OpenBibleSettingTab` section.
- Database presence is checked on mount and window focus; no-version background refreshes keep the setup state stable, while active-leaf and layout events re-derive editor availability.
- The surface never bypasses existing confirmations for destructive operations. Detail navigation focuses the selected heading and restores the source row's focus and scroll on Back.
- Search is accent-insensitive, context-filterable, and deterministically ranked by title, keywords, summary, and detail.
- The Center stays on the incumbent Obsidian visual system: native variables, existing UI kit primitives, Lucide icons, one-pixel separators, restrained accents, and responsive/reduced-motion rules.
- See [`guided-command-center.md`](guided-command-center.md) for the complete extension and state model.

### Chapter Transitions & Navigation Motion
- Implements hardware-accelerated directional transitions (`transform: translateX` and `opacity`) when switching chapters.
- Svelte 5 `{#key `${book.id}-${chapter}`}` isolates the chapter DOM lifecycle, avoiding double-mounted chapters and scroll jumps.
- Supports three directional states:
  - `next`: smooth slide-in from right (`translateX(20px)` → `0`)
  - `prev`: smooth slide-in from left (`translateX(-20px)` → `0`)
  - `jump`: gentle fade and slide-up (`translateY(10px)` → `0`) for book/chapter picker selections or verse searches.
- Full accessibility compliance with `@media (prefers-reduced-motion: reduce)`.

### Continuous Reading Flow & Chapter Navigation
- **Sticky Reader Toolbar**: The top navigation pill bar (`.open-bible-reader-toolbar`) is positioned sticky with `backdrop-filter: blur(8px)` and elevation shadow, keeping book, chapter, and version selectors readily accessible while scrolling through lengthy passages.
- **Chapter Bottom Navigation**: At the conclusion of each chapter, an integrated footer bar (`.open-bible-reader-bottom-nav`) provides previous and next chapter buttons, target chapter labels, and total chapter counters (e.g. `1 / 50`). This allows unbroken, continuous reading without needing to manually scroll back to the top of the pane.
- **Layout Performance**: Content containers operate with zero-layout-transition overhead to prevent forced browser reflows during responsive window resizing.


### Bible Version Management & Markdown Properties Notes
- **Physical SQLite Integrity**: User-imported SQLite files (`.sqlite`, `.db`, `.sqlite3`) are stored in the configured versions folder (e.g. `OpenBible/versions/`).
- **Markdown Properties Notes (`.md`)**:
  - For every installed Bible version, a corresponding markdown file is created in the versions folder (e.g. `ACF.md` alongside `ACF.sqlite`).
  - Standard Obsidian YAML frontmatter properties define the metadata:
    ```yaml
    ---
    name: Almeida Corrigida Fiel
    abbreviation: ACF
    file: ACF.sqlite
    language: pt
    default: false
    ---
    ```
  - **Bidirectional Synchronization**:
    - Users can view and edit properties directly in Obsidian using the native **Properties** view or markdown editor.
    - Obsidian vault events (`modify`, `delete`) keep `BibleVersionService` in sync in real time without restarting the plugin.
    - Editing through the plugin UI (`EditVersionModal` or star button) updates the `.md` file while preserving user notes and extra custom properties.
- **Primary / Default Version**: Configured through `settings.defaultVersionPath` and the `default: true` property in the `.md` note. The default version is highlighted across the UI and automatically utilized by:
  - **Bible Reader**: Loads as the initial version on startup if no specific previous state exists.
  - **Verse Preview & Citations**: Used by `VersePreviewService` whenever references do not declare an explicit translation.
- **Search & Filtering**: Real-time filtering in both Settings and the Reader's Version Picker drawer matches normalized search queries against version name, abbreviation, language, and file path.
- **Clean Removal**: Deleting a version safely removes both the SQLite binary file and the associated `.md` metadata note.

### Study Resources, Secondary Panel & Home Hub
- **Entity & Link Storage**:
  - `type: resource`: Markdown notes representing people, places, and study concepts.
  - `type: resource-link`: Markdown notes binding verse ranges or specific text spans (`char_start`/`char_end`) to resources.
- **Dual Presentation**:
  - **Embedded Secondary Panel**: Integrated into `BibleReader.svelte` beside scripture text with a draggable divider (`.open-bible-split-resizer`). Supports dual internal modes:
    - `"home"`: Renders `ResourceHomePanel.svelte` (the catalog Hub with search, type filter chips, occurrence badges, and sorting).
    - `"detail"`: Renders `ResourceDetailPanel.svelte` (the encyclopedic detail view with rendered markdown and biblical occurrences). Provides a 1-click **Back to Hub** button.
  - **Standalone Workspace Views**:
    - `ResourceHubView` (`open-bible-resource-hub-view`): Dedicated workspace leaf hosting the Resource Home Hub.
    - `ResourceDetailView` (`open-bible-resource-detail-view`): Dedicated workspace leaf hosting resource details.
- **Single-Pass Occurrence Optimization**: `ResourceService.getResourceStats()` computes occurrence mappings in $O(N)$ time across all resource notes, preventing multi-query disk bottlenecks.

### Reader Appearance & Navigation Pickers
- **Appearance Controls**:
  - `AppearancePanel.svelte` provides quick in-reader configuration for container width, verse spacing, line spacing, two-column mode, Thompson cross-references layout, and bottom panel layout.
  - Replaced native OS select dropdowns with tactile segmented pill groups via `SegmentedControl.svelte` (`role="radiogroup"`, `role="radio"`, `aria-checked`).
  - Mirrors identical options in settings (`ReaderSection.svelte`), ensuring a seamless transition between settings and quick reading view tweaks.
- **Passage Navigation Pickers**:
  - `BookPicker.svelte`: Real-time fuzzy search, testament tabs (`All`, `OT`, `NT`) with ARIA tablist semantics, and instant reference parsing badge to jump straight to chapter and verse.
  - `ChapterPicker.svelte`: Compact numeric grid with `aria-current` tracking and distinct active indicator for the current chapter.
  - `VersionPicker.svelte`: Searchable installed translations grid with abbreviation pill badges, default version highlight, and active version checkmarks.
  - `PassagePickerApp.svelte`: 3-step visual picker and instant reference search modal supporting insertion, note creation, and passage navigation.
- **Accessibility & Craft Standards**:
  - Complete `:focus-visible` dual-ring focus outline across all tiles (`.open-bible-book-tile`, `.open-bible-chapter-tile`, `.open-bible-version-tile`, `.open-bible-segmented-item`, `.open-bible-picker-tab`).
  - Responsive layout adapts from desktop popovers to mobile bottom sheet drawers with safe-area insets.
  - Zero hardcoded localized strings; fully connected through `t()` with comprehensive keys in `en` and `pt`.

---

## 4. Internationalization (i18n)

UI copy is strictly decoupled from components:
- Access via `t("section.key", { placeholder: "value" })`.
- Fully reactive: when the language changes in settings, all active Svelte components re-render immediately.
- Supported languages:
  - `en` (English - default)
  - `pt` (Portuguese)
  - `auto` (follows Obsidian's interface language setting)


