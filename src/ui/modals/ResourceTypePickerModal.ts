import { Modal, setIcon, type App } from "obsidian";
import { t } from "../../i18n";
import type { ResourceTypeConfig } from "../../settings";
import { createUiButton, createUiFooter, setupOpenBibleDialog } from "../kit/dom";

/** Modal to select a resource type before linking/creating a resource. */
export class ResourceTypePickerModal extends Modal {
	constructor(
		app: App,
		private reference: string,
		private resourceTypes: ResourceTypeConfig[],
		private onSelectType: (typeId: string) => void,
	) {
		super(app);
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.empty();
		setupOpenBibleDialog(this, { drawerOnMobile: true });
		contentEl.addClass("open-bible-resource-type-picker-modal");

		this.titleEl.setText(t("popover.selectResourceType") || "Escolher tipo de recurso");

		if (this.reference) {
			contentEl.createDiv({
				text: this.reference,
				cls: "open-bible-picker-subtitle",
			});
		}

		const listEl = contentEl.createDiv("open-bible-resource-chooser-list");

		for (const type of this.resourceTypes) {
			const row = listEl.createDiv("open-bible-resource-chooser-row");

			const mainBtn = row.createDiv("open-bible-resource-chooser-main");
			mainBtn.setAttribute("role", "button");
			mainBtn.setAttribute("tabindex", "0");

			const iconEl = mainBtn.createSpan("open-bible-resource-chooser-icon");
			if (type.color) iconEl.style.color = type.color;
			setIcon(iconEl, type.icon || "link");

			const textWrap = mainBtn.createDiv("open-bible-resource-chooser-text");
			textWrap.createDiv({
				text: type.label,
				cls: "open-bible-resource-chooser-name",
			});
			if (type.folder) {
				textWrap.createDiv({
					text: type.folder,
					cls: "open-bible-resource-chooser-sub",
				});
			}

			const select = () => {
				this.close();
				this.onSelectType(type.id);
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
