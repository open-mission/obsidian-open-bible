import { ItemView, type WorkspaceLeaf } from "obsidian";
import { mount, unmount } from "svelte";
import ResourceHomePanel from "./ui/resources/ResourceHomePanel.svelte";
import type OpenBiblePlugin from "./main";
import type { BibleResourceItem, BibleResourceLink } from "./models/resource";
import { t } from "./i18n";

export const BIBLE_RESOURCE_HUB_VIEW_TYPE = "open-bible-resource-hub-view";

/**
 * Workspace leaf view hosting the Resource Home Hub (Central de Recursos),
 * allowing full-page or sidebar exploration, search, and filtering of all study resources.
 */
export class ResourceHubView extends ItemView {
	private component: Record<string, unknown> | undefined;

	constructor(
		leaf: WorkspaceLeaf,
		private readonly plugin: OpenBiblePlugin,
	) {
		super(leaf);
	}

	getViewType(): string {
		return BIBLE_RESOURCE_HUB_VIEW_TYPE;
	}

	getDisplayText(): string {
		return t("resources.hubTitle") || "Central de Recursos";
	}

	getIcon(): string {
		return "layout-grid";
	}

	private mountOrUpdateComponent(): void {
		if (!this.contentEl) return;
		this.contentEl.empty();
		this.contentEl.addClass("open-bible-resource-hub-view-container");

		try {
			this.component = mount(ResourceHomePanel, {
				target: this.contentEl,
				props: {
					plugin: this.plugin,
					embedded: false,
					onSelectResource: (resource: BibleResourceItem) => {
						const links = this.plugin.resourceService?.getLinksForResource(resource.path) ?? [];
						const link: BibleResourceLink = links.length > 0 ? links[0] : {
							path: "",
							resourceType: resource.resourceType,
							resourcePath: resource.path,
							resourceName: resource.name || resource.title,
							book: "",
							chapter: 1,
							verses: [],
							versesStr: "",
							color: "blue",
							reference: "",
						};
						void this.plugin.openResourceDetailView(link);
					},
					onNavigateToPassage: (bookName: string, chapter: number, verseNumber?: number, versionAbbr?: string) => {
						void this.plugin.navigateToPassage(bookName, chapter, verseNumber, versionAbbr);
					},
				},
			});
		} catch (error) {
			console.error("OpenBible: could not mount resource hub view", error);
		}
	}

	async onOpen(): Promise<void> {
		this.mountOrUpdateComponent();
	}

	async onClose(): Promise<void> {
		if (this.component) {
			await unmount(this.component);
			this.component = undefined;
		}
		this.contentEl.empty();
	}
}
