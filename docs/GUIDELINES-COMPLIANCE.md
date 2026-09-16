# Obsidian Guidelines Compliance Audit

This document details how **OpenBible** satisfies the [Obsidian Plugin Guidelines](https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines) and [Submission Requirements](https://docs.obsidian.md/Plugins/Releasing/Submit+your+plugin).

---

## Checklist Summary

| Guideline Category | Status | Implementation Details |
| :--- | :---: | :--- |
| **Manifest `id` rules** | ✅ Pass | Changed to `open-bible`. Contains no uppercase letters, no `obsidian` prefix/substring, and does not end with `plugin`. |
| **Manifest metadata** | ✅ Pass | Complete with valid `minAppVersion`, SemVer version (`0.1.0`), English description, author (`Open Mission`), and author URL. |
| **License** | ✅ Pass | Root `LICENSE` file contains the full standard MIT License text. |
| **Security (`innerHTML`)** | ✅ Pass | Zero usage of `innerHTML`, `outerHTML`, or `insertAdjacentHTML`. All DOM nodes are generated via Svelte 5 and Obsidian DOM helpers (`createEl`, `createDiv`). |
| **Network & Telemetry** | ✅ Pass | 100% local and offline. Zero remote telemetry, tracking, or network calls. |
| **Mobile Compatibility** | ✅ Pass | Runs SQLite entirely in-memory/in-vault via embedded WebAssembly (`sql.js`), with zero top-level Node/Electron dependencies. |
| **Command Names** | ✅ Pass | No redundant plugin prefix in command titles (`Open reader`, `Toggle two-column layout`). Obsidian automatically prepends `OpenBible:` in the command palette. |
| **Default Hotkeys** | ✅ Pass | No default hotkeys assigned, avoiding collisions with user hotkey configurations. |
| **UI Sentence Case** | ✅ Pass | All settings headings, labels, and descriptions use standard Sentence case rather than Title Case. |
| **Settings Headings** | ✅ Pass | Headings do not repeat the word "settings" (e.g., "Bible versions and SQLite databases", "Reader and appearance"). |
| **View Lifecycle** | ✅ Pass | Views are instantiated strictly through `registerView()`. No references to active leaves are cached on the plugin instance. Open leaves are not forcibly closed in `onunload()`. |
| **Database Lifecycle** | ✅ Pass | Active SQLite database connections are cleanly closed inside `onunload()`. |
| **Path Normalization** | ✅ Pass | All folder and vault paths pass through `normalizePath()`. Backward compatibility is preserved for both `.obsidian/plugins/open-bible/` and `.obsidian/plugins/obsidian-open-bible/`. |
| **Release Artifacts** | ✅ Pass | GitHub Actions release workflow packages `main.js`, `manifest.json`, and `styles.css` with cryptographically signed build attestations (`actions/attest@v4`). |

---

## Detailed Audit Points

### 1. Plugin Manifest (`manifest.json`)
The Obsidian Community directory review bot validates manifest fields strictly:
- **`id`**: Must match `^[a-z0-9-]+$`, cannot include the substring `obsidian`, and cannot end in `plugin`. Configured as `"open-bible"`.
- **`name`**: Set to `"OpenBible"` (descriptive, basic Latin characters, no forbidden affixes).
- **`isDesktopOnly`**: Set to `false` because WebAssembly SQLite does not rely on desktop-only native binaries.

### 2. UI Text & Capitalization
According to Obsidian's style guide:
- Section titles: *"Reader and appearance"*, *"Bible versions and SQLite databases"*, *"Resources and study Bibles"*.
- Actions & buttons: *"Import SQLite version"*, *"Two-column layout"*, *"Text width"*.
- Avoids redundant repetition of "settings" in sub-headings.

### 3. Resource Cleanup
- `OpenBibleView` and `BibleReaderView` unmount their respective Svelte component roots when closed or hidden.
- Event listeners are attached to managed lifecycle nodes or handled internally by Svelte component bindings.
- In `src/main.ts`, `onunload()` explicitly executes `this.bibleText?.closeActiveDatabase()` to release allocated WebAssembly memory and SQLite handles.
