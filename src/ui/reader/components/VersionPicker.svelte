<script lang="ts">
	import { icon } from "../../actions/icon";
	import type { BibleVersion } from "../../../models/bibleVersion";
	import { t } from "../../../i18n";
	import PickerHeader from "../../kit/PickerHeader.svelte";

	interface Props {
		versions: BibleVersion[];
		currentDatabasePath?: string;
		currentAbbr?: string;
		onSelectDatabase: (path: string) => void;
		onClose: () => void;
	}

	let {
		versions,
		currentDatabasePath,
		currentAbbr,
		onSelectDatabase,
		onClose,
	}: Props = $props();

	function getFilename(path: string): string {
		return path.includes("/") ? path.slice(path.lastIndexOf("/") + 1) : path;
	}
</script>

<PickerHeader
	title={t("versionPicker.title")}
	subtitle={versions.length === 1
		? t("versionPicker.installedCountSingle")
		: t("versionPicker.installedCountPlural", { count: versions.length })}
	closeLabel={t("versionPicker.close")}
	{onClose}
/>

<div class="open-bible-versions-grid">
	{#each versions as v (v.filePath)}
		{@const isCurrent = (currentDatabasePath && v.filePath === currentDatabasePath) || (currentAbbr && v.abbreviation.toUpperCase() === currentAbbr.toUpperCase())}
		<button
			type="button"
			class="open-bible-version-tile"
			class:is-active={isCurrent}
			aria-label={t("versionPicker.selectVersionAria", { name: v.name })}
			onclick={() => {
				onClose();
				if (!isCurrent) {
					onSelectDatabase(v.filePath);
				}
			}}
		>
			<div class="open-bible-version-badge">{v.abbreviation}</div>
			<div class="open-bible-version-info">
				<span class="open-bible-version-name">{v.name}</span>
				<span class="open-bible-version-file">{getFilename(v.filePath)}</span>
			</div>
			{#if isCurrent}
				<div class="open-bible-version-check">
					<span use:icon={"check"}></span>
				</div>
			{/if}
		</button>
	{/each}
</div>
