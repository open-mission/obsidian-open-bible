# Open Bible Guided Command Center

The **Open Bible Center** is the plugin's persistent discovery and command surface. It gives first-time users a short path into the product while preserving a complete reference for advanced users. The goal is not to duplicate the documentation: every entry explains a real capability and routes to the existing reader, modal, workspace view, editor flow, or settings section.

## User experience

The plugin exposes five Center command entry points across three workspace forms:

- the current tab and a new tab (two placement commands);
- a vertical split;
- the left or right sidebar (two sidebar placements).

Its first viewport has four layers:

1. **Centered brand** — shows the Open Bible logo as the only header content.
2. **Global search and context filter** — searches names, summaries, details, and bilingual keywords; filters by workspace, reader, selection, editor, settings, or automatic behavior. The control row uses the same 48rem container as the guided shelf.
3. **Guided shelf** — offers four common paths for installed versions, or setup guidance when no Bible database exists.
4. **Complete reference** — groups all capabilities by task and keeps every category visible.

Selecting a capability pushes an in-panel detail view. The detail view contains its purpose, usage contexts, live availability, complete explanation, valid actions, and related capabilities. Navigation resets the detail scroll position and moves focus to its heading; Back restores both the originating row's focus and the previous reference scroll position.

## Capability model

`src/ui/guide/capabilityCatalog.ts` is the single source of truth for the Center. A capability declares:

- stable ID;
- task category;
- usage contexts;
- contextual requirement and Bible-database dependency;
- Lucide icon;
- bilingual search keywords;
- safe action IDs;
- related capabilities;
- optional guided-shelf placement.

Localized titles, summaries, and details live under `guide.capabilities` in both `pt.ts` and `en.ts`. UI chrome and action labels live under the corresponding `guide` sections. The catalog defines 35 real capabilities and 38 safe action IDs; all 35 capability records and all 38 action labels are present in both PT and EN, and the keyword arrays include both languages.

The catalog groups those capabilities into six task families:

1. Read and navigate
2. Find and compare
3. Study and cross-reference
4. Create and organize
5. Integrate with the vault
6. Configure and maintain

Placement variants are consolidated. For example, the reader entry exposes current-tab, new-tab, split, left-sidebar, and right-sidebar actions instead of presenting those commands as unrelated products. The first action in a capability is its primary CTA; additional placement actions are secondary variants.

## Action safety

Actions are resolved against the current plugin and Obsidian workspace state.

- **Ready** capabilities expose their declared action set, with the first action as the primary CTA and later actions as secondary variants.
- **Database-dependent** capabilities are setup-gated when no installed database is found; their action list is replaced by the exact **Manage versions and data** settings action (`configure-data`).
- **Selection** capabilities explain that a verse, range, word, or phrase must be selected first and expose only a valid next step for the current context.
- **Editor** capabilities disable editor-only actions when no active Markdown editor is present and recalculate on Obsidian `active-leaf-change` and `layout-change` events.
- **Setup** guidance appears when no installed Bible database is found and remains stable during background refreshes, including window-focus checks with zero installed versions.
- **Automatic** capabilities explain the behavior without presenting a fake command.
- **Destructive operations** are not exposed as direct Center actions. The catalog describes the existing settings or confirmation flow, and the Center routes users there rather than inventing a destructive action.

Global actions call existing plugin methods rather than reimplementing behavior. Reader helpers reveal or create a reader before invoking its controller, and settings actions open the exact settings section through `OpenBibleSettingTab.openSection()`.

## Workspace integration

The Center preserves the historical `open-bible-view` type. This keeps persisted leaves compatible while replacing the old placeholder reference-search view. `OpenBibleView` now mounts `OpenBibleGuideApp.svelte`, exposes pane placement actions, refreshes localized headings, and delegates all feature work to `OpenBiblePlugin`.

The plugin registers five commands:

- Open Open Bible Center
- Open Open Bible Center in new tab
- Split editor with Open Bible Center
- Open Open Bible Center in right sidebar
- Open Open Bible Center in left sidebar

The Open Bible ribbon context menu exposes the Center, a new tab, and a split. The Center's pane menu also exposes the new-tab, split, left-sidebar, and right-sidebar placements.

## Search behavior

Search normalization is accent-insensitive and case-insensitive. Results use a deterministic weighted score with the following precedence (and stable catalog order for ties):

1. exact title;
2. title prefix;
3. title substring;
4. keyword match;
5. summary match;
6. detail match.

The context filter is applied before scoring. Clearing the query or selecting **All contexts** restores the guided shelf and complete reference.

## States and responsiveness

The implementation covers:

- initial version detection without a misleading setup flash;
- stable no-version setup during background focus refresh;
- no installed Bible database;
- populated ready state;
- search with results;
- empty search results;
- contextual actions requiring a selection;
- editor actions requiring an active Markdown editor;
- action failure feedback;
- narrow sidebar and mobile-width composition;
- reduced-motion preference.

The layout remains inside the incumbent Open Bible/Obsidian visual system: native Obsidian theme variables, the existing UI kit, Lucide icons, one-pixel separators, quiet secondary surfaces, and restrained accent use. It stays a single-column, full-row interface rather than introducing a second card-based design system. Container and mobile rules preserve the narrow-sidebar composition, and reduced-motion preferences remove reveal and hover transitions.

## Extending the catalog

When adding a real user-facing capability:

1. Add a capability definition and stable action IDs in `capabilityCatalog.ts`.
2. Add every action label and capability string to both `en.ts` and `pt.ts`.
3. Route the action through an existing public plugin method. Add a small plugin method when the same behavior is needed by both a command and the Center.
4. Add related capabilities by stable ID; do not duplicate copy.
5. Verify the new command in the Obsidian Command Palette, the Center detail view, PT/EN, and narrow sidebar width.
6. Update this document when the information architecture changes.

Do not add deprecated settings, hidden placeholders, duplicate commands, internal-only settings, or behavior that is documented but not implemented.
