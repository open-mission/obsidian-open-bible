import { Modal, Setting, type App } from "obsidian";
import type OpenBiblePlugin from "../../main";
import { t } from "../../i18n";
import { createUiButton, createUiFooter, setupOpenBibleDialog } from "../kit/dom";

export class ConfirmDeleteHighlightModal extends Modal {
	private readonly plugin: OpenBiblePlugin;
	private readonly reference: string;
	private readonly onConfirm: () => void | Promise<void>;
	private alwaysAsk: boolean;

	constructor(
		app: App,
		plugin: OpenBiblePlugin,
		reference: string,
		onConfirm: () => void | Promise<void>
	) {
		super(app);
		this.plugin = plugin;
		this.reference = reference;
		this.onConfirm = onConfirm;
		this.alwaysAsk = this.plugin.settings.confirmHighlightDeletion ?? true;
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.empty();
		setupOpenBibleDialog(this);
		contentEl.addClass("open-bible-confirm-modal");

		this.titleEl.setText(t("modals.confirmDeleteTitle"));

		contentEl.createEl("p", {
			text: t("modals.confirmDeleteDesc", { reference: this.reference }),
		});

		new Setting(contentEl)
			.setName(t("modals.confirmDeleteAlwaysAsk"))
			.addToggle((toggle) => {
				toggle.setValue(this.alwaysAsk).onChange((val) => {
					this.alwaysAsk = val;
				});
			});

		const footer = createUiFooter(contentEl);
		createUiButton(footer, {
			text: t("common.cancel"),
			variant: "ghost",
			onClick: () => this.close(),
		});
		createUiButton(footer, {
			text: t("common.delete"),
			variant: "warning",
			onClick: async () => {
				if (this.plugin.settings.confirmHighlightDeletion !== this.alwaysAsk) {
					this.plugin.settings.confirmHighlightDeletion = this.alwaysAsk;
					await this.plugin.saveSettings();
				}
				this.close();
				await this.onConfirm();
			},
		});
	}

	onClose(): void {
		this.contentEl.empty();
	}
}
