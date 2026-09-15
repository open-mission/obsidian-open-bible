import { ItemView, Menu, type ViewStateResult, type WorkspaceLeaf } from "obsidian";
import { mount, unmount } from "svelte";
import BibleReader from "./ui/reader/BibleReader.svelte";
import type { BibleReaderController, BibleReaderViewState } from "./ui/reader/types";
import type OpenBiblePlugin from "./main";
import type { OpenBibleSettings } from "./settings";
import { t } from "./i18n";
import { addThompsonMenuItems } from "./ui/reader/thompsonMenu";

export const BIBLE_READER_VIEW_TYPE = "open-bible-reader";

/** Reader leaf: mounts the Svelte reader and keeps the tab title in sync. */
export class BibleReaderView extends ItemView {
	private component: Record<string, unknown> | undefined;
	private controller: BibleReaderController | null = null;
	private passageTitle = "";
	private viewState: BibleReaderViewState = {};

	constructor(
		leaf: WorkspaceLeaf,
		private readonly plugin: OpenBiblePlugin,
	) {
		super(leaf);
	}

	get readerController(): BibleReaderController | null {
		return this.controller;
	}

	getViewType(): string {
		return BIBLE_READER_VIEW_TYPE;
	}

	override getState(): Record<string, unknown> {
		const controllerState = this.controller?.getViewState?.();
		return {
			...this.viewState,
			...(controllerState ?? {}),
		};
	}

	override async setState(state: Record<string, unknown>, result: ViewStateResult): Promise<void> {
		this.viewState = { ...state } as BibleReaderViewState;
		await super.setState(state, result);
		if (this.viewState.bookId && this.viewState.chapter) {
			void this.navigateToPassage(this.viewState.bookId, this.viewState.chapter, this.viewState.verseNumber);
		}
	}

	/** Tab title follows the passage being read, falling back to the plugin name. */
	getDisplayText(): string {
		return this.passageTitle || t("view.title");
	}

	getIcon(): string {
		return "book-open";
	}

	/** Called by the reader whenever the visible passage changes. */
	setPassageTitle(bookName: string, chapter: number | undefined): void {
		this.passageTitle = bookName && chapter !== undefined ? `${bookName} ${chapter}` : "";
		// Obsidian refreshes the header lazily; this is the internal hook it uses.
		(this.leaf as unknown as { updateHeader?: () => void }).updateHeader?.();
	}

	/** Re-reads settings into the mounted component (e.g. after a menu toggle). */
	refreshSettings(): void {
		if (this.controller?.refreshSettings) {
			this.controller.refreshSettings();
		} else {
			(this.component as { syncSettings?: () => void } | undefined)?.syncSettings?.();
		}
	}

	openHistory(): void {
		this.controller?.openHistory?.();
	}

	openBookPicker(): void {
		this.controller?.openBookPicker?.();
	}

	openVersionPicker(): void {
		this.controller?.openVersionPicker?.();
	}

	openAppearance(): void {
		this.controller?.openAppearancePicker?.();
	}

	async navigateToPassage(
		bookIdOrName: number | string,
		chapter: number,
		verseNumber?: number,
		versionAbbr?: string,
	): Promise<boolean> {
		if (this.controller?.navigateToPassage) {
			return await this.controller.navigateToPassage(bookIdOrName, chapter, verseNumber, versionAbbr);
		}
		return false;
	}

	override onPaneMenu(menu: Menu, source: string): void {
		super.onPaneMenu(menu, source);
		menu.addSeparator();

		const viewState = this.controller?.getViewState?.() ?? this.viewState;
		const isTwoCol = viewState.twoColumns ?? Boolean(this.plugin.settings.readerTwoColumns ?? this.plugin.settings.twoColumnLayout);
		menu.addItem((item) =>
			item
				.setTitle(t("reader.twoColumns"))
				.setIcon("columns-2")
				.setChecked(isTwoCol)
				.onClick(() => {
					this.controller?.toggleTwoColumns?.();
				}),
		);

		addThompsonMenuItems(menu, this.plugin, this.controller);

		const showBottomPanel = viewState.showCrossRefsBottomPanel ?? (this.plugin.settings.showCrossRefsBottomPanel ?? true);
		menu.addItem((item) =>
			item
				.setTitle(t("readerMenu.bottomCrossRefs") || "Painel de referências cruzadas")
				.setIcon("list-collapse")
				.setChecked(showBottomPanel)
				.onClick(() => {
					this.controller?.toggleBottomPanel?.();
				}),
		);

		if (showBottomPanel) {
			const isFixed = Boolean(viewState.crossRefsBottomPanelFixed ?? this.plugin.settings.crossRefsBottomPanelFixed);
			menu.addItem((item) =>
				item
					.setTitle(isFixed ? t("resources.pinInline") : t("resources.pinFixed"))
					.setIcon(isFixed ? "pin-off" : "pin")
					.setChecked(isFixed)
					.onClick(() => {
						this.controller?.toggleBottomPanelFixed?.();
					}),
			);
		}

		menu.addItem((item) =>
			item
				.setTitle(t("readerMenu.appearance") || "Aparência")
				.setIcon("sliders-horizontal")
				.onClick(() => {
					this.openAppearance();
				}),
		);

		menu.addItem((item) =>
			item
				.setTitle(t("readerMenu.readingHistory") || "Histórico de leitura")
				.setIcon("history")
				.onClick(() => {
					this.openHistory();
				}),
		);
	}

	async onOpen(): Promise<void> {
		this.contentEl.empty();
		this.contentEl.addClass("open-bible-reader-view");

		try {
			this.component = mount(BibleReader, {
				target: this.contentEl,
				props: {
					plugin: this.plugin,
					textService: this.plugin.bibleText,
					versionService: this.plugin.bibleVersions,
					settings: this.plugin.settings,
					initialViewState: this.viewState,
					updateSettings: (patch: Partial<OpenBibleSettings>) => this.plugin.updateGeneral(patch),
					onViewConfigChange: (patch: Partial<BibleReaderViewState>) => {
						this.viewState = { ...this.viewState, ...patch };
						this.app.workspace.requestSaveLayout();
					},
					openSettings: () => this.plugin.openPluginSettings(),
					onPassageChange: (bookName: string, chapter: number | undefined) =>
						this.setPassageTitle(bookName, chapter),
					registerController: (controller: BibleReaderController) => {
						this.controller = controller;
					},
				},
			});
		} catch (error) {
			console.error("OpenBible: could not mount the reader", error);
			const container = this.contentEl.createDiv({ cls: "open-bible-reader-fallback" });
			container.createEl("h3", { text: t("view.errorOpening") });
			container.createEl("p", { text: error instanceof Error ? error.message : String(error) });
		}
	}

	async onClose(): Promise<void> {
		if (this.component) {
			await unmount(this.component);
			this.component = undefined;
		}
		this.controller = null;
		this.contentEl.empty();
		// Free the WebAssembly database when the last reader leaf goes away.
		const otherLeaves = this.app.workspace
			.getLeavesOfType(BIBLE_READER_VIEW_TYPE)
			.filter((leaf) => leaf.view !== this);
		if (otherLeaves.length === 0) {
			this.plugin.bibleText.closeActiveDatabase();
		}
	}
}