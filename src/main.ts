import { Editor, Menu, Notice, Plugin, WorkspaceLeaf, TFile } from "obsidian";
import { OPEN_BIBLE_VIEW_TYPE, OpenBibleView } from "./OpenBibleView";
import { BIBLE_READER_VIEW_TYPE, BibleReaderView } from "./BibleReaderView";
import { BIBLE_HIGHLIGHTS_VIEW_TYPE, HighlightsView } from "./HighlightsView";
import {
	BIBLE_RESOURCES_VIEW_TYPE,
	RESOURCES_VIEW_TYPE_PREFIX,
	ResourcesView,
	getResourceViewType,
} from "./ResourcesView";
import { BIBLE_RESOURCE_DETAIL_VIEW_TYPE, ResourceDetailView } from "./ResourceDetailView";
import { BIBLE_RESOURCE_HUB_VIEW_TYPE, ResourceHubView } from "./ResourceHubView";
import type { BibleResourceLink } from "./models/resource";
import { DEFAULT_SETTINGS, type OpenBibleSettings } from "./settings";
import { normalizeDataFolder } from "./core/paths";
import { BibleVersionService } from "./services/bibleVersionService";
import { BibleTextService } from "./services/bibleTextService";
import { CrossReferenceService } from "./services/CrossReferenceService";
import { VersePreviewService } from "./services/VersePreviewService";
import { HighlightService } from "./services/HighlightService";
import { ResourceService } from "./services/ResourceService";
import { OpenBibleSettingTab } from "./settings/SettingsTab";
import { openOrRevealView, type ViewSplit } from "./workspace/openPluginView";
import { applyLocalePreference, t } from "./i18n";
import { createVerseReferenceEditorExtension } from "./editor/VerseReferenceEditorExtension";
import { processMarkdownVerseReferences } from "./services/MarkdownVerseProcessor";
import { findReferenceAtPosition } from "./services/VerseReferenceParser";
import { formatVersesText } from "./services/verseFormat";
import { insertScriptureInEditor, insertScriptureAtCursor } from "./services/editorInsertion";
import { createNoteFromSelection } from "./services/NoteService";
import { getCanonBook } from "./bibleCanon";
import type { BibleBook } from "./models/bible";
import { PassagePickerModal } from "./ui/modals/PassagePickerModal";

export default class OpenBiblePlugin extends Plugin {
	settings: OpenBibleSettings = DEFAULT_SETTINGS;
	bibleVersions!: BibleVersionService;
	bibleText!: BibleTextService;
	crossReferenceService!: CrossReferenceService;
	versePreviewService!: VersePreviewService;
	highlightService!: HighlightService;
	resourceService!: ResourceService;
	private ribbonIconEl?: HTMLElement;
	private registeredResourceViews: Set<string> = new Set();

	async onload(): Promise<void> {
		await this.loadSettings();
		this.applyLanguage();
		this.bibleVersions = new BibleVersionService(this.app, () => this.settings, () => this.saveSettings());
		this.bibleText = new BibleTextService(this.app, this.bibleVersions);
		this.crossReferenceService = new CrossReferenceService(() => this.bibleText.getSql());
		this.versePreviewService = new VersePreviewService(this);
		this.highlightService = new HighlightService(this.app, () => this.settings);
		this.resourceService = new ResourceService(this.app, () => this.settings);

		this.registerEditorExtension(createVerseReferenceEditorExtension(this));
		this.registerMarkdownPostProcessor((el, ctx) => {
			processMarkdownVerseReferences(el, ctx, this);
		});

		this.app.workspace.onLayoutReady(() => {
			if (this.settings.thompsonCrossRefsEnabled || (this.settings.showCrossRefsBottomPanel ?? true)) {
				void this.crossReferenceService.load().catch((error) => {
					console.warn("OpenBible: failed to load cross-references:", error);
				});
			}
		});

		this.registerView(OPEN_BIBLE_VIEW_TYPE, (leaf) => new OpenBibleView(leaf, this.app, this.settings));
		this.registerView(BIBLE_READER_VIEW_TYPE, (leaf) => new BibleReaderView(leaf, this));
		this.registerView(BIBLE_HIGHLIGHTS_VIEW_TYPE, (leaf) => new HighlightsView(leaf, this));
		this.registerView(BIBLE_RESOURCE_DETAIL_VIEW_TYPE, (leaf) => new ResourceDetailView(leaf, this));
		this.registerView(BIBLE_RESOURCE_HUB_VIEW_TYPE, (leaf) => new ResourceHubView(leaf, this));
		this.ensureResourceViews();

		this.ribbonIconEl = this.addRibbonIcon("book-open", t("ribbon.openReader"), (evt: MouseEvent) => {
			if (evt.button === 1 || evt.metaKey || evt.ctrlKey) {
				void this.openReader("new-tab");
			} else {
				void this.openReader();
			}
		});

		this.ribbonIconEl.addEventListener("contextmenu", (evt: MouseEvent) => {
			const menu = new Menu();
			menu.addItem((item) =>
				item
					.setTitle(t("commands.openReader"))
					.setIcon("book-open")
					.onClick(() => {
						void this.openReader("tab");
					}),
			);
			menu.addItem((item) =>
				item
					.setTitle(t("commands.openReaderNewTab"))
					.setIcon("file-plus")
					.onClick(() => {
						void this.openReader("new-tab");
					}),
			);
			menu.addItem((item) =>
				item
					.setTitle(t("commands.openReaderSplit"))
					.setIcon("split")
					.onClick(() => {
						void this.openReader("split");
					}),
			);
			menu.showAtMouseEvent(evt);
		});

		this.addCommand({
			id: "open-bible-reader",
			name: t("commands.openReader"),
			callback: () => {
				void this.openReader();
			},
		});

		this.addCommand({
			id: "open-bible-reader-new-tab",
			name: t("commands.openReaderNewTab"),
			callback: () => {
				void this.openReader("new-tab");
			},
		});

		this.addCommand({
			id: "open-bible-reader-split",
			name: t("commands.openReaderSplit"),
			callback: () => {
				void this.openReader("split");
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

		this.addCommand({
			id: "open-bible-highlights",
			name: t("commands.openHighlights"),
			callback: async () => {
				let leaves = this.app.workspace.getLeavesOfType(BIBLE_READER_VIEW_TYPE);
				if (leaves.length === 0) {
					await this.openReader();
					leaves = this.app.workspace.getLeavesOfType(BIBLE_READER_VIEW_TYPE);
				}
				for (const leaf of leaves) {
					if (leaf.view instanceof BibleReaderView) {
						await this.app.workspace.revealLeaf(leaf);
						leaf.view.openHighlights();
						break;
					}
				}
			},
		});

		this.addCommand({
			id: "open-bible-highlights-right-sidebar",
			name: t("commands.openHighlightsRightSidebar"),
			callback: () => {
				void this.openHighlightsView("right");
			},
		});

		this.addCommand({
			id: "open-bible-highlights-left-sidebar",
			name: t("commands.openHighlightsLeftSidebar"),
			callback: () => {
				void this.openHighlightsView("left");
			},
		});

		this.addCommand({
			id: "open-bible-resources",
			name: t("commands.openResources"),
			callback: () => {
				void this.openResourcesView("right");
			},
		});

		this.addCommand({
			id: "open-bible-resources-right-sidebar",
			name: t("commands.openResourcesRightSidebar"),
			callback: () => {
				void this.openResourcesView("right");
			},
		});

		this.addCommand({
			id: "open-bible-resources-left-sidebar",
			name: t("commands.openResourcesLeftSidebar"),
			callback: () => {
				void this.openResourcesView("left");
			},
		});

		this.addCommand({
			id: "open-bible-resource-detail",
			name: t("commands.openResourceDetail"),
			callback: () => {
				void this.openResourceDetailView();
			},
		});

		this.addCommand({
			id: "open-bible-resource-detail-right-sidebar",
			name: t("commands.openResourceDetailRightSidebar"),
			callback: () => {
				void this.openResourceDetailView(undefined, "right");
			},
		});

		this.addCommand({
			id: "open-bible-resource-hub",
			name: t("commands.openResourceHub"),
			callback: async () => {
				const mode = this.settings.resourceOpenMode ?? "reader";
				if (mode === "workspace") {
					void this.openResourceHubView();
				} else {
					let leaves = this.app.workspace.getLeavesOfType(BIBLE_READER_VIEW_TYPE);
					if (leaves.length === 0) {
						await this.openReader();
						leaves = this.app.workspace.getLeavesOfType(BIBLE_READER_VIEW_TYPE);
					}
					for (const leaf of leaves) {
						if (leaf.view instanceof BibleReaderView) {
							await this.app.workspace.revealLeaf(leaf);
							leaf.view.openResourceHub();
							break;
						}
					}
				}
			},
		});

		this.addCommand({
			id: "open-bible-resource-hub-right-sidebar",
			name: t("commands.openResourceHubRightSidebar"),
			callback: () => {
				void this.openResourceHubView("right");
			},
		});

		this.addCommand({
			id: "open-bible-resource-hub-new-tab",
			name: t("commands.openResourceHubNewTab"),
			callback: () => {
				void this.openResourceHubView("new-tab");
			},
		});

		this.addCommand({
			id: "toggle-selection-mode",
			name: t("commands.toggleSelectionMode"),
			checkCallback: (checking: boolean) => {
				const activeView = this.app.workspace.getActiveViewOfType(BibleReaderView);
				if (activeView) {
					if (!checking) {
						activeView.toggleSelectionMode();
					}
					return true;
				}
				return false;
			},
		});

		this.addCommand({
			id: "open-bible-passage",
			name: t("commands.openBiblePassage"),
			callback: () => {
				new PassagePickerModal(this.app, this, {
					mode: "openPassage",
					onNavigate: async (data) => {
						await this.navigateToPassage(
							data.book.id,
							data.chapter,
							data.verse,
							data.versionAbbr
						);
					},
				}).open();
			},
		});

		this.addCommand({
			id: "insert-verse-at-cursor",
			name: t("commands.insertVerseAtCursor"),
			editorCallback: (editor: Editor) => {
				new PassagePickerModal(this.app, this, {
					mode: "insert",
					onInsert: (formattedText) => {
						insertScriptureAtCursor(editor, formattedText);
						new Notice(t("notices.verseInserted"));
					},
				}).open();
			},
		});

		this.addCommand({
			id: "create-bible-note",
			name: t("commands.createBibleNote"),
			callback: () => {
				new PassagePickerModal(this.app, this, {
					mode: "createNote",
					onCreateNote: async (data) => {
						await createNoteFromSelection(this.app, this.settings, data);
						new Notice(t("notices.noteCreated"));
					},
				}).open();
			},
		});

		this.registerEvent(
			this.app.workspace.on("editor-menu", (menu, editor) => {
				if (this.settings.enableVersePreviews === false) return;
				const cursor = editor.getCursor();
				const line = editor.getLine(cursor.line);
				const ref = findReferenceAtPosition(line, cursor.ch, true);
				if (!ref) return;

				const defaultPos = this.settings.verseInsertPosition ?? "below";
				const defaultLabel = defaultPos === "below"
					? t("contextMenu.insertBelow")
					: t("contextMenu.insertAbove");

				menu.addItem((item) => {
					item.setTitle(defaultLabel)
						.setIcon("book-open")
						.onClick(async () => {
							const preview = await this.versePreviewService.getVersePreview(ref);
							if (!preview || preview.verses.length === 0) {
								new Notice(t("resources.verseMissing"));
								return;
							}
							const text = formatVersesText(preview.verses, preview.bookName, preview.chapter, preview.versionAbbr);
							insertScriptureInEditor(editor, text, defaultPos, cursor.line);
							new Notice(t("notices.verseInserted"));
						});
				});

				const altPos = defaultPos === "below" ? "above" : "below";
				const altLabel = altPos === "below"
					? t("contextMenu.insertBelow")
					: t("contextMenu.insertAbove");

				menu.addItem((item) => {
					item.setTitle(altLabel)
						.setIcon("list-plus")
						.onClick(async () => {
							const preview = await this.versePreviewService.getVersePreview(ref);
							if (!preview || preview.verses.length === 0) {
								new Notice(t("resources.verseMissing"));
								return;
							}
							const text = formatVersesText(preview.verses, preview.bookName, preview.chapter, preview.versionAbbr);
							insertScriptureInEditor(editor, text, altPos, cursor.line);
							new Notice(t("notices.verseInserted"));
						});
				});

				menu.addItem((item) => {
					item.setTitle(t("contextMenu.createNote"))
						.setIcon("file-plus")
						.onClick(async () => {
							const preview = await this.versePreviewService.getVersePreview(ref);
							if (!preview || preview.verses.length === 0) {
								new Notice(t("resources.verseMissing"));
								return;
							}
							const bookCanon = getCanonBook(preview.bookName);
							const book: BibleBook = {
								id: bookCanon?.id ?? 0,
								name: preview.bookName,
								chapters: [],
								testament: bookCanon?.testament ?? 1,
							};
							await createNoteFromSelection(this.app, this.settings, {
								book,
								chapter: preview.chapter,
								verses: preview.verses,
								versionAbbr: preview.versionAbbr,
							});
							new Notice(t("notices.noteCreated"));
						});
				});
			})
		);

		this.registerEvent(
			this.app.vault.on("modify", (file) => {
				if (file instanceof TFile && file.extension === "md") {
					void this.bibleVersions.handleVaultFileChange(file).then(() => {
						this.refreshReaderViews();
					});
				}
			})
		);

		this.registerEvent(
			this.app.vault.on("delete", (file) => {
				if (file instanceof TFile && file.extension === "md") {
					this.bibleVersions.handleVaultFileDelete(file);
					this.refreshReaderViews();
				}
			})
		);

		this.addSettingTab(new OpenBibleSettingTab(this.app, this));
	}

	override onunload(): void {
		this.highlightService?.destroy();
		this.resourceService?.destroy();
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

	/** Opens (or reveals) the Highlights view in the requested location (tab, right sidebar, or left sidebar). */
	async openHighlightsView(split: ViewSplit = "right"): Promise<void> {
		const leaf = await openOrRevealView(this.app.workspace, BIBLE_HIGHLIGHTS_VIEW_TYPE, split);
		if (!leaf) {
			new Notice(t("view.errorOpening"));
			return;
		}
	}

	/** Registers the general resources view plus one dynamic view per resource type. */
	ensureResourceViews(): void {
		const registerOnce = (viewType: string, lockedTypeId: string | null) => {
			if (this.registeredResourceViews.has(viewType)) return;
			try {
				this.registerView(viewType, (leaf) => new ResourcesView(leaf, this, lockedTypeId));
				this.registeredResourceViews.add(viewType);
			} catch (err) {
				console.warn(`OpenBible: could not register view ${viewType}`, err);
			}
		};
		registerOnce(BIBLE_RESOURCES_VIEW_TYPE, null);
		for (const resType of this.resourceService?.getResourceTypes() ?? []) {
			registerOnce(getResourceViewType(resType.id), resType.id);
		}
	}

	/** Opens the general resources panel, or a per-type dynamic panel when typeId is given. */
	async openResourcesView(split: ViewSplit = "right", typeId?: string): Promise<void> {
		this.ensureResourceViews();
		const viewType = typeId ? getResourceViewType(typeId) : BIBLE_RESOURCES_VIEW_TYPE;
		if (!viewType.startsWith(BIBLE_RESOURCES_VIEW_TYPE) && !viewType.startsWith(RESOURCES_VIEW_TYPE_PREFIX)) {
			new Notice(t("view.errorOpening"));
			return;
		}
		const leaf = await openOrRevealView(this.app.workspace, viewType, split);
		if (!leaf) {
			new Notice(t("view.errorOpening"));
			return;
		}
	}

	/** Opens (or reveals) the secondary resource detail view in the requested workspace location. */
	async openResourceDetailView(link?: BibleResourceLink, split?: ViewSplit): Promise<WorkspaceLeaf | null> {
		const targetSplit = split ?? (this.settings.resourceWorkspaceSplit as ViewSplit) ?? "right";
		const leaf = await openOrRevealView(this.app.workspace, BIBLE_RESOURCE_DETAIL_VIEW_TYPE, targetSplit);
		if (!leaf) {
			new Notice(t("view.errorOpening"));
			return null;
		}
		if (leaf.view instanceof ResourceDetailView) {
			if (link) {
				leaf.view.setResource(link);
			}
		}
		return leaf;
	}

	/** Opens (or reveals) the Resource Home Hub view in the requested workspace location. */
	async openResourceHubView(split?: ViewSplit): Promise<WorkspaceLeaf | null> {
		const targetSplit = split ?? (this.settings.resourceWorkspaceSplit as ViewSplit) ?? "right";
		const leaf = await openOrRevealView(this.app.workspace, BIBLE_RESOURCE_HUB_VIEW_TYPE, targetSplit);
		if (!leaf) {
			new Notice(t("view.errorOpening"));
			return null;
		}
		return leaf;
	}

	/** Pushes a newly selected resource to all active ResourceDetailView workspace leaves. */
	updateResourceDetailViews(link: BibleResourceLink): void {
		for (const leaf of this.app.workspace.getLeavesOfType(BIBLE_RESOURCE_DETAIL_VIEW_TYPE)) {
			if (leaf.view instanceof ResourceDetailView) {
				leaf.view.setResource(link);
			}
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
		if (patch.configuredResources !== undefined) {
			this.ensureResourceViews();
		}
		// Re-resolve the UI language whenever the preference changes.
		if (patch.language !== undefined) {
			this.applyLanguage();
		}
		// Push layout changes (two columns, widths, spacing) into open readers.
		this.refreshReaderViews();
		// Notify open markdown editors to update decorations with the latest settings.
		this.app.workspace.updateOptions();
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

		const activeLeaf = this.app.workspace.getActiveViewOfType(BibleReaderView)?.leaf;
		const targetLeaf = activeLeaf ?? leaves[0];

		if (targetLeaf?.view instanceof BibleReaderView) {
			await this.app.workspace.revealLeaf(targetLeaf);
			return await targetLeaf.view.navigateToPassage(bookIdOrName, chapter, verseNumber, versionAbbr);
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
