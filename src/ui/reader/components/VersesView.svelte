<script lang="ts">
	import { Menu, Platform } from "obsidian";
	import { t } from "../../../i18n";
	import type { BibleBook, BibleVerse } from "../../../models/bible";
	import type { ReaderContainerWidth, ReaderSpacing } from "../../../settings";
	import type { CrossReference, CrossReferenceBlock } from "../../../data/crossRefModel";
	import type { CrossReferenceService } from "../../../services/CrossReferenceService";
	import { shouldUseCenter, splitThompsonColumns, type ThompsonLayoutMode } from "../thompsonLayout";
	import { THOMPSON_NARROW_BREAKPOINT } from "../thompsonMenu";
	import { icon } from "../../actions/icon";
	import Button from "../../kit/Button.svelte";
	import EmptyState from "../../kit/EmptyState.svelte";
	import ThompsonMarginGutter from "./ThompsonMarginGutter.svelte";

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
		thompsonCrossRefsEnabled?: boolean;
		thompsonCrossRefsPosition?: "margin" | "center";
		crossReferenceService?: CrossReferenceService;
		onRetry?: () => void;
		onToggleTwoColumns?: () => void;
		onSelectCrossRef?: (verseNumber: number, ref: CrossReference, event: MouseEvent) => void;
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
		thompsonCrossRefsEnabled = false,
		thompsonCrossRefsPosition = "margin",
		crossReferenceService,
		onRetry,
		onToggleTwoColumns,
		onSelectCrossRef,
	}: Props = $props();

	let versesContainerEl = $state<HTMLElement | undefined>();
	let containerWidthPx = $state(0);

	$effect(() => {
		const el = versesContainerEl;
		if (!el) return;
		const observer = new ResizeObserver((entries) => {
			containerWidthPx = entries[0]?.contentRect.width ?? 0;
		});
		observer.observe(el);
		return () => observer.disconnect();
	});

	let twoColumnsEffective = $derived(
		isTwoColumns && !Platform.isMobile && containerWidthPx > THOMPSON_NARROW_BREAKPOINT
	);

	let thompsonMode = $derived<ThompsonLayoutMode>(
		shouldUseCenter(Boolean(thompsonCrossRefsEnabled), thompsonCrossRefsPosition, twoColumnsEffective)
	);

	let showThompsonXrefs = $derived(
		thompsonMode !== "off" && !Platform.isMobile && containerWidthPx > THOMPSON_NARROW_BREAKPOINT
	);

	let showMarginGutter = $derived(thompsonMode === "margin" && showThompsonXrefs);

	let chapterXrefBlocks = $state<CrossReferenceBlock[]>([]);

	$effect(() => {
		if (!thompsonCrossRefsEnabled || !crossReferenceService || !book || chapter === undefined) {
			chapterXrefBlocks = [];
			return;
		}
		if (!crossReferenceService.isReady()) {
			void crossReferenceService.load().then(() => {
				if (!thompsonCrossRefsEnabled || !book || chapter === undefined) return;
				chapterXrefBlocks = crossReferenceService.getBlocksForChapter(book.id, chapter);
			});
			return;
		}
		chapterXrefBlocks = crossReferenceService.getBlocksForChapter(book.id, chapter);
	});

	let verseXrefsMap = $derived.by(() => {
		const map = new Map<number, CrossReference[]>();
		for (const block of chapterXrefBlocks) {
			map.set(block.fromVerse, block.refs);
		}
		return map;
	});

	let thompsonColumns = $derived.by(() => splitThompsonColumns(verses));

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

{#snippet renderVerse(verse: BibleVerse, alignStart?: boolean)}
	{@const xrefs = verseXrefsMap.get(verse.number) ?? []}
	{@const hasXrefs = showThompsonXrefs && xrefs.length > 0}
	<div
		class="open-bible-reader-verse"
		class:has-thompson-xref={hasXrefs}
		class:has-thompson-xref-start={hasXrefs && alignStart}
		data-verse={verse.number}
	>
		<span class="open-bible-reader-verse-number">{verse.number}</span>
		<span class="open-bible-reader-verse-text">{verse.text}</span>
		{#if hasXrefs && onSelectCrossRef}
			<ThompsonMarginGutter
				refs={xrefs}
				onSelectRef={(ref, event) => onSelectCrossRef(verse.number, ref, event)}
			/>
		{/if}
	</div>
{/snippet}

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
		{:else if thompsonMode === "center"}
			<div
				bind:this={versesContainerEl}
				class="open-bible-reader-verses is-thompson-center"
				data-verse-spacing={verseSpacing}
				data-line-spacing={lineSpacing}
			>
				<div class="open-bible-thompson-column open-bible-thompson-column-left">
					{#each thompsonColumns.left as verse (verse.number)}
						{@render renderVerse(verse, false)}
					{/each}
				</div>
				<div class="open-bible-thompson-column open-bible-thompson-column-right">
					{#each thompsonColumns.right as verse (verse.number)}
						{@render renderVerse(verse, true)}
					{/each}
				</div>
			</div>
		{:else}
			<div
				bind:this={versesContainerEl}
				class="open-bible-reader-verses"
				class:is-two-columns={isTwoColumns}
				class:has-thompson-margin={showMarginGutter}
				data-verse-spacing={verseSpacing}
				data-line-spacing={lineSpacing}
			>
				{#each verses as verse (verse.number)}
					{@render renderVerse(verse, false)}
				{/each}
			</div>
		{/if}
	{/if}
</div>
