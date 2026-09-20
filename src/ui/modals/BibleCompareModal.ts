import { App, Modal, setIcon } from "obsidian";
import { mount, unmount } from "svelte";
import type OpenBiblePlugin from "../../main";
import { setupOpenBibleDialog } from "../kit/dom";
import BibleCompareApp from "./BibleCompareApp.svelte";
import { t } from "../../i18n";
import type { BibleCompareViewState } from "../../BibleCompareView";

export interface BibleCompareModalOptions {
	bookId?: number;
	chapter?: number;
	verseNumbers?: number[];
}

export class BibleCompareModal extends Modal {
	private component?: ReturnType<typeof mount>;
	private currentState: BibleCompareViewState = {};

	constructor(
		app: App,
		private plugin: OpenBiblePlugin,
		private options?: BibleCompareModalOptions,
	) {
		super(app);
		this.currentState = {
			bookId: options?.bookId,
			chapter: options?.chapter,
			verseNumbers: options?.verseNumbers,
		};
	}

	onOpen(): void {
		const { contentEl, modalEl } = this;
		contentEl.empty();
		setupOpenBibleDialog(this, { drawerOnMobile: true });
		modalEl.addClass("open-bible-compare-dialog");
		contentEl.addClass("open-bible-compare-modal-root");

		// Set title in the native modal header
		this.titleEl.setText(t("compare.modalTitle"));

		// Add "Open in tab" icon button directly in the modal header next to the close button
		const tabBtn = createEl("button", {
			cls: "open-bible-modal-header-tab-btn clickable-icon",
			attr: {
				type: "button",
				"aria-label": t("compare.openInTab"),
				title: t("compare.openInTab"),
			},
		});
		setIcon(tabBtn, "panel-top");
		tabBtn.addEventListener("click", () => {
			void this.plugin.openCompareView("tab", this.currentState);
			this.close();
		});
		modalEl.insertBefore(tabBtn, contentEl);

		// Modal dimensions: generous width and height, padding 0
		modalEl.style.width = "90vw";
		modalEl.style.maxWidth = "1100px";
		modalEl.style.height = "85vh";
		modalEl.style.maxHeight = "85vh";
		modalEl.style.padding = "0";

		this.component = mount(BibleCompareApp, {
			target: contentEl,
			props: {
				plugin: this.plugin,
				initialBookId: this.options?.bookId,
				initialChapter: this.options?.chapter,
				initialVerseNumbers: this.options?.verseNumbers,
				isWorkspaceView: false,
				onClose: () => this.close(),
				onStateChange: (state: BibleCompareViewState) => {
					this.currentState = state;
				},
			},
		});
	}

	onClose(): void {
		if (this.component) {
			void unmount(this.component);
			this.component = undefined;
		}
		this.contentEl.empty();
	}
}
