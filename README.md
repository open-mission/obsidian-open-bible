<p align="center">
  <h1 align="center"><b>📖 OpenBible for Obsidian</b></h1>
  <p align="center">
    Offline-first Bible reader and study companion for Obsidian using SQLite and WebAssembly.
    <br />
    <a href="https://github.com/open-mission"><strong>Open Mission »</strong></a>
    ·
    <a href="https://github.com/open-mission/obsidian-open-bible/issues">Report Bug</a>
    ·
    <a href="https://github.com/open-mission/obsidian-open-bible/issues">Feature Request</a>
  </p>
</p>

<p align="center">
  <a href="https://github.com/open-mission/obsidian-open-bible/releases">
    <img src="https://img.shields.io/github/v/release/open-mission/obsidian-open-bible?style=flat-square&color=7c3aed" alt="Version" />
  </a>
  <a href="LICENSE">
    <img src="https://img.shields.io/github/license/open-mission/obsidian-open-bible?style=flat-square&color=2563eb" alt="License" />
  </a>
  <img src="https://img.shields.io/badge/Obsidian-%3E%3D%201.8.0-483699?style=flat-square&logo=obsidian" alt="Obsidian" />
</p>

---

## ✨ Overview

**OpenBible** is an offline-first Bible reader and study companion built directly for Obsidian with an interactive Svelte interface. It allows you to read Scripture, browse translations, explore cross-references, and integrate biblical text into your personal notes and knowledge base — without ever needing an internet connection.

---

## 🚀 Features

- 📖 **Distraction-Free Bible Reader**: Clean, comfortable reading view with verse numbering, responsive typography, and single or two-column reading layouts.
- ⚡ **Instant Passage Picker**: Fast book selector with fuzzy search and Old/New Testament filtering.
- 📚 **Multiple Bible Translations**: Seamlessly switch between installed Bible versions. Manage `.sqlite`, `.db`, or `.sqlite3` databases locally.
- 🔗 **Cross-References**: Inline Thompson cross-reference indications and expandable bottom reference panel inspired by Obsidian's backlinks.
- 🔍 **Verse Preview**: Interactive popover/modal to preview passages and cross-references without losing your reading position, with one-click copying.
- 🌐 **Bilingual Interface**: Built-in support for English and Portuguese, adapting automatically to your Obsidian language settings.
- 🔒 **100% Offline & Private**: Powered by SQLite compiled to WebAssembly. Zero telemetry, zero external network calls, zero tracking. All files stay securely in your local vault.

---

## 📥 Installation

### Community Plugins (Recommended)

*Once listed in the Obsidian Community Plugins directory:*

1. Open Obsidian **Settings → Community plugins**.
2. Make sure **Restricted mode** is turned off.
3. Click **Browse** and search for **OpenBible**.
4. Click **Install**, then **Enable**.

### Manual Installation

1. Download `main.js`, `manifest.json`, and `styles.css` from the latest [GitHub Release](https://github.com/open-mission/obsidian-open-bible/releases).
2. Inside your Obsidian vault, create the folder:
   ```text
   <vault>/.obsidian/plugins/open-bible/
   ```
3. Copy the downloaded files into that folder.
4. In Obsidian, go to **Settings → Community plugins**, reload, and enable **OpenBible**.

---

## 🛠️ Usage

- **Open reader**: Click the book icon in the left ribbon or run `OpenBible: Open reader` from the Command Palette (`Ctrl/Cmd + P`).
- **Sidebar view**: Open the reader docked directly in your right or left sidebar using `OpenBible: Open reader in right sidebar` or `OpenBible: Open reader in left sidebar`.
- **Switch chapters**: Use the passage selector at the top or the previous/next buttons at the bottom.
- **Toggle two-column layout**: Run `OpenBible: Toggle two-column layout` or adjust it in **Settings → OpenBible → Reader and appearance**.
- **Manage Bible databases**: In **Settings → OpenBible → Bible versions and SQLite databases**, view installed versions or import `.sqlite` database files.

---

## 💻 Development

Prerequisites: Node.js ≥ 18.

```bash
npm install
npm run dev           # Watch mode (builds main.js on change)
npm run build         # Production build (TypeScript check + esbuild bundle)
npm run svelte-check  # Svelte type-checking
```

> [!TIP]
> Always develop against a dedicated test vault, never your primary personal vault.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

Cross-reference data sourced from [OpenBible.info](https://www.openbible.info/labs/cross-references/) (CC-BY).
