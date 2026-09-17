<script lang="ts">
	import { onMount } from "svelte";
	import { Notice } from "obsidian";
	import type OpenBiblePlugin from "../../../main";
	import type { BibleResourceLink } from "../../../models/resource";
	import { t } from "../../../i18n";
	import { icon } from "../../actions/icon";
	import PickerHeader from "../../kit/PickerHeader.svelte";
	import SearchField from "../../kit/SearchField.svelte";
	import EmptyState from "../../kit/EmptyState.svelte";
	import IconButton from "../../kit/IconButton.svelte";
	import { openNoteInEditor } from "../../modals/NotePreviewModal";

	interface Props {
		plugin: OpenBiblePlugin;
		initialTypeId?: string | null;
		lockedTypeId?: string | null;
		onNavigate: (bookName: string, chapter: number, verseNumber?: number, versionAbbr?: string) => void;
		onClose?: () => void;
		showCloseButton?: boolean;
		closeOnNavigate?: boolean;
	}

	let {
		plugin,
		initialTypeId = null,
		lockedTypeId = null,
		onNavigate,
		onClose,
		showCloseButton = true,
		closeOnNavigate = true,
	}: Props = $props();

	let links = $state<BibleResourceLink[]>([]);
	let searchQuery = $state("");
	// svelte-ignore state_referenced_locally
	let selectedType = $state<string | null>(initialTypeId ?? lockedTypeId ?? null);

	function loadLinks() {
		if (!plugin?.resourceService) return;
		links = plugin.resourceService.getAllLinks(lockedTypeId ?? undefined);
	}

	onMount(() => {
		loadLinks();
		const unsub = plugin.resourceService.subscribe(() => {
			loadLinks();
		});
		return unsub;
	});

	let resourceTypes = $derived(plugin.resourceService?.getResourceTypes() ?? []);
	let lockedType = $derived(
		lockedTypeId ? (resourceTypes.find((r) => r.id === lockedTypeId) ?? null) : null,
	);

	let filteredLinks = $derived.by(() => {
		let list = links;
		const activeType = lockedTypeId ?? selectedType;
		if (activeType) {
			list = list.filter((l) => l.resourceType === activeType);
		}
		const q = searchQuery.trim().toLowerCase();
		if (q) {
			list = list.filter((l) => {
				return (
					(l.resourceName || "").toLowerCase().includes(q) ||
					(l.reference || "").toLowerCase().includes(q) ||
					(l.selectedText || "").toLowerCase().includes(q) ||
					(l.book || "").toLowerCase().includes(q)
				);
			});
		}
		return list;
	});

	function typeIcon(typeId: string): string {
		return resourceTypes.find((r) => r.id === typeId)?.icon || "link";
	}

	function typeLabel(typeId: string): string {
		return resourceTypes.find((r) => r.id === typeId)?.label || typeId;
	}

	function typeColor(typeId: string): string {
		return resourceTypes.find((r) => r.id === typeId)?.color || "var(--interactive-accent)";
	}

	function handleItemClick(item: BibleResourceLink) {
		if (closeOnNavigate) {
			onClose?.();
		}
		const firstVerse = item.verses.length > 0 ? item.verses[0] : 1;
		onNavigate(item.book, item.chapter, firstVerse, item.version);
	}

	function handleOpenResource(item: BibleResourceLink, event: MouseEvent) {
		event.stopPropagation();
		void openNoteInEditor(plugin.app, item.resourcePath);
	}

	function handleUnlink(item: BibleResourceLink, event: MouseEvent) {
		event.stopPropagation();
		void plugin.resourceService.removeLink(item.path).then(() => {
			new Notice(t("notices.resourceLinkRemoved"));
			loadLinks();
		});
	}
</script>

<div class="open-bible-highlights-panel open-bible-resources-panel">
	<PickerHeader
		title={lockedType ? `${t("resourcesPanel.title")} · ${lockedType.label}` : t("resourcesPanel.title")}
		subtitle={filteredLinks.length === 1
			? t("resourcesPanel.countSingle")
			: t("resourcesPanel.countPlural", { count: filteredLinks.length })}
		closeLabel={t("common.close")}
		{showCloseButton}
		{onClose}
	/>

	{#if links.length > 0}
		<div class="open-bible-highlights-panel-controls">
			<div class="open-bible-highlights-panel-search">
				<SearchField
					placeholder={t("resourcesPanel.searchPlaceholder")}
					bind:value={searchQuery}
				/>
			</div>

			{#if !lockedTypeId}
				<div class="open-bible-highlights-panel-chips" role="toolbar">
					<button
						type="button"
						class="open-bible-highlights-chip"
						class:is-active={selectedType === null}
						onclick={() => (selectedType = null)}
					>
						{t("resourcesPanel.allTypes")}
					</button>

					{#each resourceTypes as resType (resType.id)}
						<button
							type="button"
							class="open-bible-highlights-chip"
							class:is-active={selectedType === resType.id}
							onclick={() => {
								selectedType = selectedType === resType.id ? null : resType.id;
							}}
						>
							<span class="open-bible-highlights-chip-dot" style:background-color={resType.color}></span>
							<span use:icon={resType.icon}></span>
							<span>{resType.label}</span>
						</button>
					{/each}
				</div>
			{/if}
		</div>
	{/if}

	{#if links.length === 0}
		<EmptyState
			iconName="link"
			title={t("resourcesPanel.emptyTitle")}
			description={t("resourcesPanel.emptyDesc")}
		/>
	{:else if filteredLinks.length === 0}
		<div class="open-bible-highlights-panel-no-results">
			<p>{t("resourcesPanel.noResults")}</p>
		</div>
	{:else}
		<div class="open-bible-highlights-panel-list" role="list">
			{#each filteredLinks as item (item.path)}
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<div
					class="open-bible-highlights-panel-item"
					role="button"
					tabindex="0"
					onclick={() => handleItemClick(item)}
				>
					<div
						class="open-bible-highlights-panel-bar"
						style:background-color={typeColor(item.resourceType)}
					></div>

					<div class="open-bible-highlights-panel-content">
						<div class="open-bible-highlights-panel-header">
							<span
								class="open-bible-resource-type-icon"
								style:color={typeColor(item.resourceType)}
								use:icon={typeIcon(item.resourceType)}
								title={typeLabel(item.resourceType)}
							></span>
							<span class="open-bible-highlights-panel-ref">{item.resourceName}</span>
							<span class="open-bible-highlights-panel-tag">{typeLabel(item.resourceType)}</span>
							<span class="open-bible-highlights-panel-version">{item.reference}</span>
						</div>

						{#if item.selectedText}
							<p class="open-bible-highlights-panel-snippet">"{item.selectedText}"</p>
						{/if}
					</div>

					<div class="open-bible-highlights-panel-actions">
						<IconButton
							iconName="file-text"
							class="open-bible-highlights-action-btn"
							title={t("resourcesPanel.openResourceTooltip")}
							ariaLabel={t("resourcesPanel.openResourceTooltip")}
							onclick={(e: MouseEvent) => handleOpenResource(item, e)}
						/>
						<IconButton
							iconName="unlink"
							class="open-bible-highlights-action-btn mod-danger"
							title={t("resourcesPanel.unlinkTooltip")}
							ariaLabel={t("resourcesPanel.unlinkTooltip")}
							onclick={(e: MouseEvent) => handleUnlink(item, e)}
						/>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
