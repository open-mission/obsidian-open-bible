import { ItemView, type WorkspaceLeaf } from "obsidian";
import { mount, unmount } from "svelte";
import HighlightsPanel from "./ui/reader/components/HighlightsPanel.svelte";
import type OpenBiblePlugin from "./main";
import { t } from "./i18n";

export const BIBLE_HIGHLIGHTS_VIEW_TYPE = "open-bible-highlights-view";

/** Dedicated workspace view for browsing and managing highlights in the sidebar or tab. */
export class HighlightsView extends ItemView {
	private component: Record<string, unknown> | undefined;

	constructor(
		leaf: WorkspaceLeaf,
		private readonly plugin: OpenBiblePlugin,
	) {
		super(leaf);
	}

	getViewType(): string {
		return BIBLE_HIGHLIGHTS_VIEW_TYPE;
	}

	getDisplayText(): string {
		return t("highlightsPanel.title") || "Destaques";
	}

	getIcon(): string {
		return "highlighter";
	}

	async onOpen(): Promise<void> {
		this.contentEl.empty();
		this.contentEl.addClass("open-bible-highlights-view-container");

		try {
			this.component = mount(HighlightsPanel, {
				target: this.contentEl,
				props: {
					plugin: this.plugin,
					showCloseButton: false,
					closeOnNavigate: false,
					onNavigate: (bookName: string, chapter: number, verseNumber?: number, versionAbbr?: string) => {
						void this.plugin.navigateToPassage(bookName, chapter, verseNumber, versionAbbr);
					},
				},
			});
		} catch (error) {
			console.error("OpenBible: could not mount highlights view", error);
		}
	}

	async onClose(): Promise<void> {
		if (this.component) {
			await unmount(this.component);
			this.component = undefined;
		}
		this.contentEl.empty();
	}
}
