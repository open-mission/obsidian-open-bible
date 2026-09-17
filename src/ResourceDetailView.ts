import { ItemView, type ViewStateResult, type WorkspaceLeaf, TFile } from "obsidian";
import { mount, unmount } from "svelte";
import ResourceDetailPanel from "./ui/resources/ResourceDetailPanel.svelte";
import type OpenBiblePlugin from "./main";
import type { BibleResourceLink } from "./models/resource";
import { t } from "./i18n";

export const BIBLE_RESOURCE_DETAIL_VIEW_TYPE = "open-bible-resource-detail-view";

export interface ResourceDetailViewState {
	resourcePath?: string;
	link?: BibleResourceLink | null;
}

/** Workspace view displaying encyclopedic study resource details in a separate tab or sidebar dock. */
export class ResourceDetailView extends ItemView {
	private component: Record<string, unknown> | undefined;
	private currentLink: BibleResourceLink | null = null;
	private resourcePath: string | null = null;

	constructor(
		leaf: WorkspaceLeaf,
		private readonly plugin: OpenBiblePlugin,
	) {
		super(leaf);
	}

	getViewType(): string {
		return BIBLE_RESOURCE_DETAIL_VIEW_TYPE;
	}

	getDisplayText(): string {
		if (this.currentLink?.resourceName) {
			return `${t("resources.secondaryPanelTitle") || "Recurso"} · ${this.currentLink.resourceName}`;
		}
		return t("resources.secondaryPanelTitle") || "Detalhes do recurso";
	}

	getIcon(): string {
		if (this.currentLink?.resourceType) {
			return this.plugin.resourceService?.getResourceType(this.currentLink.resourceType)?.icon || "link";
		}
		return "book-open-check";
	}

	override getState(): Record<string, unknown> {
		return {
			resourcePath: this.currentLink?.resourcePath ?? this.resourcePath,
			link: this.currentLink,
		};
	}

	override async setState(state: Record<string, unknown>, result: ViewStateResult): Promise<void> {
		await super.setState(state, result);
		if (state?.link) {
			this.setResource(state.link as BibleResourceLink);
		} else if (typeof state?.resourcePath === "string") {
			this.setResourceByPath(state.resourcePath);
		}
	}

	setResource(link: BibleResourceLink | null): void {
		this.currentLink = link;
		this.resourcePath = link?.resourcePath ?? null;
		(this.leaf as unknown as { updateHeader?: () => void }).updateHeader?.();
		this.mountOrUpdateComponent();
	}

	setResourceByPath(path: string): void {
		this.resourcePath = path;
		const existingLinks = this.plugin.resourceService?.getLinksForResource(path) ?? [];
		if (existingLinks.length > 0) {
			this.currentLink = existingLinks[0];
		} else {
			const file = this.app.vault.getAbstractFileByPath(path);
			const baseName = file instanceof TFile ? file.basename : path.split("/").pop()?.replace(/\.md$/i, "") || path;
			this.currentLink = {
				path: "",
				resourceType: "custom",
				resourcePath: path,
				resourceName: baseName,
				book: "",
				chapter: 1,
				verses: [],
				versesStr: "",
				color: "blue",
				reference: "",
			};
		}
		(this.leaf as unknown as { updateHeader?: () => void }).updateHeader?.();
		this.mountOrUpdateComponent();
	}

	private mountOrUpdateComponent(): void {
		if (!this.contentEl) return;
		this.contentEl.empty();
		this.contentEl.addClass("open-bible-resource-detail-view-container");

		try {
			this.component = mount(ResourceDetailPanel, {
				target: this.contentEl,
				props: {
					plugin: this.plugin,
					link: this.currentLink,
					embedded: false,
					onNavigate: (bookName: string, chapter: number, verseNumber?: number, versionAbbr?: string) => {
						void this.plugin.navigateToPassage(bookName, chapter, verseNumber, versionAbbr);
					},
					onUnlink: (linkPath: string) => {
						void this.plugin.resourceService.removeLink(linkPath);
					},
				},
			});
		} catch (error) {
			console.error("OpenBible: could not mount resource detail view", error);
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
