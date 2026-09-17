# Study Resources (Verse Links)

Complementary resources linked from verses — people, places and any custom type.

## 1. Overview & User Experience

- **Selection flow**: selecting a verse, a verse range (`Shift + Click`), a word/phrase snippet, or right-clicking directly on a word in reader text opens the contextual options (via the Verse Action Bar or the right-click context menu). The **Link resource** action shows a menu with the configured resource types.
- **Link or create**: picking a type opens `ResourceLinkModal`, listing existing resources in that type folder with search. Users can link an existing one or type a name and **Create and link**. When linking a selected word or phrase, users can choose between **Only this occurrence** (default) and **All occurrences of this word**.
- **Reader markers**: links bound to a word/phrase (`char_start`/`char_end`) render the type icon inline right after the selected trecho (same anchor logic as highlight range markers, via shared text segmentation); whole-verse links render the icon at the end of the verse (`.open-bible-resource-marker`), using the type icon and color (defaults: `user` for people, `map-pin` for places).
- **Click behavior & Secondary Panel**: clicking a marker icon (`.open-bible-resource-marker`) or underlined linked text (`.open-bible-resource-text`) holding a single link opens the resource details according to `resourceOpenMode`:
  - **Reader secondary panel** (default, `"reader"`): opens immediately inside the reader alongside the biblical text, with an interactive drag resizer, allowing users to study without leaving their reading screen or losing scroll context.
  - **Workspace tab / panel** (`"workspace"`): opens or updates a dedicated Obsidian workspace view (`open-bible-resource-detail-view`) in the configured location (right sidebar, vertical split, or separate tab).
  - **Modal popup** (`"modal"`): opens the traditional `ResourcePreviewModal` dialog.
  - While viewing the resource inside the reader's secondary panel, an **"Abrir em aba separada"** button allows popping the panel out into a standalone Obsidian workspace leaf at any time.
  - `Ctrl/Cmd + Click` on a single link opens the resource directly in the Obsidian editor. Keyboard activation (`Enter` / `Space`) is supported with proper accessibility roles (`role="button"`, `tabindex="0"`).
- **Secondary Panel features (`ResourceDetailPanel.svelte`)**:
  - Hero image banner (from note frontmatter `image`, `banner`, `cover`, or `thumbnail` — supports vault relative paths, wikilinks `[[image.png]]`, or external `https://` URLs).
  - Resource type pill badge with icon and custom type color.
  - Large title and scrollable markdown content rendered via `MarkdownRenderer.render`.
  - Contextual linked passage card with quote snippet and 1-click navigation to verse.
  - **Biblical occurrences list**: discovers and displays all other verses across Scripture linked to this resource, allowing users to trace the subject across the entire Bible.
  - Action bar: open in editor, promote to workspace tab, unlink from passage, and close panel.

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

- **Secondary panel mode (`resourceOpenMode`)**:
  - `reader` (default): opens the secondary panel inside the Bible reader alongside the text.
  - `workspace`: opens or updates a dedicated Obsidian workspace view (`open-bible-resource-detail-view`).
  - `modal`: opens `ResourcePreviewModal` floating dialog.
- **Workspace panel position (`resourceWorkspaceSplit`)**:
  - `right` (default): right sidebar.
  - `split`: split pane next to the reader.
  - `tab`: new tab.
- Defaults: `person` → `OpenBible/resources/people` (icon `user`), `places` → `OpenBible/resources/places` (icon `map-pin`).
- Each type: `id` (slug, immutable after creation), `label`, `folder`, `icon` (select with curated Lucide/system icons + live preview, see `src/ui/settings/resourceIcons.ts`), `color`.
- Add / edit / delete / reset to defaults. Deleting a type does not delete vault files; links of removed types remain detectable by frontmatter.

## 4. Panels (General, Dynamic, Detail View, and Resource Home Hub)

- **General links panel**: view-type `open-bible-resources-view` (`ResourcesView` + `ResourcesPanel.svelte`), listing verse links with search and per-type filter chips, counts, navigate/open/unlink actions. Open via reader toolbar (`link` action), header menu, or commands (`open-bible-resources*`).
- **Dynamic per-type panels**: view-type `open-bible-resources-<typeId>` (e.g. `open-bible-resources-person`), locked to one type (no type chips, title shows `Recursos · <Label>`). Opening: `plugin.openResourcesView(split, typeId)`. Each type can be pinned to sidebar tabs independently.
- **Resource Home Hub (`ResourceHomePanel.svelte` / `ResourceHubView.ts`)**:
  - **Central catalog** of all resource notes in the vault (people, places, topics) with live search, per-type filtering pills, occurrence counts, and sorting (Most cited in Scripture, Name A-Z/Z-A, Recently updated).
  - **Grouped by Category or Flat Grid**: users can toggle between a structured **Grouped View** (displaying separate sections for each type with headers, item counters, and quick add buttons: e.g. *Pessoas (15)*, *Lugares (8)*, *Definições (4)*) and a **Flat Grid View**.
  - **Collapsible Groups & Accordion Behavior**: Each category group in the grouped view can be individually collapsed or expanded with a smooth rotating chevron indicator. A global **Recolher todos / Expandir todos** toolbar button toggles all categories simultaneously for quick scanning and organization.
  - **Cards layout**: interactive cards with hero images or category-colored placeholders, resource name, type badges, and total biblical occurrence counts.
  - **Dual experience**:
    - Embedded in reader lateral panel: seamless switching between Home Hub (`"home"`) and Resource Details (`"detail"`), with a **Back to Hub** button.
    - Dedicated workspace view: view-type `open-bible-resource-hub-view` openable in tab, split, or right sidebar dock.
  - **Quick Creation**: built-in `+ Novo Recurso` button opening `CreateResourceModal` to add new people or locations instantly, with preselected category when clicked from a group header.
- **Secondary detail panel & workspace view**:
  - **Embedded in reader**: displayed on the right of `BibleReader.svelte` with a draggable resizer (`.open-bible-split-resizer`). Supports smooth closing, resizing, back to hub navigation, and 1-click workspace promotion.
  - **Dedicated workspace view**: view-type `open-bible-resource-detail-view` (`ResourceDetailView` + `ResourceDetailPanel.svelte`), allowing users to dock study resources anywhere in their custom workspace layouts. Updates in real-time when clicking resources in the Bible text.

## 5. Architecture

- **`ResourceService` (`src/services/ResourceService.ts`)**: mirrors `HighlightService` — vault subscriptions, `detectResource`/`detectLink` via `MetadataCache`, `getResourcesByType`, `getAllResources`, `ensureResource`, `getAllLinks`, `getLinksForChapter`, `getLinksForResource`, `getResourceStats`, `addOrUpdateLink`, `removeLink`.
- **`ResourceHomePanel.svelte`**: central dashboard component for discovering, searching, filtering, and creating study resources.
- **`ResourceHubView.ts`**: `ItemView` wrapper hosting the Resource Home Hub in the Obsidian workspace.
- **`ResourceDetailPanel.svelte`**: shared Svelte 5 component powering both the inside-reader secondary panel and the standalone workspace view.
- **`ResourceDetailView.ts`**: `ItemView` wrapper for Obsidian workspace integration of resource details.
- **`CreateResourceModal.ts`**: dialog modal to create a new study resource note in the vault with correct frontmatter.
- **`VersesView.svelte`**: subscribes to `resourceService`, derives `chapterResourceLinks` + `verseResourcesMap`, delegates resource clicks to `onOpenResource`.
- **`BibleReader.svelte`**: orchestrates reader layout with main verses scroll area, resizer, and secondary panel container. Manages view state persistence (`secondaryPanelOpen`, `secondaryPanelMode`, `secondaryPanelResourcePath`, `secondaryPanelWidth`).
- **`VerseRow.svelte`**: renders per-type icon markers and underlined text anchors.
