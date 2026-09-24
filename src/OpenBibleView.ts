import { ItemView, Menu, type WorkspaceLeaf } from "obsidian";
import { mount, unmount } from "svelte";
import OpenBibleGuideApp from "./OpenBibleGuideApp.svelte";
import type OpenBiblePlugin from "./main";
import { t } from "./i18n";

export const OPEN_BIBLE_VIEW_TYPE = "open-bible-view";

export class OpenBibleView extends ItemView {
	private component: Record<string, unknown> | undefined;

	constructor(
		leaf: WorkspaceLeaf,
		private readonly plugin: OpenBiblePlugin,
	) {
		super(leaf);
		this.navigation = true;
	}

	getViewType(): string {
		return OPEN_BIBLE_VIEW_TYPE;
	}

	getDisplayText(): string {
		return t("guide.title");
	}

	getIcon(): string {
		return "book-open-text";
	}

	override onPaneMenu(menu: Menu, source: string): void {
		super.onPaneMenu(menu, source);
		menu.addSeparator();
		menu.addItem((item) =>
			item
				.setTitle(t("commands.openGuideNewTab"))
				.setIcon("file-plus")
				.onClick(() => {
					void this.plugin.openGuideView("new-tab");
				}),
		);
		menu.addItem((item) =>
			item
				.setTitle(t("commands.openGuideSplit"))
				.setIcon("split")
				.onClick(() => {
					void this.plugin.openGuideView("split");
				}),
		);
		menu.addItem((item) =>
			item
				.setTitle(t("commands.openGuideRightSidebar"))
				.setIcon("panel-right")
				.onClick(() => {
					void this.plugin.openGuideView("right");
				}),
		);
		menu.addItem((item) =>
			item
				.setTitle(t("commands.openGuideLeftSidebar"))
				.setIcon("panel-left")
				.onClick(() => {
					void this.plugin.openGuideView("left");
				}),
		);
	}

	refresh(): void {
		(this.component as { refresh?: () => void } | undefined)?.refresh?.();
		(this.leaf as unknown as { updateHeader?: () => void }).updateHeader?.();
	}

	async onOpen(): Promise<void> {
		this.contentEl.empty();
		this.contentEl.addClass("open-bible-container");

		this.component = mount(OpenBibleGuideApp, {
			target: this.contentEl,
			props: {
				plugin: this.plugin,
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
