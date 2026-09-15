import { App, MarkdownRenderer, Modal, TFile } from "obsidian";
import type OpenBiblePlugin from "../../main";
import { stripFrontmatter } from "../../services/NoteService";
import { t } from "../../i18n";
import { createUiButton, createUiDialogBody, createUiFooter, setupOpenBibleDialog } from "../kit/dom";

export class NotePreviewModal extends Modal {
	constructor(
		app: App,
		private plugin: OpenBiblePlugin,
		private notePath: string
	) {
		super(app);
	}

	async onOpen(): Promise<void> {
		const { contentEl } = this;
		contentEl.empty();
		setupOpenBibleDialog(this, { drawerOnMobile: true });
		contentEl.addClass("open-bible-note-preview-modal");

		const file = this.app.vault.getAbstractFileByPath(this.notePath);
		const title =
			file instanceof TFile
				? file.basename
				: this.notePath.split("/").pop()?.replace(/\.md$/i, "") || this.notePath;

		const headerEl = contentEl.createDiv("open-bible-note-preview-header");
		headerEl.createEl("h3", {
			text: title,
			cls: "open-bible-note-preview-title",
		});

		const bodyContainer = createUiDialogBody(contentEl);
		bodyContainer.addClass("open-bible-note-preview-body-container");
		const bodyEl = bodyContainer.createDiv("open-bible-note-preview-body markdown-rendered");

		if (!(file instanceof TFile)) {
			bodyEl.createEl("p", {
				text: t("common.error"),
				cls: "open-bible-note-preview-empty",
			});
		} else {
			let content = "";
			try {
				const raw = await this.app.vault.cachedRead(file);
				content = stripFrontmatter(raw, this.app, file).trim();
			} catch (err) {
				console.error("OpenBible: error reading note", err);
			}

			if (content) {
				await MarkdownRenderer.render(this.app, content, bodyEl, file.path, this.plugin);
			} else {
				bodyEl.createEl("p", {
					text: t("common.empty"),
					cls: "open-bible-note-preview-empty",
				});
			}
		}

		const footer = createUiFooter(contentEl);
		createUiButton(footer, {
			text: t("note.openInEditor"),
			variant: "cta",
			icon: "file-text",
			onClick: async () => {
				this.close();
				await openNoteInEditor(this.app, this.notePath);
			},
		});
		createUiButton(footer, {
			text: t("common.close"),
			variant: "ghost",
			onClick: () => this.close(),
		});
	}

	onClose(): void {
		this.contentEl.empty();
	}
}

export async function openNoteInEditor(app: App, path: string): Promise<void> {
	try {
		const file = app.vault.getAbstractFileByPath(path);
		if (file instanceof TFile) {
			const existingLeaf = app.workspace.getLeavesOfType("markdown").find(
				(leaf) => (leaf.view as { file?: TFile })?.file?.path === file.path
			);
			if (existingLeaf) {
				app.workspace.setActiveLeaf(existingLeaf, { focus: true });
				return;
			}
			const leaf = app.workspace.getLeaf("tab");
			await leaf.openFile(file);
			return;
		}
		await app.workspace.openLinkText(path, "", "tab");
	} catch (err) {
		console.error("OpenBible: error opening note in editor", err);
	}
}
