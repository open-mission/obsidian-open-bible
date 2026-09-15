<script lang="ts">
	import { t } from "../../../i18n";
	import type { LocalePreference } from "../../../i18n";
	import type { SectionContext } from "../types";

	let { settings, updateGeneral }: SectionContext = $props();

	let language = $state<LocalePreference>("auto");
	let saving = $state(false);

	$effect(() => {
		language = settings.language;
	});

	async function onLanguageChange(event: Event): Promise<void> {
		const value = (event.currentTarget as HTMLSelectElement).value as LocalePreference;
		language = value;
		saving = true;
		try {
			// updateGeneral applies the new locale, so every t() call re-renders.
			await updateGeneral({ language: value });
		} finally {
			saving = false;
		}
	}
</script>

<div class="setting-item">
	<div class="setting-item-info">
		<div class="setting-item-name">{t("settings.languageSettingName")}</div>
		<div class="setting-item-description">{t("settings.languageSettingDesc")}</div>
	</div>
	<div class="setting-item-control">
		<select
			value={language}
			onchange={onLanguageChange}
			disabled={saving}
			aria-label={t("settings.languageSettingName")}
		>
			<option value="auto">{t("settings.languageAuto")}</option>
			<option value="pt">{t("settings.languagePt")}</option>
			<option value="en">{t("settings.languageEn")}</option>
		</select>
	</div>
</div>