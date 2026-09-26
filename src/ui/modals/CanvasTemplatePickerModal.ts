import { Modal, setIcon, type App } from "obsidian";
import { t } from "../../i18n";
import type { CanvasStudyTemplate } from "../../services/BibleCanvasService";
import { createUiButton, createUiFooter, setupOpenBibleDialog } from "../kit/dom";

/**
 * Modal to select a visual study template before generating a Canvas or Excalidraw drawing.
 */
export class CanvasTemplatePickerModal extends Modal {
	constructor(
		app: App,
		private reference: string,
		private format: "canvas" | "excalidraw",
		private templates: CanvasStudyTemplate[],
		private onSelectTemplate: (template: CanvasStudyTemplate) => void,
	) {
		super(app);
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.empty();
		setupOpenBibleDialog(this, { drawerOnMobile: true });
		contentEl.addClass("open-bible-canvas-template-modal");

		const title =
			this.format === "canvas"
				? t("popover.canvasTemplatesTitle") || "Modelos de Canvas"
				: t("popover.excalidrawTemplatesTitle") || "Modelos de Excalidraw";
		this.titleEl.setText(title);

		if (this.reference) {
			contentEl.createDiv({
				text: this.reference,
				cls: "open-bible-picker-subtitle",
			});
		}

		const listEl = contentEl.createDiv("open-bible-template-chooser-list");

		for (const tpl of this.templates) {
			const row = listEl.createDiv("open-bible-template-chooser-row");

			const mainBtn = row.createDiv("open-bible-template-chooser-main");
			mainBtn.setAttribute("role", "button");
			mainBtn.setAttribute("tabindex", "0");

			const iconWrap = mainBtn.createDiv("open-bible-template-chooser-icon-wrap");
			const iconEl = iconWrap.createSpan("open-bible-template-chooser-icon");
			setIcon(iconEl, tpl.icon || "layout-dashboard");

			const textWrap = mainBtn.createDiv("open-bible-template-chooser-text");
			textWrap.createDiv({
				text: tpl.title,
				cls: "open-bible-template-chooser-name",
			});
			textWrap.createDiv({
				text: tpl.description,
				cls: "open-bible-template-chooser-desc",
			});

			const badge = mainBtn.createSpan("open-bible-template-chooser-badge");
			badge.setText(`${tpl.sections.length} ${t("popover.sectionsCount") || "seções"}`);

			const select = () => {
				this.close();
				this.onSelectTemplate(tpl);
			};
			mainBtn.addEventListener("click", select);
			mainBtn.addEventListener("keydown", (e) => {
				if (e.key === "Enter" || e.key === " ") {
					e.preventDefault();
					select();
				}
			});
		}

		const footer = createUiFooter(contentEl);
		createUiButton(footer, {
			text: t("common.cancel") || "Cancelar",
			variant: "ghost",
			onClick: () => this.close(),
		});
	}

	onClose(): void {
		this.contentEl.empty();
	}
}
