<script lang="ts">
	import { Menu } from "obsidian";
	import { t } from "../../../i18n";
	import type { BibleBook, BibleVerse } from "../../../models/bible";
	import type { ReaderContainerWidth, ReaderSpacing } from "../../../settings";
	import { icon } from "../../actions/icon";
	import Button from "../../kit/Button.svelte";
	import EmptyState from "../../kit/EmptyState.svelte";

	interface Props {
		book?: BibleBook;
		chapter?: number;
		verses: BibleVerse[];
		isLoading: boolean;
		error: string | null;
		isTwoColumns: boolean;
		containerWidth: ReaderContainerWidth;
		verseSpacing: ReaderSpacing;
		lineSpacing: ReaderSpacing;
		onRetry?: () => void;
		onToggleTwoColumns?: () => void;
	}

	let {
		book,
		chapter,
		verses,
		isLoading,
		error,
		isTwoColumns,
		containerWidth,
		verseSpacing,
		lineSpacing,
		onRetry,
		onToggleTwoColumns,
	}: Props = $props();

	let versesContainerEl = $state<HTMLElement | undefined>();

	function handleContextMenu(event: MouseEvent) {
		const target = event.target as HTMLElement | null;
		if (target?.closest("input, select, textarea, button")) return;
		event.preventDefault();
		event.stopPropagation();

		const menu = new Menu();
		if (onToggleTwoColumns) {
			menu.addItem((item) => {
				item
					.setTitle(isTwoColumns ? t("reader.singleColumn") : t("reader.twoColumns"))
					.setIcon(isTwoColumns ? "align-justify" : "columns-2")
					.setChecked(isTwoColumns)
					.onClick(() => {
						onToggleTwoColumns();
					});
			});
		}
		menu.showAtMouseEvent(event);
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="open-bible-reader-content"
	data-container-width={containerWidth}
	data-verse-spacing={verseSpacing}
	data-line-spacing={lineSpacing}
	oncontextmenu={handleContextMenu}
>
	{#if error}
		<div class="open-bible-reader-error-container">
			<span class="open-bible-reader-error-icon" use:icon={"alert-circle"}></span>
			<p class="open-bible-reader-error-message">{error}</p>
			{#if onRetry}
				<Button variant="warning" onclick={onRetry}>
					{t("reader.retry")}
				</Button>
			{/if}
		</div>
	{:else if !book || chapter === undefined}
		<EmptyState iconName="book-open" title={t("chapterPicker.noChaptersDesc")} />
	{:else}
		<h2 class="open-bible-reader-header">{book.name} {chapter}</h2>
		<div class="open-bible-reader-divider"></div>

		{#if isLoading}
			<div class="open-bible-reader-loading">
				<span class="open-bible-reader-spinner"></span>
				<span class="open-bible-reader-loading-text">{t("reader.loadingVerses")}</span>
			</div>
		{:else if verses.length === 0}
			<p class="open-bible-reader-status">{t("reader.noVersesFound")}</p>
		{:else}
			<div
				bind:this={versesContainerEl}
				class="open-bible-reader-verses"
				class:is-two-columns={isTwoColumns}
				data-verse-spacing={verseSpacing}
				data-line-spacing={lineSpacing}
			>
				{#each verses as verse (verse.number)}
					<div class="open-bible-reader-verse" data-verse={verse.number}>
						<span class="open-bible-reader-verse-number">{verse.number}</span>
						<span class="open-bible-reader-verse-text">{verse.text}</span>
					</div>
				{/each}
			</div>
		{/if}
	{/if}
</div>
