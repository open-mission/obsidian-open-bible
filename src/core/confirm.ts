import { App, Modal } from "obsidian";
import { t } from "../i18n";

interface ConfirmOptions {
	title: string;
	message: string;
	confirmText?: string;
	cancelText?: string;
}

/** Native and reusable confirmation dialog. Resolves true only on confirm. */
export function confirmAction(app: App, options: ConfirmOptions): Promise<boolean> {
	return new Promise((resolve) => {
		new ConfirmModal(app, options, resolve).open();
	});
}

class ConfirmModal extends Modal {
	private settled = false;

	constructor(
		app: App,
		private readonly options: ConfirmOptions,
		private readonly resolve: (value: boolean) => void,
	) {
		super(app);
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.createEl("h2", { text: this.options.title });
		contentEl.createEl("p", { text: this.options.message, cls: "ob-confirm-message" });

		const actions = contentEl.createDiv("modal-button-container");
		const cancel = actions.createEl("button", { text: this.options.cancelText ?? t("common.cancel") });
		cancel.addEventListener("click", () => this.finish(false));
		const confirm = actions.createEl("button", {
			text: this.options.confirmText ?? t("common.confirm"),
			cls: "mod-warning",
		});
		confirm.addEventListener("click", () => this.finish(true));
	}

	onClose(): void {
		this.finish(false);
	}

	private finish(value: boolean): void {
		if (this.settled) return;
		this.settled = true;
		this.close();
		this.resolve(value);
	}
}
