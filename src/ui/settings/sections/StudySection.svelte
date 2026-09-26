<script lang="ts">
	import { t } from "../../../i18n";
	import type { SectionContext } from "../types";
	import type { BibleVersion } from "../../../models/bibleVersion";
	import type { VerseHoverModifier, VerseInsertPosition } from "../../../settings";
	import Toggle from "../../kit/Toggle.svelte";

	let { service, settings, updateGeneral }: SectionContext = $props();

	let versions = $state<BibleVersion[]>([]);
	let loadingVersions = $state(true);

	$effect(() => {
		void loadVersions();
	});

	async function loadVersions(): Promise<void> {
		loadingVersions = true;
		try {
			versions = await service.listVersions();
		} catch (error) {
			console.error("Failed to load versions for study settings", error);
		} finally {
			loadingVersions = false;
		}
	}
</script>

<div class="setting-item setting-item-heading">
	<div class="setting-item-info">
		<div class="setting-item-name">{t("settings.versePreviewsHeading")}</div>
		<div class="setting-item-description">{t("settings.versePreviewsDesc")}</div>
	</div>
</div>

<!-- Master Switch -->
<div class="setting-item">
	<div class="setting-item-info">
		<div class="setting-item-name">{t("settings.enableVersePreviewsName")}</div>
		<div class="setting-item-description">{t("settings.enableVersePreviewsDesc")}</div>
	</div>
	<div class="setting-item-control">
		<Toggle
			checked={settings.enableVersePreviews ?? true}
			ariaLabel={t("settings.enableVersePreviewsName")}
			onchange={(checked) => void updateGeneral({ enableVersePreviews: checked })}
		/>
	</div>
</div>

{#if settings.enableVersePreviews ?? true}
	<!-- Hover Preview Toggle -->
	<div class="setting-item">
		<div class="setting-item-info">
			<div class="setting-item-name">{t("settings.enableVerseHoverPreviewName")}</div>
			<div class="setting-item-description">{t("settings.enableVerseHoverPreviewDesc")}</div>
		</div>
		<div class="setting-item-control">
			<Toggle
				checked={settings.enableVerseHoverPreview ?? true}
				ariaLabel={t("settings.enableVerseHoverPreviewName")}
				onchange={(checked) => void updateGeneral({ enableVerseHoverPreview: checked })}
			/>
		</div>
	</div>

	<!-- Modifier Key for Hover -->
	{#if settings.enableVerseHoverPreview ?? true}
		<div class="setting-item">
			<div class="setting-item-info">
				<div class="setting-item-name">{t("settings.verseHoverModifierName")}</div>
				<div class="setting-item-description">{t("settings.verseHoverModifierDesc")}</div>
			</div>
			<div class="setting-item-control">
				<select
					class="dropdown"
					value={settings.verseHoverModifier ?? "shift"}
					aria-label={t("settings.verseHoverModifierName")}
					onchange={(e) => void updateGeneral({ verseHoverModifier: e.currentTarget.value as VerseHoverModifier })}
				>
					<option value="shift">{t("settings.verseHoverModifierShift")}</option>
					<option value="ctrlCmd">{t("settings.verseHoverModifierCtrlCmd")}</option>
					<option value="alt">{t("settings.verseHoverModifierAlt")}</option>
					<option value="none">{t("settings.verseHoverModifierNone")}</option>
				</select>
			</div>
		</div>
	{/if}

	<!-- Click Preview Toggle -->
	<div class="setting-item">
		<div class="setting-item-info">
			<div class="setting-item-name">{t("settings.enableVerseClickPreviewName")}</div>
			<div class="setting-item-description">{t("settings.enableVerseClickPreviewDesc")}</div>
		</div>
		<div class="setting-item-control">
			<Toggle
				checked={settings.enableVerseClickPreview ?? true}
				ariaLabel={t("settings.enableVerseClickPreviewName")}
				onchange={(checked) => void updateGeneral({ enableVerseClickPreview: checked })}
			/>
		</div>
	</div>

	<!-- Default Preview Bible Version -->
	<div class="setting-item">
		<div class="setting-item-info">
			<div class="setting-item-name">{t("settings.previewDefaultVersionName")}</div>
			<div class="setting-item-description">{t("settings.previewDefaultVersionDesc")}</div>
		</div>
		<div class="setting-item-control">
			<select
				class="dropdown"
				value={settings.previewDefaultVersion ?? ""}
				disabled={loadingVersions}
				aria-label={t("settings.previewDefaultVersionName")}
				onchange={(e) => void updateGeneral({ previewDefaultVersion: e.currentTarget.value })}
			>
				<option value="">{t("settings.previewDefaultVersionSameAsReader")}</option>
				{#each versions as v (v.filePath)}
					<option value={v.abbreviation}>
						{v.abbreviation} — {v.name}
					</option>
				{/each}
			</select>
		</div>
	</div>

	<!-- Verse Quote Insertion Position -->
	<div class="setting-item">
		<div class="setting-item-info">
			<div class="setting-item-name">{t("settings.verseInsertPositionName")}</div>
			<div class="setting-item-description">{t("settings.verseInsertPositionDesc")}</div>
		</div>
		<div class="setting-item-control">
			<select
				class="dropdown"
				value={settings.verseInsertPosition ?? "below"}
				aria-label={t("settings.verseInsertPositionName")}
				onchange={(e) => void updateGeneral({ verseInsertPosition: e.currentTarget.value as VerseInsertPosition })}
			>
				<option value="below">{t("settings.verseInsertPositionBelow")}</option>
				<option value="above">{t("settings.verseInsertPositionAbove")}</option>
			</select>
		</div>
	</div>
{/if}

<!-- Canvas & Excalidraw Templates & Export Folders -->
<div class="setting-item setting-item-heading">
	<div class="setting-item-info">
		<div class="setting-item-name">{t("settings.canvasHeading")}</div>
		<div class="setting-item-description">{t("settings.canvasHeadingDesc")}</div>
	</div>
</div>

<div class="setting-item">
	<div class="setting-item-info">
		<div class="setting-item-name">{t("settings.canvasExportFolderName")}</div>
		<div class="setting-item-description">{t("settings.canvasExportFolderDesc")}</div>
	</div>
	<div class="setting-item-control">
		<input
			type="text"
			class="text-input"
			value={settings.canvasExportFolder ?? "OpenBible/canvas"}
			placeholder="OpenBible/canvas"
			aria-label={t("settings.canvasExportFolderName")}
			onchange={(e) => void updateGeneral({ canvasExportFolder: (e.target as HTMLInputElement).value.trim() || "OpenBible/canvas" })}
		/>
	</div>
</div>

<div class="setting-item">
	<div class="setting-item-info">
		<div class="setting-item-name">{t("settings.canvasTemplatesFolderName")}</div>
		<div class="setting-item-description">{t("settings.canvasTemplatesFolderDesc")}</div>
	</div>
	<div class="setting-item-control">
		<input
			type="text"
			class="text-input"
			value={settings.canvasTemplatesFolder ?? "Templates/Canvas"}
			placeholder="Templates/Canvas"
			aria-label={t("settings.canvasTemplatesFolderName")}
			onchange={(e) => void updateGeneral({ canvasTemplatesFolder: (e.target as HTMLInputElement).value.trim() || "Templates/Canvas" })}
		/>
	</div>
</div>
