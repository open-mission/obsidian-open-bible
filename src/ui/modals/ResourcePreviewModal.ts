import { App, MarkdownRenderer, Modal, setIcon, TFile } from "obsidian";
import type OpenBiblePlugin from "../../main";
import { stripFrontmatter } from "../../services/NoteService";
import { t } from "../../i18n";
import type { BibleResourceLink } from "../../models/resource";
import { createUiButton, createUiDialogBody, createUiFooter, setupOpenBibleDialog } from "../kit/dom";
import { openNoteInEditor } from "./NotePreviewModal";

/**
 * Resolves an image path from frontmatter (URL, vault path, or wikilink [[...]])
 * into an absolute resource path that can be loaded in an <img> element.
 */
export function resolveResourceImageUrl(app: App, rawPath: string, sourcePath: string): string | null {
	if (!rawPath || typeof rawPath !== "string") return null;
	const trimmed = rawPath.trim();
	if (!trimmed) return null;

	// 1. Remote web URL (https:// or http://)
	if (/^https?:\/\//i.test(trimmed)) {
		return trimmed;
	}

	// 2. Obsidian Wikilink format [[image.png]] or ![[image.png]]
	let cleanedPath = trimmed;
	const wikiMatch = trimmed.match(/^!?\[\[(.*?)\]\]$/);
	if (wikiMatch) {
		cleanedPath = wikiMatch[1].split("|")[0].trim();
	}

	// 3. Resolve file in vault
	const destFile =
		app.metadataCache.getFirstLinkpathDest(cleanedPath, sourcePath) ||
		app.vault.getAbstractFileByPath(cleanedPath);

	if (destFile instanceof TFile) {
		return app.vault.getResourcePath(destFile);
	}

	return null;
}

/** Shows the linked resource file content with featured image plus the passage context card. */
export class ResourcePreviewModal extends Modal {
	constructor(
		app: App,
		private plugin: OpenBiblePlugin,
		private link: BibleResourceLink,
		private onNavigate?: (bookName: string, chapter: number, verseNumber?: number, versionAbbr?: string) => void,
		private onUnlink?: (linkPath: string) => void,
	) {
		super(app);
	}

	async onOpen(): Promise<void> {
		const { contentEl } = this;
		contentEl.empty();
		setupOpenBibleDialog(this, { drawerOnMobile: true });
		this.modalEl.addClass("open-bible-resource-preview-dialog");
		contentEl.addClass("open-bible-resource-preview-modal");

		const type = this.plugin.resourceService?.getResourceType(this.link.resourceType);
		const typeLabel = type?.label || this.link.resourceType;
		const typeColor = type?.color || "var(--interactive-accent)";
		const typeIcon = type?.icon || "link";

		const file = this.app.vault.getAbstractFileByPath(this.link.resourcePath);
		let rawContent = "";
		let imageUrl: string | null = null;

		if (file instanceof TFile) {
			const cache = this.app.metadataCache.getFileCache(file);
			const fm = cache?.frontmatter;
			const rawImage = (fm?.image || fm?.cover || fm?.banner || fm?.thumbnail) as string | undefined;
			if (rawImage) {
				imageUrl = resolveResourceImageUrl(this.app, rawImage, file.path);
			}
			try {
				const raw = await this.app.vault.cachedRead(file);
				rawContent = stripFrontmatter(raw, this.app, file).trim();
			} catch (err) {
				console.error("OpenBible: error reading resource", err);
			}
		}

		// Hero / Featured image banner (if configured)
		if (imageUrl) {
			const heroContainer = contentEl.createDiv("open-bible-resource-preview-hero");
			const img = heroContainer.createEl("img", {
				cls: "open-bible-resource-preview-hero-img",
				attr: { src: imageUrl, alt: this.link.resourceName },
			});
			img.onerror = () => {
				heroContainer.remove();
			};
			heroContainer.createDiv("open-bible-resource-preview-hero-overlay");
		}

		// Header area with Type Badge and Resource Name
		const headerEl = contentEl.createDiv("open-bible-resource-preview-header");
		if (!imageUrl) {
			headerEl.addClass("has-no-hero");
		}

		const badge = headerEl.createDiv("open-bible-resource-type-badge");
		badge.style.setProperty("--badge-color", typeColor);
		const badgeIcon = badge.createSpan("open-bible-resource-type-badge-icon");
		setIcon(badgeIcon, typeIcon);
		badge.createSpan({ text: typeLabel, cls: "open-bible-resource-type-badge-label" });

		headerEl.createEl("h2", {
			text: this.link.resourceName,
			cls: "open-bible-resource-preview-title",
		});

		// Body Container: Markdown rendered content + Linked passage card
		const bodyContainer = createUiDialogBody(contentEl);
		bodyContainer.addClass("open-bible-resource-preview-body-container");

		const markdownEl = bodyContainer.createDiv("open-bible-resource-preview-markdown markdown-rendered");
		if (rawContent) {
			await MarkdownRenderer.render(
				this.app,
				rawContent,
				markdownEl,
				file instanceof TFile ? file.path : this.link.resourcePath,
				this.plugin,
			);
		} else {
			markdownEl.createEl("p", {
				text: t("common.empty"),
				cls: "open-bible-resource-preview-empty",
			});
		}

		// Linked Passage Card
		const passageCard = bodyContainer.createDiv("open-bible-resource-passage-card");
		if (this.onNavigate) {
			passageCard.addClass("is-clickable");
			passageCard.title = t("resources.scrollToVerse");
			passageCard.addEventListener("click", () => {
				this.close();
				const firstVerse = this.link.verses.length > 0 ? this.link.verses[0] : 1;
				this.onNavigate?.(this.link.book, this.link.chapter, firstVerse, this.link.version);
			});
		}

		const passageHeader = passageCard.createDiv("open-bible-resource-passage-header");
		const passageIcon = passageHeader.createSpan("open-bible-resource-passage-icon");
		setIcon(passageIcon, "book-open");
		passageHeader.createSpan({
			text: `${t("resourcesPanel.linkedPassage")}: ${this.link.reference}`,
			cls: "open-bible-resource-passage-ref",
		});

		if (this.link.selectedText) {
			passageCard.createEl("blockquote", {
				text: `“${this.link.selectedText}”`,
				cls: "open-bible-resource-passage-snippet",
			});
		}

		// Footer: Unlink on left, View in chapter and Open in editor on right
		const footer = createUiFooter(contentEl);
		footer.addClass("open-bible-resource-preview-footer");

		const leftGroup = footer.createDiv("open-bible-resource-preview-footer-left");
		if (this.onUnlink) {
			createUiButton(leftGroup, {
				text: t("resourcesPanel.unlinkTooltip"),
				variant: "ghost",
				icon: "unlink",
				size: "sm",
				onClick: async () => {
					this.close();
					this.onUnlink?.(this.link.path);
				},
			});
		}

		const rightGroup = footer.createDiv("open-bible-resource-preview-footer-right");
		if (this.onNavigate) {
			createUiButton(rightGroup, {
				text: t("resourcesPanel.viewInChapter"),
				variant: "ghost",
				icon: "book-open",
				size: "sm",
				onClick: () => {
					this.close();
					const firstVerse = this.link.verses.length > 0 ? this.link.verses[0] : 1;
					this.onNavigate?.(this.link.book, this.link.chapter, firstVerse, this.link.version);
				},
			});
		}
		createUiButton(rightGroup, {
			text: t("note.openInEditor"),
			variant: "cta",
			icon: "file-text",
			size: "sm",
			onClick: async () => {
				this.close();
				await openNoteInEditor(this.app, this.link.resourcePath);
			},
		});
	}

	onClose(): void {
		this.contentEl.empty();
	}
}

export async function openResourceInEditor(app: App, path: string): Promise<void> {
	await openNoteInEditor(app, path);
}
