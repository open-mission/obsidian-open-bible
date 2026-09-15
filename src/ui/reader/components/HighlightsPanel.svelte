<script lang="ts">
	import { onMount } from "svelte";
	import { Notice } from "obsidian";
	import type OpenBiblePlugin from "../../../main";
	import type { BibleNoteItem } from "../../../models/note";
	import { resolveHighlightCssColor } from "../highlightStyles";
	import { t } from "../../../i18n";
	import PickerHeader from "../../kit/PickerHeader.svelte";
	import SearchField from "../../kit/SearchField.svelte";
	import EmptyState from "../../kit/EmptyState.svelte";
	import IconButton from "../../kit/IconButton.svelte";
	import { ConfirmDeleteHighlightModal } from "../../modals/ConfirmDeleteModal";
	import { openNoteInEditor } from "../../modals/NotePreviewModal";

	interface Props {
		plugin: OpenBiblePlugin;
		onNavigate: (bookName: string, chapter: number, verseNumber?: number, versionAbbr?: string) => void;
		onClose?: () => void;
		showCloseButton?: boolean;
		closeOnNavigate?: boolean;
	}

	let {
		plugin,
		onNavigate,
		onClose,
		showCloseButton = true,
		closeOnNavigate = true,
	}: Props = $props();

	let highlights = $state<BibleNoteItem[]>([]);
	let searchQuery = $state("");
	let selectedLabel = $state<string | null>(null);

	function loadHighlights() {
		if (!plugin?.highlightService) return;
		highlights = plugin.highlightService.getAllHighlights();
	}

	onMount(() => {
		loadHighlights();
		const unsub = plugin.highlightService.subscribe(() => {
			loadHighlights();
		});
		return unsub;
	});

	let configuredHighlights = $derived(plugin.settings.configuredHighlights || []);

	interface FilterItem {
		key: string;
		label: string;
		color: string;
	}

	let availableFilters = $derived.by((): FilterItem[] => {
		const items: FilterItem[] = [];
		const seen = new Set<string>();

		// 1. From configured highlights
		for (const cfg of configuredHighlights) {
			const label = cfg.label?.trim() || cfg.id;
			if (!seen.has(label.toLowerCase())) {
				seen.add(label.toLowerCase());
				items.push({ key: label, label, color: cfg.color });
			}
		}

		// 2. From actual highlights found in vault
		for (const h of highlights) {
			if (h.highlightLabel) {
				const trimmed = h.highlightLabel.trim();
				if (!seen.has(trimmed.toLowerCase())) {
					seen.add(trimmed.toLowerCase());
					items.push({ key: trimmed, label: trimmed, color: h.color });
				}
			}
		}

		return items;
	});

	let filteredHighlights = $derived.by(() => {
		let list = highlights;
		if (selectedLabel) {
			const sel = selectedLabel.toLowerCase();
			list = list.filter((h) => {
				if (h.highlightLabel && h.highlightLabel.toLowerCase() === sel) {
					return true;
				}
				const cfg = configuredHighlights.find(
					(c) => c.label.toLowerCase() === sel || c.id.toLowerCase() === sel
				);
				if (cfg && (h.color === cfg.color || h.color === cfg.id)) {
					return true;
				}
				return false;
			});
		}
		const q = searchQuery.trim().toLowerCase();
		if (q) {
			list = list.filter((h) => {
				const ref = (h.reference || "").toLowerCase();
				const text = (h.selectedText || "").toLowerCase();
				const title = (h.title || "").toLowerCase();
				const book = (h.book || "").toLowerCase();
				const label = (h.highlightLabel || "").toLowerCase();
				return (
					ref.includes(q) ||
					text.includes(q) ||
					title.includes(q) ||
					book.includes(q) ||
					label.includes(q)
				);
			});
		}
		return list;
	});

	function handleItemClick(item: BibleNoteItem) {
		if (closeOnNavigate) {
			onClose?.();
		}
		const firstVerse = item.verses.length > 0 ? item.verses[0] : 1;
		onNavigate(item.book, item.chapter, firstVerse, item.version);
	}

	function handleOpenNote(item: BibleNoteItem, event: MouseEvent) {
		event.stopPropagation();
		void openNoteInEditor(plugin.app, item.path);
	}

	function handleDelete(item: BibleNoteItem, event: MouseEvent) {
		event.stopPropagation();
		if (plugin.settings.confirmHighlightDeletion) {
			new ConfirmDeleteHighlightModal(plugin.app, plugin, item.reference, async () => {
				await plugin.highlightService.removeHighlight(item.path);
				new Notice(t("notices.highlightRemoved"));
				loadHighlights();
			}).open();
		} else {
			void plugin.highlightService.removeHighlight(item.path).then(() => {
				new Notice(t("notices.highlightRemoved"));
				loadHighlights();
			});
		}
	}
</script>

<div class="open-bible-highlights-panel">
	<PickerHeader
		title={t("highlightsPanel.title")}
		subtitle={highlights.length === 1
			? t("highlightsPanel.countSingle")
			: t("highlightsPanel.countPlural", { count: highlights.length })}
		closeLabel={t("common.close")}
		{showCloseButton}
		{onClose}
	/>

	{#if highlights.length > 0}
		<div class="open-bible-highlights-panel-controls">
			<div class="open-bible-highlights-panel-search">
				<SearchField
					placeholder={t("highlightsPanel.searchPlaceholder")}
					bind:value={searchQuery}
				/>
			</div>

			<!-- Color filter chips -->
			<div class="open-bible-highlights-panel-chips" role="toolbar">
				<button
					type="button"
					class="open-bible-highlights-chip"
					class:is-active={selectedLabel === null}
					onclick={() => (selectedLabel = null)}
				>
					{t("highlightsPanel.allColors")}
				</button>

				{#each availableFilters as filter (filter.key)}
					{@const cssColor = resolveHighlightCssColor(filter.color)}
					<button
						type="button"
						class="open-bible-highlights-chip"
						class:is-active={selectedLabel === filter.key}
						onclick={() => {
							selectedLabel = selectedLabel === filter.key ? null : filter.key;
						}}
					>
						<span
							class="open-bible-highlights-chip-dot"
							style:background-color={cssColor}
						></span>
						<span>{filter.label}</span>
					</button>
				{/each}
			</div>
		</div>
	{/if}

	{#if highlights.length === 0}
		<EmptyState
			iconName="highlighter"
			title={t("highlightsPanel.emptyTitle")}
			description={t("highlightsPanel.emptyDesc")}
		/>
	{:else if filteredHighlights.length === 0}
		<div class="open-bible-highlights-panel-no-results">
			<p>{t("highlightsPanel.noResults")}</p>
		</div>
	{:else}
		<div class="open-bible-highlights-panel-list" role="list">
			{#each filteredHighlights as item (item.path)}
				{@const cssColor = resolveHighlightCssColor(item.color)}
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<div
					class="open-bible-highlights-panel-item"
					role="button"
					tabindex="0"
					onclick={() => handleItemClick(item)}
				>
					<div
						class="open-bible-highlights-panel-bar"
						style:background-color={cssColor}
					></div>

					<div class="open-bible-highlights-panel-content">
						<div class="open-bible-highlights-panel-header">
							<span class="open-bible-highlights-panel-ref">{item.reference}</span>
							{#if item.highlightLabel}
								<span class="open-bible-highlights-panel-tag">{item.highlightLabel}</span>
							{/if}
							{#if item.version}
								<span class="open-bible-highlights-panel-version">{item.version}</span>
							{/if}
						</div>

						{#if item.selectedText}
							<p class="open-bible-highlights-panel-snippet">"{item.selectedText}"</p>
						{/if}
					</div>

					<div class="open-bible-highlights-panel-actions">
						<IconButton
							iconName="file-text"
							class="open-bible-highlights-action-btn"
							title={t("highlightsPanel.openNoteTooltip")}
							ariaLabel={t("highlightsPanel.openNoteTooltip")}
							onclick={(e: MouseEvent) => handleOpenNote(item, e)}
						/>
						<IconButton
							iconName="trash-2"
							class="open-bible-highlights-action-btn mod-danger"
							title={t("highlightsPanel.deleteTooltip")}
							ariaLabel={t("highlightsPanel.deleteTooltip")}
							onclick={(e: MouseEvent) => handleDelete(item, e)}
						/>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
