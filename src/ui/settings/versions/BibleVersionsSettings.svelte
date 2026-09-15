<script lang="ts">
	import { Notice, type App } from "obsidian";
	import type { BibleVersionService } from "../../../services/bibleVersionService";
	import type { BibleVersion } from "../../../models/bibleVersion";
	import { confirmAction } from "../../../core/confirm";
	import { t } from "../../../i18n";
	import { normalizeText } from "../../../constants";
	import { lucide } from "../../core/icons";
	import EmptyState from "../../core/EmptyState.svelte";
	import LoadingState from "../../core/LoadingState.svelte";
	import SearchField from "../../kit/SearchField.svelte";
	import { EditVersionModal } from "../../modals/EditVersionModal";

	interface Props {
		app: App;
		service: BibleVersionService;
		folder: string;
		revision: number;
	}

	let { app, service, folder, revision }: Props = $props();

	let versions = $state<BibleVersion[]>([]);
	let loading = $state(true);
	let importing = $state(false);
	let removingPath = $state<string | null>(null);
	let fileInput = $state<HTMLInputElement>();
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

	async function load(): Promise<void> {
		loading = true;
		try {
			versions = await service.listVersions();
		} catch (error) {
			new Notice(error instanceof Error ? error.message : t("settings.versionsListErrorNotice"));
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		revision;
		folder;
		void load();
	});

	async function onFilePicked(event: Event): Promise<void> {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		input.value = "";
		if (!file) return;
		importing = true;
		try {
			const version = await service.importVersion(file);
			new Notice(t("settings.importSuccessNotice", { name: version.abbreviation }));
			await load();
		} catch (error) {
			new Notice(error instanceof Error ? error.message : t("settings.importErrorNotice"));
		} finally {
			importing = false;
		}
	}

	async function onRemove(version: BibleVersion): Promise<void> {
		const confirmed = await confirmAction(app, {
			title: t("settings.removeVersionTitle"),
			message: t("settings.removeVersionConfirm", { name: version.name, folder }),
			confirmText: t("settings.removeButton"),
		});
		if (!confirmed) return;
		removingPath = version.filePath;
		try {
			await service.removeVersion(version.filePath);
			new Notice(t("settings.removedNotice", { name: version.name }));
			await load();
		} catch (error) {
			new Notice(error instanceof Error ? error.message : t("settings.removeErrorNotice"));
		} finally {
			removingPath = null;
		}
	}

	function onEdit(version: BibleVersion): void {
		new EditVersionModal(app, version, async (result) => {
			await service.updateVersionMetadata(version.filePath, {
				name: result.name,
				abbreviation: result.abbreviation,
				language: result.language,
			});
			if (result.isDefault) {
				await service.setDefaultVersion(version.filePath);
			} else if (version.isDefault) {
				await service.setDefaultVersion("");
			}
			new Notice(t("settings.versionUpdatedNotice"));
			await load();
		}).open();
	}

	async function onToggleDefault(version: BibleVersion): Promise<void> {
		if (version.isDefault) {
			await service.setDefaultVersion("");
		} else {
			await service.setDefaultVersion(version.filePath);
		}
		new Notice(t("settings.versionUpdatedNotice"));
		await load();
	}
</script>

<div class="setting-item">
	<div class="setting-item-info">
		<div class="setting-item-name">{t("settings.importedVersionsHeading")}</div>
		<div class="setting-item-description">{folder}/</div>
	</div>
	<div class="setting-item-control">
		<input type="file" accept=".sqlite,.db,.sqlite3" hidden bind:this={fileInput} onchange={onFilePicked} />
		<button class="mod-cta" onclick={() => fileInput?.click()} disabled={importing}>
			{importing ? t("common.importing") : t("settings.importName")}
		</button>
	</div>
</div>

{#if versions.length > 2}
	<div class="ob-version-search-wrap">
		<SearchField
			bind:value={searchQuery}
			placeholder={t("settings.searchVersionsPlaceholder")}
		/>
	</div>
{/if}

{#if loading}
	<LoadingState message={t("common.loading")} />
{:else if versions.length === 0}
	<EmptyState message={t("settings.noVersionsYet")} hint={t("settings.importDesc")} />
{:else if filteredVersions.length === 0}
	<div class="ob-empty-search-message">
		<p>{t("settings.noVersionsFound")}</p>
	</div>
{:else}
	<div class="ob-version-list">
		{#each filteredVersions as version (version.id)}
			<div class="setting-item ob-version-item" class:is-default-item={version.isDefault}>
				<div class="setting-item-info">
					<div class="setting-item-name">
						{version.name}
						<span class="ob-badge">{version.abbreviation}</span>
						{#if version.language}
							<span class="ob-badge ob-badge-lang">{version.language}</span>
						{/if}
						{#if version.isDefault}
							<span class="ob-badge ob-badge-primary">{t("settings.isDefaultBadge")}</span>
						{/if}
					</div>
					<div class="setting-item-description">{version.filePath}</div>
				</div>
				<div class="setting-item-control">
					<button
						type="button"
						class="clickable-icon"
						class:is-active-star={version.isDefault}
						use:lucide={"star"}
						aria-label={t("settings.setAsDefaultLabel")}
						onclick={() => void onToggleDefault(version)}
					></button>
					<button
						type="button"
						class="clickable-icon"
						use:lucide={"pencil"}
						aria-label={`${t("settings.editVersionButton")}: ${version.name}`}
						onclick={() => onEdit(version)}
					></button>
					<button
						type="button"
						class="clickable-icon"
						use:lucide={"trash-2"}
						aria-label={`${t("settings.removeButton")} ${version.name}`}
						disabled={removingPath === version.filePath}
						onclick={() => onRemove(version)}
					></button>
				</div>
			</div>
		{/each}
	</div>
{/if}

<style>
	.ob-version-list {
		display: flex;
		flex-direction: column;
		gap: 8px;
		margin-top: 8px;
	}
	.ob-version-item {
		border: 1px solid var(--background-modifier-border);
		border-radius: 8px;
	}
	.ob-badge {
		display: inline-block;
		margin-left: 8px;
		padding: 1px 8px;
		border: 1px solid var(--background-modifier-border);
		border-radius: 999px;
		font-size: var(--font-ui-smaller);
		color: var(--text-accent);
		vertical-align: middle;
	}
</style>
