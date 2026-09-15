<script lang="ts">
	import { Notice } from "obsidian";
	import type { ReadingHistoryEntry } from "../../../settings";
	import { t } from "../../../i18n";
	import PickerHeader from "../../kit/PickerHeader.svelte";
	import EmptyState from "../../kit/EmptyState.svelte";
	import IconButton from "../../kit/IconButton.svelte";

	interface Props {
		history: ReadingHistoryEntry[];
		onSelect: (entry: ReadingHistoryEntry) => void;
		onClear: () => Promise<void>;
		onClose: () => void;
	}

	let { history = [], onSelect, onClear, onClose }: Props = $props();

	function formatRelativeTime(timestamp: number): string {
		const diffMs = Date.now() - timestamp;
		const diffMinutes = Math.floor(diffMs / 60000);
		if (diffMinutes < 1) return t("history.justNow");
		if (diffMinutes < 60) return `${diffMinutes}m`;
		const diffHours = Math.floor(diffMinutes / 60);
		if (diffHours < 24) return `${diffHours}h`;
		const diffDays = Math.floor(diffHours / 24);
		if (diffDays === 1) return t("history.yesterday");
		return `${diffDays}d`;
	}

	async function handleClearHistory() {
		await onClear();
		new Notice(t("notices.historyCleared"));
	}
</script>

<PickerHeader
	title={t("history.title")}
	subtitle={history.length === 1
		? t("history.countSingle")
		: t("history.countPlural", { count: history.length })}
	closeLabel={t("history.close")}
	{onClose}
>
	{#snippet actions()}
		{#if history.length > 0}
			<IconButton
				iconName="trash-2"
				class="open-bible-picker-clear-btn"
				title={t("history.clearHistory")}
				ariaLabel={t("history.clearHistory")}
				onclick={handleClearHistory}
			/>
		{/if}
	{/snippet}
</PickerHeader>

{#if history.length === 0}
	<EmptyState
		iconName="history"
		title={t("history.emptyTitle")}
		description={t("history.emptyDesc")}
	/>
{:else}
	<div class="open-bible-history-list">
		{#each history as item (item.id)}
			<button
				type="button"
				class="open-bible-history-item"
				onclick={() => {
					onClose();
					onSelect(item);
				}}
			>
				<div class="open-bible-history-item-left">
					<span class="open-bible-history-version">{item.versionAbbr}</span>
					<div class="open-bible-history-passage">
						<span class="open-bible-history-book">{item.bookName}</span>
						<span class="open-bible-history-chapter">{item.chapter}</span>
					</div>
				</div>
				<span class="open-bible-history-time">{formatRelativeTime(item.timestamp)}</span>
			</button>
		{/each}
	</div>
{/if}
