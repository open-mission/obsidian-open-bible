import { ItemView, type ViewStateResult, type WorkspaceLeaf } from "obsidian";
import { mount, unmount } from "svelte";
import ResourcesPanel from "./ui/reader/components/ResourcesPanel.svelte";
import type OpenBiblePlugin from "./main";
import { t } from "./i18n";

export const BIBLE_RESOURCES_VIEW_TYPE = "open-bible-resources-view";

/** View-type prefix for per-type dynamic panels (e.g. open-bible-resources-person). */
export const RESOURCES_VIEW_TYPE_PREFIX = "open-bible-resources-";

export function getResourceViewType(typeId: string): string {
	return `${RESOURCES_VIEW_TYPE_PREFIX}${typeId}`;
}

export interface ResourcesViewState {
	resourceTypeId?: string;
}

/** Workspace view listing verse↔resource links, optionally locked to one type. */
export class ResourcesView extends ItemView {
	private component: Record<string, unknown> | undefined;
	private lockedTypeId: string | null;

	constructor(
		leaf: WorkspaceLeaf,
		private readonly plugin: OpenBiblePlugin,
		lockedTypeId?: string | null,
	) {
		super(leaf);
		this.lockedTypeId = lockedTypeId ?? null;
	}

	getViewType(): string {
		if (this.lockedTypeId) return getResourceViewType(this.lockedTypeId);
		return BIBLE_RESOURCES_VIEW_TYPE;
	}

	getDisplayText(): string {
		if (this.lockedTypeId) {
			const type = this.plugin.resourceService?.getResourceType(this.lockedTypeId);
			const label = type?.label || this.lockedTypeId;
			return `${t("resourcesPanel.title")} · ${label}`;
		}
		return t("resourcesPanel.title") || "Recursos";
	}

	getIcon(): string {
		if (this.lockedTypeId) {
			return this.plugin.resourceService?.getResourceType(this.lockedTypeId)?.icon || "link";
		}
		return "link";
	}

	override getState(): Record<string, unknown> {
		return { resourceTypeId: this.lockedTypeId };
	}

	override async setState(state: Record<string, unknown>, result: ViewStateResult): Promise<void> {
		const next = state?.resourceTypeId;
		if (typeof next === "string") {
			this.lockedTypeId = next;
		}
		await super.setState(state, result);
	}

	async onOpen(): Promise<void> {
		this.contentEl.empty();
		this.contentEl.addClass("open-bible-resources-view-container");

		try {
			this.component = mount(ResourcesPanel, {
				target: this.contentEl,
				props: {
					plugin: this.plugin,
					initialTypeId: this.lockedTypeId,
					lockedTypeId: this.lockedTypeId,
					showCloseButton: false,
					closeOnNavigate: false,
					onNavigate: (bookName: string, chapter: number, verseNumber?: number, versionAbbr?: string) => {
						void this.plugin.navigateToPassage(bookName, chapter, verseNumber, versionAbbr);
					},
				},
			});
		} catch (error) {
			console.error("OpenBible: could not mount resources view", error);
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
