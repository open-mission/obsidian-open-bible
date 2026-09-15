<script lang="ts">
	import { Notice } from "obsidian";
	import { t } from "../../../i18n";
	import type { SectionContext } from "../types";

	let { settings, updateGeneral }: SectionContext = $props();

	let defaultReference = $state("");

	$effect(() => {
		defaultReference = settings.defaultReference;
	});
	let saving = $state(false);

	async function save(): Promise<void> {
		saving = true;
		try {
			await updateGeneral({ defaultReference });
			new Notice(t("common.saved"));
		} catch (error) {
			new Notice(error instanceof Error ? error.message : t("common.saveError"));
		} finally {
			saving = false;
		}
	}
</script>

<div class="setting-item">
	<div class="setting-item-info">
		<div class="setting-item-name">{t("settings.defaultReferenceName")}</div>
		<div class="setting-item-description">{t("settings.defaultReferenceDesc")}</div>
	</div>
	<div class="setting-item-control">
		<input
			type="text"
			placeholder={t("view.referencePlaceholder")}
			bind:value={defaultReference}
			aria-label={t("settings.defaultReferenceName")}
		/>
		<button onclick={save} disabled={saving}>
			{saving ? t("common.saving") : t("common.save")}
		</button>
	</div>
</div>
