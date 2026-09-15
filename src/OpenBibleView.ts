import { App, ItemView, WorkspaceLeaf } from "obsidian";
import OpenBibleApp from "./OpenBibleApp.svelte";
import { mount, unmount } from "svelte";
import type { OpenBibleSettings } from "./settings";
import { t } from "./i18n";

export const OPEN_BIBLE_VIEW_TYPE = "open-bible-view";

export class OpenBibleView extends ItemView {
	private component: Record<string, unknown> | undefined;
	private settings: OpenBibleSettings;
	private appRef: App;

	constructor(leaf: WorkspaceLeaf, app: App, settings: OpenBibleSettings) {
		super(leaf);
		this.appRef = app;
		this.settings = settings;
	}

	getViewType(): string {
		return OPEN_BIBLE_VIEW_TYPE;
	}

	getDisplayText(): string {
		return t("view.title");
	}

	getIcon(): string {
		return "book-open-text";
	}

	/** Allows main.ts to update settings without remounting the view. */
	updateSettings(settings: OpenBibleSettings): void {
		this.settings = settings;
	}

	async onOpen(): Promise<void> {
		this.contentEl.empty();
		this.contentEl.addClass("open-bible-container");

		this.component = mount(OpenBibleApp, {
			target: this.contentEl,
			props: {
				defaultReference: this.settings.defaultReference,
				app: this.appRef,
			},
		});
	}

	async onClose(): Promise<void> {
		if (this.component) {
			await unmount(this.component);
			this.component = undefined;
		}
	}
}
