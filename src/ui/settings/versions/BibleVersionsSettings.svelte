<script lang="ts">
	import { Notice, type App } from "obsidian";
	import type { BibleVersionService } from "../../../services/bibleVersionService";
	import type { BibleVersion } from "../../../models/bibleVersion";
	import { confirmAction } from "../../../core/confirm";
	import { t } from "../../../i18n";
	import { lucide } from "../../core/icons";
	import EmptyState from "../../core/EmptyState.svelte";
	import LoadingState from "../../core/LoadingState.svelte";

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

{#if loading}
	<LoadingState message={t("common.loading")} />
{:else if versions.length === 0}
	<EmptyState message={t("settings.noVersionsYet")} hint={t("settings.importDesc")} />
{:else}
	<div class="ob-version-list">
		{#each versions as version (version.id)}
			<div class="setting-item ob-version-item">
				<div class="setting-item-info">
					<div class="setting-item-name">
						{version.name}
						<span class="ob-badge">{version.abbreviation}</span>
					</div>
					<div class="setting-item-description">{version.filePath}</div>
				</div>
				<div class="setting-item-control">
					<button
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
