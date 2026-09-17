import { Modal, type App } from "obsidian";
import type OpenBiblePlugin from "../../main";
import { t } from "../../i18n";
import type { BibleResourceLink } from "../../models/resource";
import { createUiButton, createUiFooter, setupOpenBibleDialog } from "../kit/dom";
import { setIcon } from "obsidian";

/**
 * Lists every resource linked at the same anchor (word or verse).
 * Used when a marker represents more than one link; a single link
 * opens its preview directly without going through this modal.
 */
export class ResourceChooserModal extends Modal {
	constructor(
		app: App,
		private plugin: OpenBiblePlugin,
		private links: BibleResourceLink[],
		private onSelect: (link: BibleResourceLink) => void,
		private onUnlink: (linkPath: string) => void,
	) {
		super(app);
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.empty();
		setupOpenBibleDialog(this, { drawerOnMobile: true });
		contentEl.addClass("open-bible-resource-chooser-modal");

		const ref = this.links[0]?.reference || "";
		this.titleEl.setText(
			this.links.length > 0
				? `${t("modals.linkResourceTitle")} · ${ref}`
				: t("modals.linkResourceTitle"),
		);

		const listEl = contentEl.createDiv("open-bible-resource-chooser-list");
		for (const link of this.links) {
			const type = this.plugin.resourceService?.getResourceType(link.resourceType);
			const row = listEl.createDiv("open-bible-resource-chooser-row");

			const mainBtn = row.createDiv("open-bible-resource-chooser-main");
			mainBtn.setAttribute("role", "button");
			mainBtn.setAttribute("tabindex", "0");
			const iconEl = mainBtn.createSpan("open-bible-resource-chooser-icon");
			if (type?.color) iconEl.style.color = type.color;
			setIcon(iconEl, type?.icon || "link");
			const textWrap = mainBtn.createDiv("open-bible-resource-chooser-text");
			textWrap.createDiv({
				text: link.resourceName,
				cls: "open-bible-resource-chooser-name",
			});
			textWrap.createDiv({
				text: `${type?.label || link.resourceType} · ${link.reference}`,
				cls: "open-bible-resource-chooser-sub",
			});
			const open = () => {
				this.close();
				this.onSelect(link);
			};
			mainBtn.addEventListener("click", open);
			mainBtn.addEventListener("keydown", (e) => {
				if (e.key === "Enter" || e.key === " ") {
					e.preventDefault();
					open();
				}
			});

			const unlinkBtn = row.createEl("button", {
				type: "button",
				cls: "clickable-icon open-bible-resource-chooser-unlink",
				title: t("resourcesPanel.unlinkTooltip"),
				attr: { "aria-label": t("resourcesPanel.unlinkTooltip") },
			});
			setIcon(unlinkBtn, "unlink");
			unlinkBtn.addEventListener("click", (e) => {
				e.stopPropagation();
				this.close();
				this.onUnlink(link.path);
			});
		}

		const footer = createUiFooter(contentEl);
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
