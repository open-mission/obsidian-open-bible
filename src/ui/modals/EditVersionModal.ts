import { App, Modal, Setting } from "obsidian";
import type { BibleVersion } from "../../models/bibleVersion";
import { t } from "../../i18n";

export interface VersionMetadataEditResult {
	name: string;
	abbreviation: string;
	language: string;
	isDefault: boolean;
}

export class EditVersionModal extends Modal {
	private name: string;
	private abbreviation: string;
	private language: string;
	private isDefault: boolean;

	constructor(
		app: App,
		private readonly version: BibleVersion,
		private readonly onSave: (result: VersionMetadataEditResult) => Promise<void>,
	) {
		super(app);
		this.name = version.name;
		this.abbreviation = version.abbreviation;
		this.language = version.language ?? "";
		this.isDefault = Boolean(version.isDefault);
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass("open-bible-edit-version-modal");

		this.titleEl.setText(t("settings.editVersionTitle"));

		// Readonly path reference (preserves SQLite file binding)
		new Setting(contentEl)
			.setName(t("settings.versionPathLabel"))
			.setDesc(this.version.filePath)
			.setClass("ob-setting-readonly");

		// Version Name
		new Setting(contentEl)
			.setName(t("settings.versionNameLabel"))
			.addText((text) =>
				text
					.setValue(this.name)
					.onChange((v) => {
						this.name = v;
					})
			);

		// Abbreviation
		new Setting(contentEl)
			.setName(t("settings.versionAbbrLabel"))
			.addText((text) =>
				text
					.setValue(this.abbreviation)
					.onChange((v) => {
						this.abbreviation = v;
					})
			);

		// Language
		new Setting(contentEl)
			.setName(t("settings.versionLanguageLabel"))
			.addText((text) =>
				text
					.setPlaceholder(t("settings.versionLanguagePlaceholder"))
					.setValue(this.language)
					.onChange((v) => {
						this.language = v;
					})
			);

		// Primary / Default toggle
		new Setting(contentEl)
			.setName(t("settings.setAsDefaultLabel"))
			.setDesc(t("settings.setAsDefaultDesc"))
			.addToggle((toggle) =>
				toggle
					.setValue(this.isDefault)
					.onChange((v) => {
						this.isDefault = v;
					})
			);

		// Action buttons
		new Setting(contentEl)
			.addButton((btn) =>
				btn.setButtonText(t("common.cancel")).onClick(() => {
					this.close();
				})
			)
			.addButton((btn) =>
				btn
					.setButtonText(t("common.save"))
					.setCta()
					.onClick(async () => {
						await this.onSave({
							name: this.name.trim() || this.version.name,
							abbreviation: this.abbreviation.trim().toUpperCase() || this.version.abbreviation,
							language: this.language.trim(),
							isDefault: this.isDefault,
						});
						this.close();
					})
			);
	}

	onClose(): void {
		const { contentEl } = this;
		contentEl.empty();
	}
}
