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
├── src/
│   ├── main.ts                    # Plugin entry point & lifecycle registration
│   ├── BibleReaderView.ts         # Obsidian ItemView wrapper for the Svelte reader
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
│   ├── i18n/                      # Reactive localization system (EN & PT)
│   │   ├── index.ts               # Public barrel (t, setLocale, getLocale)
│   │   ├── store.svelte.ts        # Runes-based locale store
│   │   ├── types.ts               # TypeScript translation schema
│   │   └── locales/               # en.ts & pt.ts dictionaries
│   ├── models/                    # Data models (bible.ts, bibleVersion.ts)
│   ├── services/
│   │   ├── bibleTextService.ts    # Chapter, verse, and search SQL queries
│   │   ├── bibleVersionService.ts # Detection, import, and registry of SQLite DBs
│   │   ├── CrossReferenceService.ts # Thomson cross-reference lookups
│   │   ├── VersePreviewService.ts # Preview orchestration
│   │   └── VerseReferenceParser.ts# Scripture reference string parser
│   ├── ui/                        # User interface
│   │   ├── actions/               # Svelte actions (portal, icon)
│   │   ├── core/                  # Core primitives (EmptyState, LoadingState, icons)
│   │   ├── kit/                   # UI Kit (buttons, search, drawers, modals)
│   │   ├── modals/                # Obsidian Modal dialogs (VersePreviewModal)
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


---

## 4. Internationalization (i18n)

UI copy is strictly decoupled from components:
- Access via `t("section.key", { placeholder: "value" })`.
- Fully reactive: when the language changes in settings, all active Svelte components re-render immediately.
- Supported languages:
  - `en` (English - default)
  - `pt` (Portuguese)
  - `auto` (follows Obsidian's interface language setting)
