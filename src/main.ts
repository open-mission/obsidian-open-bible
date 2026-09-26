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
import { BibleComparisonService } from "./services/BibleComparisonService";
import { BibleCanvasService, type VerseCanvasExportParams } from "./services/BibleCanvasService";
import { BibleCompareModal, type BibleCompareModalOptions } from "./ui/modals/BibleCompareModal";
import {
	BIBLE_COMPARE_VIEW_TYPE,
	BibleCompareView,
	type BibleCompareViewState,
} from "./BibleCompareView";

export default class OpenBiblePlugin extends Plugin {
	settings: OpenBibleSettings = DEFAULT_SETTINGS;
	bibleVersions!: BibleVersionService;
	bibleText!: BibleTextService;
	crossReferenceService!: CrossReferenceService;
	versePreviewService!: VersePreviewService;
	highlightService!: HighlightService;
	resourceService!: ResourceService;
	comparisonService!: BibleComparisonService;
	canvasService!: BibleCanvasService;
	private ribbonIconEl?: HTMLElement;
	private settingTab: OpenBibleSettingTab | null = null;
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
		this.comparisonService = new BibleComparisonService(this.app, this.bibleText, this.bibleVersions, () => this.settings);
		this.canvasService = new BibleCanvasService(this.app, () => this.settings);

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

		this.registerView(OPEN_BIBLE_VIEW_TYPE, (leaf) => new OpenBibleView(leaf, this));
		this.registerView(BIBLE_READER_VIEW_TYPE, (leaf) => new BibleReaderView(leaf, this));
		this.registerView(BIBLE_HIGHLIGHTS_VIEW_TYPE, (leaf) => new HighlightsView(leaf, this));
		this.registerView(BIBLE_RESOURCE_DETAIL_VIEW_TYPE, (leaf) => new ResourceDetailView(leaf, this));
		this.registerView(BIBLE_RESOURCE_HUB_VIEW_TYPE, (leaf) => new ResourceHubView(leaf, this));
		this.registerView(BIBLE_COMPARE_VIEW_TYPE, (leaf) => new BibleCompareView(leaf, this));
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
			menu.addSeparator();
			menu.addItem((item) =>
				item
					.setTitle(t("commands.openGuide"))
					.setIcon("book-open-text")
					.onClick(() => {
						void this.openGuideView("right");
					}),
			);
			menu.addItem((item) =>
				item
					.setTitle(t("commands.openGuideNewTab"))
					.setIcon("file-plus")
					.onClick(() => {
						void this.openGuideView("new-tab");
					}),
			);
			menu.addItem((item) =>
				item
					.setTitle(t("commands.openGuideSplit"))
					.setIcon("split")
					.onClick(() => {
						void this.openGuideView("split");
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
			id: "open-bible-guide",
			name: t("commands.openGuide"),
			callback: () => {
				void this.openGuideView();
			},
		});

		this.addCommand({
			id: "open-bible-guide-new-tab",
			name: t("commands.openGuideNewTab"),
			callback: () => {
				void this.openGuideView("new-tab");
			},
		});

		this.addCommand({
			id: "open-bible-guide-split",
			name: t("commands.openGuideSplit"),
			callback: () => {
				void this.openGuideView("split");
			},
		});

		this.addCommand({
			id: "open-bible-guide-right-sidebar",
			name: t("commands.openGuideRightSidebar"),
			callback: () => {
				void this.openGuideView("right");
			},
		});

		this.addCommand({
			id: "open-bible-guide-left-sidebar",
			name: t("commands.openGuideLeftSidebar"),
			callback: () => {
				void this.openGuideView("left");
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
			callback: () => {
				void this.openHighlightsDrawer();
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
			callback: () => {
				void this.openResourceHub();
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
				this.openBiblePassage();
			},
		});

		this.addCommand({
			id: "insert-verse-at-cursor",
			name: t("commands.insertVerseAtCursor"),
			editorCallback: (editor: Editor) => {
				this.insertBibleText(editor);
			},
		});

		this.addCommand({
			id: "create-bible-note",
			name: t("commands.createBibleNote"),
			callback: () => {
				this.createBibleNote();
			},
		});

		this.addCommand({
			id: "open-bible-compare",
			name: t("commands.compareVerses"),
			callback: () => {
				this.openCompareModal();
			},
		});

		this.addCommand({
			id: "open-bible-compare-tab",
			name: t("commands.openCompareTab"),
			callback: () => {
				void this.openCompareView("tab");
			},
		});

		this.addCommand({
			id: "open-bible-compare-split",
			name: t("commands.openCompareSplit"),
			callback: () => {
				void this.openCompareView("split");
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

				menu.addItem((item) => {
					item.setTitle(t("contextMenu.compare"))
						.setIcon("columns")
						.onClick(() => {
							this.openCompareModal({
								bookId: ref.canonicalBookId,
								chapter: ref.chapter,
								verseNumbers: ref.verseStart ? [ref.verseStart] : [],
							});
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

		this.settingTab = new OpenBibleSettingTab(this.app, this);
		this.addSettingTab(this.settingTab);
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

	/** Opens (or reveals) the guided command center in the requested location. */
	async openGuideView(split: ViewSplit = "tab"): Promise<void> {
		const leaf = await openOrRevealView(this.app.workspace, OPEN_BIBLE_VIEW_TYPE, split);
		if (!leaf) {
			new Notice(t("view.errorOpening"));
			return;
		}
		if (leaf.view instanceof OpenBibleView) {
			leaf.view.refresh();
		}
	}

	/** Opens a reader drawer or quick control in the active reader. */
	async openReaderSurface(
		surface: "book" | "chapter" | "version" | "history" | "appearance",
	): Promise<void> {
		const view = await this.revealReaderView();
		if (!view) return;
		switch (surface) {
			case "book":
				view.openBookPicker();
				break;
			case "chapter":
				view.openChapterPicker();
				break;
			case "version":
				view.openVersionPicker();
				break;
			case "history":
				view.openHistory();
				break;
			case "appearance":
				view.openAppearance();
				break;
		}
	}

	/** Toggles verse selection mode in the active reader. */
	async toggleReaderSelectionMode(): Promise<void> {
		const view = await this.revealReaderView();
		view?.toggleSelectionMode();
	}

	/** Toggles the current reader between one and two columns. */
	async toggleReaderTwoColumns(): Promise<void> {
		const view = await this.revealReaderView();
		view?.readerController?.toggleTwoColumns?.();
	}

	/** Toggles inline Thompson references in the current reader. */
	async toggleReaderThompson(): Promise<void> {
		const view = await this.revealReaderView();
		view?.readerController?.toggleThompson?.();
	}

	/** Toggles the cross-reference panel in the current reader. */
	async toggleReaderCrossReferencePanel(): Promise<void> {
		const view = await this.revealReaderView();
		view?.readerController?.toggleBottomPanel?.();
	}

	/** Opens the global passage picker in navigation mode. */
	openBiblePassage(): void {
		new PassagePickerModal(this.app, this, {
			mode: "openPassage",
			onNavigate: async (data) => {
				await this.navigateToPassage(
					data.book.id,
					data.chapter,
					data.verse,
					data.versionAbbr,
				);
			},
		}).open();
	}

	/** Opens the global passage picker and inserts the result into an editor. */
	insertBibleText(editor: Editor | null = this.app.workspace.activeEditor?.editor ?? null): void {
		if (!editor) {
			new Notice(t("notices.noActiveMarkdownNote"));
			return;
		}
		new PassagePickerModal(this.app, this, {
			mode: "insert",
			onInsert: (formattedText) => {
				insertScriptureAtCursor(editor, formattedText);
				new Notice(t("notices.verseInserted"));
			},
		}).open();
	}

	/** Opens the global passage picker and creates a Bible note. */
	createBibleNote(): void {
		new PassagePickerModal(this.app, this, {
			mode: "createNote",
			onCreateNote: async (data) => {
				await createNoteFromSelection(this.app, this.settings, data);
				new Notice(t("notices.noteCreated"));
			},
		}).open();
	}

	/** Opens the Highlights drawer in the active reader. */
	async openHighlightsDrawer(): Promise<void> {
		const view = await this.revealReaderView();
		view?.openHighlights();
	}

	/** Opens the Resource Center according to the configured resource mode. */
	async openResourceHub(): Promise<void> {
		if ((this.settings.resourceOpenMode ?? "reader") === "workspace") {
			await this.openResourceHubView();
			return;
		}
		const view = await this.revealReaderView();
		view?.openResourceHub();
	}

	private async revealReaderView(): Promise<BibleReaderView | null> {
		const activeView = this.app.workspace.getActiveViewOfType(BibleReaderView);
		if (activeView) {
			await this.app.workspace.revealLeaf(activeView.leaf);
			return activeView;
		}
		const existing = this.app.workspace
			.getLeavesOfType(BIBLE_READER_VIEW_TYPE)
			.find((leaf) => leaf.view instanceof BibleReaderView);
		if (existing?.view instanceof BibleReaderView) {
			await this.app.workspace.revealLeaf(existing);
			return existing.view;
		}
		await this.openReader();
		return this.app.workspace.getActiveViewOfType(BibleReaderView) ?? null;
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

	/** Opens (or reveals) the Bible text comparison view in the requested location (tab or split). */
	async openCompareView(split: ViewSplit = "tab", state?: BibleCompareViewState): Promise<WorkspaceLeaf | null> {
		const leaf = await openOrRevealView(this.app.workspace, BIBLE_COMPARE_VIEW_TYPE, split);
		if (!leaf) {
			new Notice(t("view.errorOpening"));
			return null;
		}
		if (state && leaf.view instanceof BibleCompareView) {
			leaf.view.setPassageState(state);
		}
		return leaf;
	}

	/** Opens the Bible text comparison modal for side-by-side study and canvas export. */
	openCompareModal(options?: BibleCompareModalOptions): void {
		new BibleCompareModal(this.app, this, options).open();
	}

	/** Exports selected Bible verses to a visual JSON Canvas (.canvas) file. */
	async exportVersesToCanvas(params: VerseCanvasExportParams): Promise<TFile> {
		return this.canvasService.exportToCanvasFile(params);
	}

	/** Exports selected Bible verses to an Excalidraw drawing. */
	async exportVersesToExcalidraw(params: VerseCanvasExportParams): Promise<boolean> {
		return this.canvasService.exportToExcalidrawFile(params);
	}

	/** Pushes a newly selected resource to all active ResourceDetailView workspace leaves. */
	updateResourceDetailViews(link: BibleResourceLink): void {
		for (const leaf of this.app.workspace.getLeavesOfType(BIBLE_RESOURCE_DETAIL_VIEW_TYPE)) {
			if (leaf.view instanceof ResourceDetailView) {
				leaf.view.setResource(link);
			}
		}
	}

	/** Opens the plugin settings tab, optionally at a specific section. */
	openPluginSettings(sectionId?: string): void {
		if (sectionId) {
			this.settingTab?.openSection(sectionId);
		}
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
		for (const leaf of this.app.workspace.getLeavesOfType(OPEN_BIBLE_VIEW_TYPE)) {
			if (leaf.view instanceof OpenBibleView) {
				leaf.view.refresh();
			}
		}
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
		await this.openGuideView("right");
	}

	async loadSettings(): Promise<void> {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}
}
