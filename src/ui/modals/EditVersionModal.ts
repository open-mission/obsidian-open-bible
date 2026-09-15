import { App, Modal, Setting } from "obsidian";
import type { BibleVersion } from "../../models/bibleVersion";
import { t } from "../../i18n";
import { BIBLE_LANGUAGES } from "../../constants";

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

		if (this.version.mdPath) {
			new Setting(contentEl)
				.setName(t("settings.versionMdPathLabel"))
				.setDesc(this.version.mdPath)
				.setClass("ob-setting-readonly");
		}

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

		// Language (Select dropdown + optional custom input)
		const findMatchedLanguage = (val: string): string => {
			const clean = val.trim().toLowerCase();
			if (!clean) return "";
			const exactCode = BIBLE_LANGUAGES.find((l) => l.code.toLowerCase() === clean);
			if (exactCode) return exactCode.code;
			const exactLabel = BIBLE_LANGUAGES.find((l) => l.label.toLowerCase() === clean);
			if (exactLabel) return exactLabel.code;
			const startsWith = BIBLE_LANGUAGES.find(
				(l) => clean.startsWith(l.code.toLowerCase()) || clean.startsWith(l.label.toLowerCase())
			);
			if (startsWith) return startsWith.code;
			return "__custom__";
		};

		let selectedDropdown = findMatchedLanguage(this.language);
		let customLangValue = selectedDropdown === "__custom__" ? this.language : "";
		let customLanguageSetting: Setting | null = null;

		new Setting(contentEl)
			.setName(t("settings.versionLanguageLabel"))
			.addDropdown((dropdown) => {
				dropdown.addOption("", t("settings.versionLanguageNone"));
				for (const lang of BIBLE_LANGUAGES) {
					dropdown.addOption(lang.code, `${lang.label} (${lang.code})`);
				}
				dropdown.addOption("__custom__", t("settings.versionLanguageCustom"));
				dropdown.setValue(selectedDropdown);
				dropdown.onChange((val) => {
					selectedDropdown = val;
					if (val === "__custom__") {
						this.language = customLangValue;
						if (customLanguageSetting) {
							customLanguageSetting.settingEl.style.display = "";
						}
					} else {
						this.language = val;
						if (customLanguageSetting) {
							customLanguageSetting.settingEl.style.display = "none";
						}
					}
				});
			});

		customLanguageSetting = new Setting(contentEl)
			.setName(t("settings.versionLanguageCustomLabel"))
			.addText((text) =>
				text
					.setPlaceholder(t("settings.versionLanguagePlaceholder"))
					.setValue(customLangValue)
					.onChange((v) => {
						customLangValue = v;
						if (selectedDropdown === "__custom__") {
							this.language = v;
						}
					})
			);

		if (selectedDropdown !== "__custom__") {
			customLanguageSetting.settingEl.style.display = "none";
		}

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
