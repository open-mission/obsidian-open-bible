# Verse Previews in Notes

OpenBible automatically scans and detects Scripture references in your Markdown notes as you type in the editor (Live Preview and Source mode) and when viewing rendered Markdown notes (Reading view).

---

## 1. Overview & User Experience

- **Automatic Reference Detection**:
  As soon as you type a Bible reference (e.g. `João 3:16`, `Mateus 10`, `Sl 23`, `Sl 23:1-3`, `Rm 8:28 NVT`, `1 Coríntios 13:4 ARA`), OpenBible identifies it in real time and styles it with a subtle dotted underline (`.open-bible-verse-preview-link`). Both chapter references (e.g. `Mateus 10`) and verse ranges (e.g. `Mateus 10.1` or `Mateus 10:1-5`) are detected seamlessly.
  References inside code blocks, YAML frontmatter, markdown links (`[[...]]` or `[...]`), URLs, and HTML tags are safely ignored.

- **Preview on Hover with Configurable Modifier Key**:
  Positioning the mouse cursor over the underlined reference while holding the configured modifier key (default: `Shift`, with options for `Ctrl / Cmd`, `Alt / Option`, or `None / hover only`) immediately renders an unobtrusive floating tooltip (`.open-bible-verse-hover-popover`) containing the reference title, Bible version abbreviation, and formatted verses. If you already have the cursor over the reference, pressing the modifier key reveals the preview instantly. Releasing the modifier hides the tooltip.

- **Preview on Click**:
  Clicking directly on the underlined reference opens the **Verse Preview Modal** (or drawer on mobile), providing full scripture text, previous/next chapter navigation, a single-click "Copy" action (formatted with quotes and reference), and an "Open in Reader" button to jump directly to the passage in the Bible reader.

- **Obsidian Native Design Standards**:
  Settings utilize native Obsidian `.checkbox-container` toggle switches with smooth animation and accent theming, matching the official Obsidian settings UI.

---

## 2. Configuration & Granular Toggles

Users can configure these options under **Settings → OpenBible → Study Resources**:

| Setting Key | Label | Default | Description |
|---|---|---|---|
| `enableVersePreviews` | Ativar preview de referências bíblicas | `true` | Master toggle to enable or disable reference detection and underlining in notes. |
| `enableVerseHoverPreview` | Preview ao passar o mouse | `true` | Enables/disables the floating tooltip when hovering over references. |
| `verseHoverModifier` | Tecla modificadora para preview | `"shift"` | Modifier key required to show hover preview: `Shift` (Default), `Ctrl / Cmd`, `Alt / Option`, or `None` (hover directly). |
| `enableVerseClickPreview` | Preview ao clicar | `true` | Enables/disables opening the full Verse Preview Modal upon clicking the reference. |
| `previewDefaultVersion` | Versão padrão para preview | `""` (Follow Reader) | Sets a specific installed Bible version to be used for previews, or follows the reader's primary version. |

---

## 3. Technical Architecture

### CodeMirror 6 ViewPlugin (`src/editor/VerseReferenceEditorExtension.ts`)
- Uses `@codemirror/view` (`ViewPlugin`, `Decoration.mark`, `RangeSetBuilder`) and `@codemirror/language` (`syntaxTree`).
- Scans `view.visibleRanges` for optimal performance with large documents.
- Dispatches decorations dynamically on `update.docChanged` and `update.viewportChanged`.
- Handles `mousemove`, `mouseleave`, `keydown`, `keyup`, and `mousedown` events directly within CodeMirror.
- Validates modifier keys (`Shift`, `Control`, `Meta`, `Alt`) dynamically based on user settings.
- Tracks `currentMousePos` and `activeHoverKey` to provide responsive hover transitions with debounce and memory leak prevention.

### Markdown Post Processor (`src/services/MarkdownVerseProcessor.ts`)
- Registered via `plugin.registerMarkdownPostProcessor`.
- Uses `TreeWalker` to safely replace text nodes with interactive `<a>` tags without altering existing DOM structures, code blocks, or links.
- Employs matching mouse event listeners and modifier key detection.

### UI Kit Toggle Component (`src/ui/kit/Toggle.svelte`)
- Uses Obsidian's official `ToggleComponent` class, ensuring 100% theme compatibility, standard `.checkbox-container` layout, keyboard accessibility, and native switch animations.
- Backed by reactive `$state` proxy in `SettingsApp.svelte` so toggling settings immediately updates the UI and reveals or hides dependent sub-settings without page reloads.

### Verse Reference Parser (`src/services/VerseReferenceParser.ts`)
- `findAllReferencesInText(text)`: Scans strings with `VERSE_REF_REGEX`, validating canonical books, chapter counts, and optional translation suffixes (`NVT`, `ARA`, `NVI`, `ESV`, etc.).
- `findReferenceAtPosition(text, pos)`: Fast index-based coordinate lookup for caret or cursor positions.

### Floating Tooltip Component (`src/ui/components/VerseHoverTooltip.ts`)
- Dynamically attaches to `document.body` and computes viewport collisions to stay within screen margins.
- Keeps tooltip active when moving the cursor directly into the tooltip content.
