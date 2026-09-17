import { Modal, type App } from "obsidian";
import type OpenBiblePlugin from "../../main";
import { t } from "../../i18n";
import type { ResourceTypeConfig } from "../../settings";
import type { BibleResourceItem } from "../../models/resource";
import { createUiButton, createUiFooter, setupOpenBibleDialog } from "../kit/dom";

/** Modal to pick an existing resource or create a new one, then link it. */
export class ResourceLinkModal extends Modal {
	private query = "";

	constructor(
		app: App,
		private plugin: OpenBiblePlugin,
		private resourceType: ResourceTypeConfig,
		private referenceLabel: string,
		private onLink: (resource: BibleResourceItem, matchAll?: boolean) => void | Promise<void>,
		private onCreateAndLink: (name: string, matchAll?: boolean) => void | Promise<void>,
		private selectedSnippet?: string,
	) {
		super(app);
		if (this.selectedSnippet) {
			this.query = this.selectedSnippet.trim();
		}
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.empty();
		setupOpenBibleDialog(this, { drawerOnMobile: true });
		contentEl.addClass("open-bible-resource-link-modal");

		this.titleEl.setText(`${t("modals.linkResourceTitle")}: ${this.resourceType.label} — ${this.referenceLabel}`);

		const searchWrap = contentEl.createDiv("open-bible-resource-link-search");
		const input = searchWrap.createEl("input", {
			type: "text",
			placeholder: t("modals.resourceNamePlaceholder"),
			cls: "text-input open-bible-resource-link-input",
		});
		if (this.selectedSnippet) {
			input.value = this.selectedSnippet.trim();
		}
		input.focus();
		if (this.selectedSnippet) {
			input.select();
		}

		let matchAllOccurrences = false;
		if (this.selectedSnippet) {
			const scopeWrap = contentEl.createDiv("open-bible-resource-link-scope");
			const scopeHeader = scopeWrap.createDiv("open-bible-resource-link-scope-header");
			scopeHeader.createSpan({
				text: t("modals.linkScopeLabel") || "Ocorrências:",
				cls: "open-bible-resource-link-scope-title",
			});

			const optionsWrap = scopeWrap.createDiv("open-bible-resource-link-scope-options");

			const optSingle = optionsWrap.createEl("label", { cls: "open-bible-scope-radio-label" });
			const radioSingle = optSingle.createEl("input", {
				type: "radio",
				value: "single",
				attr: { name: "open-bible-resource-scope" },
			});
			radioSingle.checked = true;
			optSingle.createSpan({
				text: t("modals.linkScopeThisOnly") || "Apenas esta ocorrência",
			});

			const optAll = optionsWrap.createEl("label", { cls: "open-bible-scope-radio-label" });
			const radioAll = optAll.createEl("input", {
				type: "radio",
				value: "all",
				attr: { name: "open-bible-resource-scope" },
			});
			radioAll.checked = false;
			optAll.createSpan({
				text: t("modals.linkScopeAllOccurrences") || "Todas as ocorrências da palavra",
			});

			radioSingle.addEventListener("change", () => {
				if (radioSingle.checked) matchAllOccurrences = false;
			});
			radioAll.addEventListener("change", () => {
				if (radioAll.checked) matchAllOccurrences = true;
			});
		}

		const listEl = contentEl.createDiv("open-bible-resource-link-list");
		const render = () => {
			listEl.empty();
			const service = this.plugin.resourceService;
			if (!service) return;
			const all = service.getResourcesByType(this.resourceType.id);
			const q = this.query.trim().toLowerCase();
			const filtered = q
				? all.filter((r) => r.name.toLowerCase().includes(q))
				: all;

			const heading = listEl.createDiv("open-bible-resource-link-heading");
			heading.setText(`${t("modals.existingResources")} (${filtered.length})`);

			if (filtered.length === 0) {
				listEl.createEl("p", {
					text: t("modals.noResourcesFound"),
					cls: "open-bible-resource-link-empty",
				});
			} else {
				for (const resource of filtered.slice(0, 50)) {
					const row = listEl.createDiv("open-bible-resource-link-row");
					row.createSpan({ text: resource.name, cls: "open-bible-resource-link-name" });
					const btn = row.createEl("button", {
						type: "button",
						cls: "open-bible-ui-btn is-small",
						text: t("popover.linkResource"),
					});
					btn.addEventListener("click", async () => {
						this.close();
						await this.onLink(resource, matchAllOccurrences);
					});
				}
			}
		};

		input.addEventListener("input", () => {
			this.query = input.value;
			render();
		});
		input.addEventListener("keydown", (e) => {
			if (e.key === "Enter") {
				e.preventDefault();
				const name = input.value.trim();
				if (name) {
					this.close();
					void this.onCreateAndLink(name, matchAllOccurrences);
				}
			}
		});
		render();

		const footer = createUiFooter(contentEl);
		createUiButton(footer, {
			text: t("common.cancel"),
			variant: "ghost",
			onClick: () => this.close(),
		});
		createUiButton(footer, {
			text: t("modals.createResourceBtn"),
			variant: "cta",
			icon: "plus",
			onClick: () => {
				const name = input.value.trim() || this.query.trim();
				if (!name) {
					input.focus();
					return;
				}
				this.close();
				void this.onCreateAndLink(name, matchAllOccurrences);
			},
		});
	}

	onClose(): void {
		this.contentEl.empty();
	}
}
