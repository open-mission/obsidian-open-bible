import { App, Modal } from "obsidian";
import { mount, unmount } from "svelte";
import type OpenBiblePlugin from "../../main";
import type { BibleBook, BibleVerse } from "../../models/bible";
import { formatVersesText } from "../../services/verseFormat";
import { setupOpenBibleDialog } from "../kit/dom";
import PassagePickerApp from "./PassagePickerApp.svelte";

export interface PassagePickerModalOptions {
	mode: "insert" | "createNote" | "openPassage";
	onInsert?: (formattedText: string) => void;
	onCreateNote?: (data: {
		book: BibleBook;
		chapter: number;
		verses: BibleVerse[];
		versionAbbr: string;
		color?: string;
		label?: string;
	}) => void | Promise<void>;
	onNavigate?: (data: {
		book: BibleBook;
		chapter: number;
		verse?: number;
		versionAbbr?: string;
	}) => void | Promise<void>;
}

export class PassagePickerModal extends Modal {
	private component?: ReturnType<typeof mount>;

	constructor(
		app: App,
		private plugin: OpenBiblePlugin,
		private options: PassagePickerModalOptions
	) {
		super(app);
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.empty();
		setupOpenBibleDialog(this, { drawerOnMobile: true });
		contentEl.addClass("open-bible-passage-picker-modal-root");

		this.component = mount(PassagePickerApp, {
			target: contentEl,
			props: {
				plugin: this.plugin,
				mode: this.options.mode,
				onComplete: (data: {
					book: BibleBook;
					chapter: number;
					verses: BibleVerse[];
					versionAbbr: string;
					color?: string;
					label?: string;
					verse?: number;
				}) => {
					this.close();
					if (this.options.mode === "insert" && this.options.onInsert) {
						const text = formatVersesText(data.verses, data.book.name, data.chapter, data.versionAbbr);
						this.options.onInsert(text);
					} else if (this.options.mode === "createNote" && this.options.onCreateNote) {
						void this.options.onCreateNote(data);
					} else if (this.options.mode === "openPassage" && this.options.onNavigate) {
						void this.options.onNavigate({
							book: data.book,
							chapter: data.chapter,
							verse: data.verse,
							versionAbbr: data.versionAbbr,
						});
					}
				},
				onClose: () => {
					this.close();
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
