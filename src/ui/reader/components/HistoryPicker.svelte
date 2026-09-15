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
		if (diffMinutes < 1) return t("history.justNow") || "Agora há pouco";
		if (diffMinutes < 60) return `${diffMinutes}m`;
		const diffHours = Math.floor(diffMinutes / 60);
		if (diffHours < 24) return `${diffHours}h`;
		const diffDays = Math.floor(diffHours / 24);
		if (diffDays === 1) return t("history.yesterday") || "Ontem";
		return `${diffDays}d`;
	}

	async function handleClearHistory() {
		await onClear();
		new Notice(t("notices.historyCleared") || "Histórico limpo.");
	}
</script>

<PickerHeader
	title={t("history.title") || "Histórico de leitura"}
	subtitle={history.length === 1
		? "1 passagem recente"
		: `${history.length} passagens recentes`}
	closeLabel={t("bookPicker.close")}
	{onClose}
>
	{#snippet actions()}
		{#if history.length > 0}
			<IconButton
				iconName="trash-2"
				class="open-bible-picker-clear-btn"
				title="Limpar histórico"
				onclick={handleClearHistory}
			/>
		{/if}
	{/snippet}
</PickerHeader>

{#if history.length === 0}
	<EmptyState
		iconName="history"
		title="Nenhum histórico ainda"
		description="Os capítulos lidos aparecerão aqui."
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
