import { ItemView, Menu, type WorkspaceLeaf } from "obsidian";
import { mount, unmount } from "svelte";
import BibleReader from "./ui/reader/BibleReader.svelte";
import type { BibleReaderController } from "./ui/reader/types";
import type OpenBiblePlugin from "./main";
import type { OpenBibleSettings } from "./settings";
import { t } from "./i18n";

export const BIBLE_READER_VIEW_TYPE = "open-bible-reader";

/** Reader leaf: mounts the Svelte reader and keeps the tab title in sync. */
export class BibleReaderView extends ItemView {
	private component: Record<string, unknown> | undefined;
	private controller: BibleReaderController | null = null;
	private passageTitle = "";

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

		const isTwoCol = Boolean(this.plugin.settings.readerTwoColumns ?? this.plugin.settings.twoColumnLayout);
		menu.addItem((item) =>
			item
				.setTitle(t("reader.twoColumns"))
				.setIcon("columns-2")
				.setChecked(isTwoCol)
				.onClick(async () => {
					await this.plugin.updateGeneral({
						readerTwoColumns: !isTwoCol,
						twoColumnLayout: !isTwoCol,
					});
					this.refreshSettings();
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
					textService: this.plugin.bibleText,
					versionService: this.plugin.bibleVersions,
					settings: this.plugin.settings,
					updateSettings: (patch: Partial<OpenBibleSettings>) => this.plugin.updateGeneral(patch),
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