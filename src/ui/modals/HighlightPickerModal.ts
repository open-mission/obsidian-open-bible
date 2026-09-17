import { Modal, setIcon, type App } from "obsidian";
import { t } from "../../i18n";
import type { HighlightConfig } from "../../settings";
import { resolveHighlightCssColor } from "../reader/highlightStyles";
import { createUiButton, createUiFooter, setupOpenBibleDialog } from "../kit/dom";

/** Modal presenting highlight options for selected verses or word. */
export class HighlightPickerModal extends Modal {
	constructor(
		app: App,
		private reference: string,
		private highlights: HighlightConfig[],
		private currentColor: string | null | undefined,
		private onSelectHighlight: (colorId: string) => void,
		private onRemoveHighlight?: () => void,
		private onOpenSettings?: () => void,
	) {
		super(app);
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.empty();
		setupOpenBibleDialog(this, { drawerOnMobile: true });
		contentEl.addClass("open-bible-highlight-picker-modal");

		this.titleEl.setText(t("popover.selectHighlight") || "Selecione um destaque");

		if (this.reference) {
			contentEl.createDiv({
				text: this.reference,
				cls: "open-bible-picker-subtitle",
			});
		}

		const listEl = contentEl.createDiv("open-bible-highlights-drawer-list");

		for (const hl of this.highlights) {
			const isSelected = this.currentColor === hl.id || this.currentColor === hl.color;
			const cssColor = resolveHighlightCssColor(hl.color);

			const btn = listEl.createEl("button", {
				type: "button",
				cls: `open-bible-highlights-drawer-item ${isSelected ? "is-active" : ""}`,
			});

			const dot = btn.createSpan({ cls: "open-bible-highlights-drawer-dot" });
			dot.style.backgroundColor = cssColor;
			if (isSelected) {
				const check = dot.createSpan({ cls: "open-bible-highlights-drawer-check" });
				setIcon(check, "check");
			}

			btn.createSpan({ text: hl.label, cls: "open-bible-highlights-drawer-label" });

			btn.addEventListener("click", () => {
				this.close();
				this.onSelectHighlight(hl.id);
			});
		}

		const footer = createUiFooter(contentEl);

		if (this.currentColor && this.onRemoveHighlight) {
			createUiButton(footer, {
				text: t("popover.removeHighlight") || "Remover destaque",
				variant: "warning",
				icon: "trash-2",
				onClick: () => {
					this.close();
					this.onRemoveHighlight?.();
				},
			});
		}

		if (this.onOpenSettings) {
			createUiButton(footer, {
				text: t("popover.configureHighlights") || "Configurar destaques...",
				variant: "ghost",
				icon: "settings",
				onClick: () => {
					this.close();
					this.onOpenSettings?.();
				},
			});
		}

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
