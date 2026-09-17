import { Modal, type App, Notice } from "obsidian";
import type OpenBiblePlugin from "../../main";
import { t } from "../../i18n";
import type { BibleResourceItem } from "../../models/resource";
import { createUiButton, createUiFooter, setupOpenBibleDialog } from "../kit/dom";

/**
 * Modal dialog for creating a new study resource note (e.g. Person, Place, Topic)
 * in the vault's designated resource folder with valid frontmatter.
 */
export class CreateResourceModal extends Modal {
	private name = "";
	private selectedTypeId: string;

	constructor(
		app: App,
		private plugin: OpenBiblePlugin,
		private onCreated: (item: BibleResourceItem) => void,
		initialTypeId?: string,
	) {
		super(app);
		const types = this.plugin.resourceService?.getResourceTypes() ?? [];
		this.selectedTypeId = initialTypeId || types[0]?.id || "person";
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.empty();
		setupOpenBibleDialog(this, { drawerOnMobile: true });
		contentEl.addClass("open-bible-create-resource-modal");

		this.titleEl.setText(t("modals.createResourceModalTitle") || "Criar novo recurso de estudo");

		// Resource Type Field
		const typeField = contentEl.createDiv("open-bible-create-resource-field");
		typeField.createEl("label", {
			text: t("modals.resourceTypeLabel") || "Tipo de recurso",
			cls: "open-bible-create-resource-label",
		});

		const selectEl = typeField.createEl("select", {
			cls: "dropdown open-bible-create-resource-select",
		});
		const types = this.plugin.resourceService?.getResourceTypes() ?? [];
		for (const type of types) {
			const opt = selectEl.createEl("option", {
				value: type.id,
				text: type.label,
			});
			if (type.id === this.selectedTypeId) {
				opt.selected = true;
			}
		}
		selectEl.addEventListener("change", () => {
			this.selectedTypeId = selectEl.value;
		});

		// Resource Name Field
		const nameField = contentEl.createDiv("open-bible-create-resource-field");
		nameField.createEl("label", {
			text: t("modals.resourceNamePlaceholder") || "Nome",
			cls: "open-bible-create-resource-label",
		});

		const inputEl = nameField.createEl("input", {
			type: "text",
			placeholder: t("modals.resourceNamePlaceholder") || "Nome do recurso...",
			cls: "text-input open-bible-create-resource-input",
		});
		inputEl.focus();

		inputEl.addEventListener("input", () => {
			this.name = inputEl.value;
		});

		const submit = async () => {
			const cleanName = this.name.trim();
			if (!cleanName) {
				inputEl.focus();
				return;
			}
			try {
				const created = await this.plugin.resourceService.ensureResource(this.selectedTypeId, cleanName);
				new Notice(t("notices.resourceCreated") || "Recurso criado!");
				this.close();
				this.onCreated(created);
			} catch (err) {
				console.error("OpenBible: failed to create resource", err);
				new Notice(String(err));
			}
		};

		inputEl.addEventListener("keydown", (e) => {
			if (e.key === "Enter") {
				e.preventDefault();
				void submit();
			}
		});

		// Footer Buttons
		const footer = createUiFooter(contentEl);
		createUiButton(footer, {
			text: t("common.cancel"),
			variant: "ghost",
			onClick: () => this.close(),
		});
		createUiButton(footer, {
			text: t("modals.createResourceBtn") || "Criar recurso",
			variant: "cta",
			icon: "plus",
			onClick: () => void submit(),
		});
	}

	onClose(): void {
		this.contentEl.empty();
	}
}
