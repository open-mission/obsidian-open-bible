# Notes and Highlights

OpenBible includes a complete Bible study note-taking and highlighting system directly integrated into the Scripture reader.

---

## 1. Overview & User Experience

- **Markdown & Vault-Native Storage**:
  Both highlights and Bible notes are saved as standard Markdown files (`.md`) in your Obsidian vault with structured YAML frontmatter. This guarantees full data ownership, interoperability with Dataview, Obsidian search, and future plugins.
  
- **Configurable Storage Folders**:
  - Notes default folder: `OpenBible/notes`
  - Highlights default folder: `OpenBible/highlights`
  - Both folder paths can be changed to any vault folder via plugin settings (**Settings → OpenBible → Notes & Highlights**).

- **Visual Indicators in Reader**:
  - **Highlights**: Rendered as colored underlines (`.open-bible-hl-line`) directly on the scripture text. When specific words or phrases are selected, only the targeted range receives the underline.
  - **Notes**: Rendered as colored vertical indicator lines (`.open-bible-verse-note-line`) in the gutter to the left of the verse text. Multi-verse notes connect smoothly across consecutive verses. Hovering any segment of a multi-verse indicator highlights the entire vertical line synchronously across all spanned verses. Clicking a note indicator opens the note preview modal or editor, while holding `Ctrl` / `Cmd` triggers Obsidian's native hover preview tooltip.

- **Selection System & Mobile Selection Mode**:
  - **Verse Number Selection**: In standard reading mode, clicking the verse number (e.g. `5`) selects the entire verse (clicking it again deselects it). Holding `Shift` while clicking another verse number selects the contiguous range between the anchor and target verse. The verse number features a hover pill indicator with tooltip guidance.
  - **Natural Word & Phrase Text Selection**: The verse text has a dedicated text cursor (`cursor: text`) and free selection (`user-select: text`). Users can double-click words (e.g. "SENHOR") or drag across phrases (e.g. "torre que estavam construindo") without triggering whole-verse selection or premature popovers.
  - **Active Selection Visual Highlight**: When words or phrases are selected, the targeted text is rendered with an active accent highlight (`mark.open-bible-selected-text-range`) with a subtle glow, clearly indicating the exact range that will receive the highlight or note. The verse container receives a subtle accent indicator instead of the full-verse selection box.
  - **Visual Feedback**: Selected verses display a distinct accent background tint (`var(--background-modifier-hover)` / primary tint), an accent border indicator (`1.5px solid var(--interactive-accent)`), and an accent-highlighted verse number.
  - **Selection Mode Toggle**: A dedicated toggle button (`check-square`) in the reader toolbar, page header action, and command palette (`toggle-selection-mode`) activates explicit checkboxes on the left side of every verse row, making multi-verse selection effortless on mobile touch devices. When selection mode is active, clicking anywhere on the row toggles the verse checkbox.

- **Highlights Panel (Drawer)**:
  - Accessible from the reader toolbar (`highlighter` button), view header action, and command palette (`open-bible-highlights`).
  - Lists all highlights across the vault ordered by last modification date.
  - Full-text search filtering through highlight text snippets and reference names.
  - Color filter chips to filter highlights by color/category.
  - One-click navigation to the passage and verse in the reader.
  - Quick action to open the highlight note in Obsidian's markdown editor.
  - Quick action to delete the highlight with confirmation.

- **Interactive Verse Action Bar (Popover)**:
  Selecting a verse, a range of verses (via `Shift + Click`), or dragging the cursor across a word/phrase automatically opens the floating Verse Action Bar without unwanted page auto-scrolling:
  - **Reference Badge**: Displays the current passage and verse range (or selected phrase snippet).
  - **Highlights**: Quick palette of custom-configured highlight colors and labels. On mobile, opens a bottom drawer with color swatches and descriptive labels.
  - **Copy Reference**: Copies the reference string (e.g., `Gálatas 6:1-2`).
  - **Copy Text**: Copies the verse text (or selected word/phrase) formatted as Scripture quotation.
  - **Create Note**: Creates a new note file pre-populated with scripture quotation and reflection section, then opens it in a new editor tab.

---

## 2. YAML Frontmatter Specification

### Bible Note (`type: note`)

```yaml
---
type: note
title: "Gálatas 6:1"
book: Gálatas
chapter: 6
verses: "1"
bible_version: ARA
color: yellow
highlight_label: "Promessa"
reference: "Gálatas 6:1"
created: "2026-09-15 13:00"
tags:
  - bible-note
---
```

When a specific word or phrase was selected at the time of creation, the frontmatter also records character offsets:

```yaml
char_start: 12
char_end: 28
selected_text: "carreguem os fardos"
```

### Bible Highlight (`type: highlight`)

```yaml
---
type: highlight
book: Gálatas
chapter: 6
verses: "1"
bible_version: ARA
color: yellow
highlight_label: "Promessa"
reference: "Gálatas 6:1"
created: "2026-09-15 13:00"
tags:
  - bible-highlight
---
```

When highlighting a specific word or phrase:

```yaml
char_start: 0
char_end: 6
selected_text: "Irmãos"
```

---

## 3. Configuration & Custom Highlights and Notes

Under **Settings → OpenBible → Notes & Highlights**, users can:

1. **Change Notes Folder**: Set any custom folder path for study notes (default `OpenBible/notes`).
2. **Change Highlights Folder**: Set any custom folder path for highlight files (default `OpenBible/highlights`).
3. **Confirm Highlight Deletion**: Toggle confirmation dialogs when removing highlights.
4. **Customize Highlight Palette**:
   - Add new custom highlights with a native color picker.
   - Assign custom labels to colors (e.g., green for *Tithing/Dízimo*, yellow for *Promise*, blue for *Prayer*).
   - Edit labels and colors at any time.
   - Reset palette to default colors (`yellow`, `green`, `blue`, `purple`, `pink`, `orange`).
5. **Customize Note Categories & Colors**:
   - Add new custom note categories with associated colors and labels (default: "Geral", "Devocional", "Estudo", "Teologia", "Aplicação", "Contexto").
   - Configure colors via the color picker and change labels directly.
   - When clicking **Criar Nota** in the verse action bar, an Obsidian menu lets users choose the specific note category, automatically saving `color` and `highlight_label` into the note frontmatter for easy grouping and filtering.
   - Reset categories to defaults anytime.

---

## 4. Architecture & Technical Design

- **`NoteService` (`src/services/NoteService.ts`)**:
  Manages note file creation, frontmatter generation, safe filename sanitization, note discovery via Obsidian's `MetadataCache`, and frontmatter extraction.

- **`HighlightService` (`src/services/HighlightService.ts`)**:
  Handles highlight note file creation, updates, and removals (`FileManager.processFrontMatter`, `FileManager.trashFile`). Maintains live subscriptions to vault events (`create`, `delete`, `rename`, `metadataCache.on("changed")`).

- **`noteLanes` (`src/ui/reader/noteLanes.ts`)**:
  Calculates non-overlapping parallel vertical indicator lanes for notes spanning single or multi-verse intervals.

- **`textRangeSelection` & `textSegmentation` (`src/ui/reader/`)**:
  Captures character start/end coordinates from DOM text selection within verse containers, and segments text for word-level underline rendering and range bookmark markers.

- **`VerseActionBar` (`src/ui/components/VerseActionBar.svelte`)**:
  Provides a floating action bar on desktop and a docked bottom bar on mobile devices (elevated with 80px + safe area offset to sit safely above Obsidian's mobile navigation bar).

- **`HighlightsDrawer` (`src/ui/reader/components/HighlightsDrawer.svelte`)**:
  Mobile drawer modal providing touch-friendly access to all configured highlights, labels, and actions.

- **`HighlightsView` (`src/HighlightsView.ts`)**:
  Dedicated Obsidian `ItemView` (`open-bible-highlights-view`) capable of being placed in the right or left sidebar or as a tab. Provides permanent access to search, label filtering, and passage navigation alongside notes.

---

## 5. Selection Mode & Visual Highlights Separation

- **Clean Checkbox Selection**:
  When Selection Mode is enabled, existing note vertical indicators and text highlight underlines are temporarily hidden, allowing users to select verses cleanly without checkbox overlap. Upon exiting selection mode, all highlights and note lines are automatically restored.

- **Distinct Selected Verse Border**:
  Selected verses display a complete 1.5px accent border (`var(--interactive-accent)`) with rounded corners (`var(--radius-s)`) and subtle glow, ensuring high contrast and immediate visibility even beside note lanes in the gutter.
