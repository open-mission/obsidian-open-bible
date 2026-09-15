<script lang="ts">
	import { icon } from "../../actions/icon";
	import type { BibleVersion } from "../../../models/bibleVersion";
	import { t } from "../../../i18n";
	import { normalizeText } from "../../../constants";
	import PickerHeader from "../../kit/PickerHeader.svelte";
	import SearchField from "../../kit/SearchField.svelte";

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

	let searchQuery = $state("");

	let filteredVersions = $derived.by(() => {
		const q = normalizeText(searchQuery);
		if (!q) return versions;
		return versions.filter((v) => {
			const name = normalizeText(v.name);
			const abbr = normalizeText(v.abbreviation);
			const lang = v.language ? normalizeText(v.language) : "";
			return (
				name.includes(q) ||
				abbr.includes(q) ||
				lang.includes(q) ||
				v.filePath.toLowerCase().includes(q)
			);
		});
	});

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

{#if versions.length > 2}
	<div class="open-bible-picker-search-container">
		<SearchField
			bind:value={searchQuery}
			placeholder={t("settings.searchVersionsPlaceholder")}
		/>
	</div>
{/if}

<div class="open-bible-versions-grid">
	{#if filteredVersions.length === 0}
		<div class="open-bible-picker-empty">
			{t("settings.noVersionsFound")}
		</div>
	{:else}
		{#each filteredVersions as v (v.filePath)}
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
					<div class="open-bible-version-title-row">
						<span class="open-bible-version-name">{v.name}</span>
						{#if v.isDefault}
							<span class="open-bible-version-default-tag">{t("settings.isDefaultBadge")}</span>
						{/if}
					</div>
					<span class="open-bible-version-file">{v.language ? `${v.language} • ` : ""}{getFilename(v.filePath)}</span>
				</div>
				{#if isCurrent}
					<div class="open-bible-version-check">
						<span use:icon={"check"}></span>
					</div>
				{/if}
			</button>
		{/each}
	{/if}
</div>

