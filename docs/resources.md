# Study Resources (Verse Links)

Complementary resources linked from verses — people, places and any custom type.

## 1. Overview & User Experience

- **Selection flow**: selecting a verse, a verse range (`Shift + Click`), a word/phrase snippet, or right-clicking directly on a word in reader text opens the contextual options (via the Verse Action Bar or the right-click context menu). The **Link resource** action shows a menu with the configured resource types.
- **Link or create**: picking a type opens `ResourceLinkModal`, listing existing resources in that type folder with search. Users can link an existing one or type a name and **Create and link**. When linking a selected word or phrase, users can choose between **Only this occurrence** (default) and **All occurrences of this word**.
- **Reader markers**: links bound to a word/phrase (`char_start`/`char_end`) render the type icon inline right after the selected trecho (same anchor logic as highlight range markers, via shared text segmentation); whole-verse links render the icon at the end of the verse (`.open-bible-resource-marker`), using the type icon and color (defaults: `user` for people, `map-pin` for places).
- **Click behavior**: clicking a marker icon (`.open-bible-resource-marker`) or underlined linked text (`.open-bible-resource-text`) holding a single link opens `ResourcePreviewModal` directly; an anchor or text with multiple links opens `ResourceChooserModal` listing the linked items (open preview or unlink per row). `Ctrl/Cmd + Click` on a single link opens the resource directly in the Obsidian editor. Keyboard activation (`Enter` / `Space`) is supported with proper accessibility roles (`role="button"`, `tabindex="0"`). Text selection/drag is protected so highlighting words across resources remains smooth.
- **Auto-match scope**: when a resource link has `match_all_occurrences: true`, it renders markers/underlines on every whole-word, case-insensitive occurrence of the linked text across the chapter (`autoMatchesByVerse` in `VersesView.svelte`). If `match_all_occurrences` is false or omitted (default), the resource link remains strictly attached to the exact verse and character range where it was created, avoiding unwanted propagation on polysemous terms (e.g. "céus" in Genesis 1:1 vs subsequent verses).
- **Hover preview**: holding the configured modifier (default `Shift`) and hovering a marker or a linked/underline word fires Obsidian's native `hover-link` preview for the resource file. The modifier is configurable (`resourceHoverModifier`: shift / ctrlCmd / alt / none).
- **Display style** (`resourceDisplayStyle`): `icon` (marker only), `underline` (underline on the linked text in the type color), or `both`.
- **Colorize** (`resourceColorize`, default on): paints the linked word text and the marker icon with the resource type color; the underline always uses the type color.
- **Preview modal**: `ResourcePreviewModal` provides a professional encyclopedic card with:
  - Featured hero banner (if `image` metadata is set in frontmatter — supports vault relative paths, wikilinks `[[image.png]]`, or external `https://` URLs).
  - Resource type pill badge with icon and custom type color.
  - Large title and scrollable markdown content.
  - Contextual linked passage card with quote snippet and 1-click navigation to passage.
  - Hierarchical actions: primary CTA to open in editor, secondary action to view in chapter, and unlink option.

## 2. Storage (mirrors highlights)

### Resource file (`type: resource`)

```yaml
---
type: resource
resource_type: person
resource_name: "Moisés"
title: "Moisés"
image: "attachments/moises.jpg" # supports vault paths, [[wikilinks.png]], or https:// web URLs
created: "2026-09-15 13:00"
tags:
  - bible-resource
  - bible-resource-person
---
```

### Verse link file (`type: resource-link`)

One `.md` per binding, stored in `<type-folder>/links/`:

```yaml
---
type: resource-link
resource_type: person
resource_path: "OpenBible/resources/people/Moisés.md"
resource_name: "Moisés"
book: "Êxodo"
chapter: 2
verses: "1-3"
bible_version: "ARA"
color: "#3b82f6"
reference: "Êxodo 2:1-3"
created: "2026-09-15 13:00"
char_start: 12
char_end: 28
selected_text: "carreguem os fardos"
match_all_occurrences: true # optional: when true, matches all whole-word occurrences in chapter
tags:
  - bible-resource-link
  - bible-resource-person
---
```

Body contains the verse quote plus `## Recurso` with a `[[resource|name]]` link.

## 3. Configuration

**Settings → OpenBible → Recursos de estudo** (`ResourcesSection.svelte`):

- Defaults: `person` → `OpenBible/resources/people` (icon `user`), `places` → `OpenBible/resources/places` (icon `map-pin`).
- Each type: `id` (slug, immutable after creation), `label`, `folder`, `icon` (select with curated Lucide/system icons + live preview, see `src/ui/settings/resourceIcons.ts`), `color`.
- Add / edit / delete / reset to defaults. Deleting a type does not delete vault files; links of removed types remain detectable by frontmatter.

## 4. Panels (general + dynamic)

- **General panel**: view-type `open-bible-resources-view` (`ResourcesView` + `ResourcesPanel.svelte`), with search and per-type filter chips, counts, navigate/open/unlink actions. Open via reader toolbar (`link` action), header menu, or commands (`open-bible-resources*`).
- **Dynamic per-type panels**: view-type `open-bible-resources-<typeId>` (e.g. `open-bible-resources-person`), locked to one type (no type chips, title shows `Recursos · <Label>`). Obsidian supports arbitrary view-type strings, so `ensureResourceViews()` in `main.ts` registers the general view plus one view per configured type, re-run whenever `configuredResources` changes. Opening: `plugin.openResourcesView(split, typeId)`. Each type can be pinned to sidebar tabs independently.

## 5. Architecture

- **`ResourceService` (`src/services/ResourceService.ts`)**: mirrors `HighlightService` — vault subscriptions, `detectResource`/`detectLink` via `MetadataCache`, `getResourcesByType`, `getAllResources`, `ensureResource`, `getAllLinks`, `getLinksForChapter`, `addOrUpdateLink` (dedupes same resource + verses + char range), `removeLink`.
- **`VersesView.svelte`**: subscribes to `resourceService`, derives `chapterResourceLinks` + `verseResourcesMap`, handles `handleLinkResource` (modal → ensure → link), `handleOpenResource` (preview modal), `handleUnlinkResource`.
- **`VerseRow.svelte`**: `resourceLinks` + `resourceTypes` props, renders per-type icon markers with preview/unlink menu.
- **`VerseActionBar.svelte`**: `configuredResources` + `onLinkResource(typeId)` with type menu.
- **`ResourcesView.ts`**: general + locked-type views, `getState`/`setState` carry `resourceTypeId`.
