<script lang="ts">
	import { Notice } from "obsidian";
	import { getVersionsFolder } from "../../../core/paths";
	import { t } from "../../../i18n";
	import type { SectionContext } from "../types";
	import BibleVersionsSettings from "../versions/BibleVersionsSettings.svelte";

	let { app, service, settings, updateDataFolder }: SectionContext = $props();

	let dataFolder = $state("");
	let activeFolder = $state("");
	let revision = $state(0);
	let saving = $state(false);

	$effect(() => {
		dataFolder = settings.dataFolder;
		activeFolder = settings.dataFolder;
	});

	async function saveFolder(): Promise<void> {
		saving = true;
		try {
			const saved = await updateDataFolder(dataFolder);
			dataFolder = saved;
			activeFolder = saved;
			revision += 1;
			new Notice(t("settings.folderUpdatedNotice"));
		} catch (error) {
			new Notice(error instanceof Error ? error.message : t("errors.invalidFolderPath"));
		} finally {
			saving = false;
		}
	}
</script>

<div class="setting-item">
	<div class="setting-item-info">
		<div class="setting-item-name">{t("settings.dataFolderName")}</div>
		<div class="setting-item-description">{t("settings.dataFolderPathDesc")}</div>
		<div class="setting-item-description">
			<code>{getVersionsFolder(activeFolder)}/</code>
		</div>
	</div>
	<div class="setting-item-control">
		<input
			type="text"
			placeholder="OpenBible"
			bind:value={dataFolder}
			aria-label={t("settings.dataFolderName")}
		/>
		<button onclick={saveFolder} disabled={saving}>
			{saving ? t("common.saving") : t("common.save")}
		</button>
	</div>
</div>

<BibleVersionsSettings
	app={app}
	service={service}
	folder={getVersionsFolder(activeFolder)}
	revision={revision}
/>
