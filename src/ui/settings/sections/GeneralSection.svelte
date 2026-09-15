<script lang="ts">
	import { Notice } from "obsidian";
	import { t } from "../../../i18n";
	import type { SectionContext } from "../types";
	import type { BibleVersion } from "../../../models/bibleVersion";

	let { service, settings, updateGeneral }: SectionContext = $props();

	let defaultVersionPath = $state("");
	let versions = $state<BibleVersion[]>([]);
	let loadingVersions = $state(true);

	$effect(() => {
		defaultVersionPath = settings.defaultVersionPath ?? "";
	});

	$effect(() => {
		void loadVersions();
	});

	async function loadVersions(): Promise<void> {
		loadingVersions = true;
		try {
			versions = await service.listVersions();
		} catch (error) {
			console.error("Failed to load versions in general settings", error);
		} finally {
			loadingVersions = false;
		}
	}

	async function onVersionChange(event: Event): Promise<void> {
		const target = event.target as HTMLSelectElement;
		const newPath = target.value;
		defaultVersionPath = newPath;
		try {
			await service.setDefaultVersion(newPath);
			await updateGeneral({ defaultVersionPath: newPath });
			new Notice(t("settings.versionUpdatedNotice"));
		} catch (error) {
			new Notice(error instanceof Error ? error.message : t("common.saveError"));
		}
	}
</script>

<div class="setting-item">
	<div class="setting-item-info">
		<div class="setting-item-name">{t("settings.defaultVersionName")}</div>
		<!-- <div class="setting-item-description">{t("settings.defaultVersionDesc")}</div> -->
	</div>
	<div class="setting-item-control">
		<select
			class="dropdown"
			value={defaultVersionPath}
			onchange={onVersionChange}
			disabled={loadingVersions}
			aria-label={t("settings.defaultVersionName")}
		>
			<option value="">{t("settings.defaultVersionNone")}</option>
			{#each versions as v (v.filePath)}
				<option value={v.filePath}>
					{v.name} ({v.abbreviation}){v.language ? ` - ${v.language}` : ""}
				</option>
			{/each}
		</select>
	</div>
</div>
