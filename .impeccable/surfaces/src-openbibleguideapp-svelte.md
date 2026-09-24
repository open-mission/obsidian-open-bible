---
version: 1
slug: "src-openbibleguideapp-svelte"
primary_target: "src/OpenBibleGuideApp.svelte"
related_targets: ["src/OpenBibleView.ts","src/main.ts","src/i18n/locales/pt.ts","src/i18n/locales/en.ts","styles.css","docs/guided-command-center.md"]
---

# Open Bible Guided Command Deck

## Scope and visitor mode
A persistent, sidebar-first `ItemView` for the Open Bible plugin. Visitor mode: **Operate**. The surface helps both first-time and advanced users understand, locate, and invoke the plugin's complete real capability set without leaving Obsidian.

## Audience, job, action, proof, and constraints
The audience is a new Open Bible user who needs a clear starting path and an advanced user who needs an exact command reference. The job is to turn an intent such as “compare this passage” into a short explanation and a valid Run, Open, or Configure action. Proof is the complete inventory of real commands, contextual actions, settings, and automatic behavior, labeled by context and prerequisite. It must remain bilingual, fully local, keyboard accessible, responsive, theme-native, and free of deprecated, hidden, duplicate, or documented-but-unimplemented behavior.

## Chosen direction and memorable moment
**Mesa de Comandos Guiada.** A short guided shelf sits above a complete searchable reference. The memorable moment is a single global search that turns the entire panel from orientation into an exact executable result, while contextual actions explain their requirements instead of presenting dead buttons.

## Unresolved decisions
Implementation must preserve the existing `open-bible-view` type for persisted leaves. The catalog may be statically typed but should derive availability from live plugin and workspace state. Placement variants remain grouped beneath one capability.

## Direction contract

**THESIS:** A two-layer command deck, not a settings clone or a wall of cards: a brief path into the product sits above a complete, searchable operating reference, refusing to make beginners and advanced users choose between orientation and precision.

**OWN-WORLD:** The established Open Bible world: Obsidian theme variables, compact Lucide line icons, one-pixel separators, quiet secondary surfaces, restrained accent use, UI sans typography, dense but legible full-row navigation, familiar search fields and filter chips. No fixed palette, decorative glass, new illustration language, or unrelated design system.

**STORY:** The visitor understands that Open Bible is a private, local study companion; discovers a useful path immediately; searches the complete catalog by intent or context; learns where a capability lives and what it changes; then runs, opens, or configures it through existing plugin methods.

**FIRST VIEWPORT:** In a 260–420px sidebar, a compact centered Open Bible logo is the only header content. The global search and context filter sit immediately below in the same 48rem content container used by “Comece por,” so their edges align with the guided task list. The first body block is “Comece por” with four compact task rows; it becomes preparation guidance when no database exists. The next block is “Referência completa,” beginning with visible category headings and real capability rows. A selected capability pushes an in-panel detail view with a clear back control.

**FORM:** Own grounded structure, ranked first for this surface; surface concept seed `1b332b41`, lead structure “Mesa de comandos guiada.” Code-led build. The signature interaction is context-aware search that replaces the body with ranked grouped results and restores the guided/reference overview when cleared.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.
