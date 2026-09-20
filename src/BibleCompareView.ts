import { ItemView, type ViewStateResult, type WorkspaceLeaf } from "obsidian";
import { mount, unmount } from "svelte";
import BibleCompareApp from "./ui/modals/BibleCompareApp.svelte";
import type OpenBiblePlugin from "./main";
import { t } from "./i18n";

export const BIBLE_COMPARE_VIEW_TYPE = "open-bible-compare-view";

export interface BibleCompareViewState {
	bookId?: number;
	chapter?: number;
	verseNumbers?: number[];
	selectedVersions?: string[];
	layout?: "columns" | "verses";
}

/** Workspace view displaying multi-version Bible text comparison in a dedicated tab or split pane. */
export class BibleCompareView extends ItemView {
	private component: Record<string, unknown> | undefined;
	private viewState: BibleCompareViewState = {};
	private passageTitle: string = "";

	navigation = true;

	constructor(
		leaf: WorkspaceLeaf,
		private readonly plugin: OpenBiblePlugin,
	) {
		super(leaf);
	}

	getViewType(): string {
		return BIBLE_COMPARE_VIEW_TYPE;
	}

	getDisplayText(): string {
		return this.passageTitle || t("compare.modalTitle") || "Comparar Versões";
	}

	getIcon(): string {
		return "columns";
	}

	override getState(): Record<string, unknown> {
		return {
			...this.viewState,
			selectedVersions: this.plugin.settings.compareSelectedVersions,
			layout: this.plugin.settings.comparePreferredLayout,
		};
	}

	override async setState(state: Record<string, unknown>, result: ViewStateResult): Promise<void> {
		await super.setState(state, result);
		this.viewState = {
			bookId: typeof state?.bookId === "number" ? state.bookId : undefined,
			chapter: typeof state?.chapter === "number" ? state.chapter : undefined,
			verseNumbers: Array.isArray(state?.verseNumbers) ? (state.verseNumbers as number[]) : undefined,
			selectedVersions: Array.isArray(state?.selectedVersions) ? (state.selectedVersions as string[]) : undefined,
			layout: state?.layout === "verses" ? "verses" : "columns",
		};
		this.mountComponent();
	}

	setPassageState(state: BibleCompareViewState): void {
		this.viewState = { ...this.viewState, ...state };
		this.mountComponent();
	}

	setPassageTitle(title: string): void {
		this.passageTitle = title ? `${t("compare.modalTitle")} · ${title}` : "";
		(this.leaf as unknown as { updateHeader?: () => void }).updateHeader?.();
	}

	private mountComponent(): void {
		if (this.component) {
			void unmount(this.component);
			this.component = undefined;
		}

		this.contentEl.empty();
		this.contentEl.addClass("open-bible-compare-view-root");

		this.component = mount(BibleCompareApp, {
			target: this.contentEl,
			props: {
				plugin: this.plugin,
				initialBookId: this.viewState.bookId,
				initialChapter: this.viewState.chapter,
				initialVerseNumbers: this.viewState.verseNumbers,
				isWorkspaceView: true,
				onClose: () => {
					this.leaf.detach();
				},
				onTitleChange: (title: string) => {
					this.setPassageTitle(title);
				},
			},
		});
	}

	override async onOpen(): Promise<void> {
		this.mountComponent();
	}

	override async onClose(): Promise<void> {
		if (this.component) {
			void unmount(this.component);
			this.component = undefined;
		}
		this.contentEl.empty();
	}
}
