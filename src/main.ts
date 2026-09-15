import { Notice, Plugin, WorkspaceLeaf } from "obsidian";
import { OPEN_BIBLE_VIEW_TYPE, OpenBibleView } from "./OpenBibleView";
import { BIBLE_READER_VIEW_TYPE, BibleReaderView } from "./BibleReaderView";
import { DEFAULT_SETTINGS, type OpenBibleSettings } from "./settings";
import { normalizeDataFolder } from "./core/paths";
import { BibleVersionService } from "./services/bibleVersionService";
import { BibleTextService } from "./services/bibleTextService";
import { CrossReferenceService } from "./services/CrossReferenceService";
import { VersePreviewService } from "./services/VersePreviewService";
import { OpenBibleSettingTab } from "./settings/SettingsTab";
import { openOrRevealView, type ViewSplit } from "./workspace/openPluginView";
import { applyLocalePreference, t } from "./i18n";

export default class OpenBiblePlugin extends Plugin {
	settings: OpenBibleSettings = DEFAULT_SETTINGS;
	bibleVersions!: BibleVersionService;
	bibleText!: BibleTextService;
	crossReferenceService!: CrossReferenceService;
	versePreviewService!: VersePreviewService;
	private ribbonIconEl?: HTMLElement;

	async onload(): Promise<void> {
		await this.loadSettings();
		this.applyLanguage();
		this.bibleVersions = new BibleVersionService(this.app, () => this.settings);
		this.bibleText = new BibleTextService(this.app, this.bibleVersions);
		this.crossReferenceService = new CrossReferenceService(() => this.bibleText.getSql());
		this.versePreviewService = new VersePreviewService(this);

		this.app.workspace.onLayoutReady(() => {
			if (this.settings.thompsonCrossRefsEnabled) {
				void this.crossReferenceService.load().catch((error) => {
					console.warn("OpenBible: failed to load cross-references:", error);
				});
			}
		});

		this.registerView(OPEN_BIBLE_VIEW_TYPE, (leaf) => new OpenBibleView(leaf, this.app, this.settings));
		this.registerView(BIBLE_READER_VIEW_TYPE, (leaf) => new BibleReaderView(leaf, this));

		this.ribbonIconEl = this.addRibbonIcon("book-open", t("ribbon.openReader"), () => {
			void this.openReader();
		});

		this.addCommand({
			id: "open-open-bible",
			name: t("commands.openBibleText"),
			callback: () => {
				void this.activateView();
			},
		});

		this.addCommand({
			id: "open-bible-reader",
			name: t("commands.openReader"),
			callback: () => {
				void this.openReader();
			},
		});

		this.addCommand({
			id: "open-bible-reader-right-sidebar",
			name: t("commands.openReaderRightSidebar"),
			callback: () => {
				void this.openReader("right");
			},
		});

		this.addCommand({
			id: "open-bible-reader-left-sidebar",
			name: t("commands.openReaderLeftSidebar"),
			callback: () => {
				void this.openReader("left");
			},
		});

		this.addCommand({
			id: "toggle-two-columns",
			name: t("commands.toggleTwoColumns"),
			callback: async () => {
				await this.updateGeneral({ readerTwoColumns: !this.settings.readerTwoColumns });
				this.refreshReaderViews();
			},
		});

		this.addSettingTab(new OpenBibleSettingTab(this.app, this));
	}

	override onunload(): void {
		this.bibleText?.closeActiveDatabase();
	}

	/** Opens (or reveals) the Bible reader in the requested location. */
	async openReader(split: ViewSplit = "tab"): Promise<void> {
		const leaf = await openOrRevealView(this.app.workspace, BIBLE_READER_VIEW_TYPE, split);
		if (!leaf) {
			new Notice(t("view.errorOpening"));
			return;
		}
		const view = leaf.view;
		if (view instanceof BibleReaderView) {
			view.refreshSettings();
		}
	}

	/** Opens the plugin settings tab (used by the reader empty state). */
	openPluginSettings(): void {
		const settings = (this.app as unknown as {
			setting?: { open: () => void; openTabById: (id: string) => void };
		}).setting;
		settings?.open();
		settings?.openTabById(this.manifest.id);
	}

	/** Pushes the current settings into every mounted reader leaf. */
	refreshReaderViews(): void {
		for (const leaf of this.app.workspace.getLeavesOfType(BIBLE_READER_VIEW_TYPE)) {
			if (leaf.view instanceof BibleReaderView) {
				leaf.view.refreshSettings();
			}
		}
	}

	private applyLanguage(): void {
		applyLocalePreference(this.settings.language);
		this.ribbonIconEl?.setAttribute("aria-label", t("ribbon.openReader"));
	}

	async updateDataFolder(value: string): Promise<string> {
		const normalized = normalizeDataFolder(value);
		if (!normalized) {
			throw new Error(t("errors.invalidFolderPath"));
		}
		this.settings.dataFolder = normalized;
		await this.saveSettings();
		await this.bibleVersions.ensureVersionsFolder();
		return normalized;
	}

	async updateGeneral(patch: Partial<OpenBibleSettings>): Promise<void> {
		if (patch.readerTwoColumns !== undefined && patch.twoColumnLayout === undefined) {
			patch.twoColumnLayout = patch.readerTwoColumns;
		} else if (patch.twoColumnLayout !== undefined && patch.readerTwoColumns === undefined) {
			patch.readerTwoColumns = patch.twoColumnLayout;
		}
		Object.assign(this.settings, patch);
		await this.saveSettings();
		// Re-resolve the UI language whenever the preference changes.
		if (patch.language !== undefined) {
			this.applyLanguage();
		}
		// Push layout changes (two columns, widths, spacing) into open readers.
		this.refreshReaderViews();
	}

	async navigateToPassage(
		bookIdOrName: number | string,
		chapter: number,
		verseNumber?: number,
		versionAbbr?: string,
	): Promise<boolean> {
		let leaves = this.app.workspace.getLeavesOfType(BIBLE_READER_VIEW_TYPE);
		if (leaves.length === 0) {
			await this.openReader();
			leaves = this.app.workspace.getLeavesOfType(BIBLE_READER_VIEW_TYPE);
		}

		for (const leaf of leaves) {
			if (leaf.view instanceof BibleReaderView) {
				await this.app.workspace.revealLeaf(leaf);
				return await leaf.view.navigateToPassage(bookIdOrName, chapter, verseNumber, versionAbbr);
			}
		}
		return false;
	}

	async activateView(): Promise<void> {
		const { workspace } = this.app;
		let leaf: WorkspaceLeaf | null = null;

		const leaves = workspace.getLeavesOfType(OPEN_BIBLE_VIEW_TYPE);
		if (leaves.length > 0) {
			leaf = leaves[0];
		} else {
			leaf = workspace.getRightLeaf(false);
			if (leaf) {
				await leaf.setViewState({ type: OPEN_BIBLE_VIEW_TYPE, active: true });
			}
		}

		if (leaf) {
			void workspace.revealLeaf(leaf);
			const view = leaf.view;
			if (view instanceof OpenBibleView) {
				view.updateSettings(this.settings);
			}
		} else {
			new Notice(t("view.errorOpening"));
		}
	}

	async loadSettings(): Promise<void> {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}
}
