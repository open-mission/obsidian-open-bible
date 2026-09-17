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
│   └── verse-previews.md          # Scripture reference auto-detection & previews
├── src/
│   ├── main.ts                    # Plugin entry point & lifecycle registration
│   ├── BibleReaderView.ts         # Obsidian ItemView wrapper for the Svelte reader
│   ├── HighlightsView.ts          # Highlights browser workspace view
│   ├── ResourcesView.ts           # General and per-type resources list view
│   ├── ResourceDetailView.ts      # Dedicated study resource secondary workspace view
│   ├── OpenBibleView.ts           # Secondary view wrapper
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

### Chapter Transitions & Navigation Motion
- Implements hardware-accelerated directional transitions (`transform: translateX` and `opacity`) when switching chapters.
- Svelte 5 `{#key `${book.id}-${chapter}`}` isolates the chapter DOM lifecycle, avoiding double-mounted chapters and scroll jumps.
- Supports three directional states:
  - `next`: smooth slide-in from right (`translateX(20px)` → `0`)
  - `prev`: smooth slide-in from left (`translateX(-20px)` → `0`)
  - `jump`: gentle fade and slide-up (`translateY(10px)` → `0`) for book/chapter picker selections or verse searches.
- Full accessibility compliance with `@media (prefers-reduced-motion: reduce)`.


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

---

## 4. Internationalization (i18n)

UI copy is strictly decoupled from components:
- Access via `t("section.key", { placeholder: "value" })`.
- Fully reactive: when the language changes in settings, all active Svelte components re-render immediately.
- Supported languages:
  - `en` (English - default)
  - `pt` (Portuguese)
  - `auto` (follows Obsidian's interface language setting)

