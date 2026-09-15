<script lang="ts">
	import { Menu } from "obsidian";
	import type { CrossReference } from "../../../data/crossRefModel";
	import type { BibleVerse } from "../../../models/bible";
	import type { BibleNoteItem } from "../../../models/note";
	import { t } from "../../../i18n";
	import { icon } from "../../actions/icon";
	import { resolveHighlightCssColor } from "../highlightStyles";
	import type { VerseLaneSlot } from "../noteLanes";
	import { segmentVerseText } from "../textSegmentation";
	import ThompsonMarginGutter from "./ThompsonMarginGutter.svelte";

	interface Props {
		verse: BibleVerse;
		isSelected: boolean;
		highlights: BibleNoteItem[];
		laneSlots: (VerseLaneSlot | null)[];
		totalLanes: number;
		xrefRefs?: CrossReference[];
		showXrefGutter?: boolean;
		xrefGutterAlign?: "start" | "end";
		isSelectionMode?: boolean;
		hoveredNotePath?: string | null;
		onVerseClick: (verseNumber: number, event: MouseEvent) => void;
		onToggleVerseSelection?: (verseNumber: number) => void;
		onOpenNote: (path: string, event?: MouseEvent) => void;
		onNoteLineHover?: (event: MouseEvent, notePath: string) => void;
		onNoteLineEnter?: (notePath: string) => void;
		onNoteLineLeave?: () => void;
		onNoteLineKeyDown?: (event: KeyboardEvent, notePath: string, targetEl: HTMLElement) => void;
		onXrefSelect?: (ref: CrossReference, event: MouseEvent) => void;
		onRemoveHighlight?: (highlightPath: string) => void;
	}

	let {
		verse,
		isSelected,
		highlights,
		laneSlots,
		totalLanes,
		xrefRefs = [],
		showXrefGutter = false,
		xrefGutterAlign = "end",
		isSelectionMode = false,
		hoveredNotePath = null,
		onVerseClick,
		onToggleVerseSelection,
		onOpenNote,
		onNoteLineHover,
		onNoteLineEnter,
		onNoteLineLeave,
		onNoteLineKeyDown,
		onXrefSelect,
		onRemoveHighlight,
	}: Props = $props();

	const legacyHighlights = $derived(
		highlights.filter((h) => h.charStart === undefined || h.charEnd === undefined)
	);

	const rangedHighlights = $derived(
		highlights.filter((h) => h.charStart !== undefined && h.charEnd !== undefined)
	);

	const textSegments = $derived(segmentVerseText(verse.text, verse.number, highlights));

	function handleRangeMarkerClick(highlight: BibleNoteItem, event: MouseEvent) {
		event.stopPropagation();
		const menu = new Menu();

		menu.addItem((item) => {
			item
				.setTitle(t("note.openInEditor"))
				.setIcon("file-text")
				.onClick(() => {
					onOpenNote(highlight.path, event);
				});
		});

		menu.addSeparator();

		menu.addItem((item) => {
			item
				.setTitle(t("popover.removeHighlight"))
				.setIcon("trash-2")
				.onClick(() => {
					onRemoveHighlight?.(highlight.path);
				});
		});

		menu.showAtMouseEvent(event);
	}
</script>

{#snippet renderUnderlines(hlList: BibleNoteItem[], text: string, index: number)}
	{#if index < hlList.length}
		{@const hl = hlList[index]}
		<span
			class="open-bible-hl-line"
			style:--hl-line-color={resolveHighlightCssColor(hl.color)}
			style:--hl-line-offset="{hlList.length === 1 ? 3.5 : index * 3.5 + 3}px"
			style:--hl-line-thickness="{hlList.length === 1 ? 2.5 : 2}px"
		>
			{@render renderUnderlines(hlList, text, index + 1)}
		</span>
	{:else}
		{text}
	{/if}
{/snippet}

{#snippet renderRangeSegments()}
	{#each textSegments as segment (segment.charStart)}
		{#if segment.highlights.length > 0}
			{@render renderUnderlines(segment.highlights, segment.text, 0)}
			{#each segment.highlights as hl (hl.path)}
				<button
					type="button"
					class="open-bible-range-marker"
					style:--marker-color={resolveHighlightCssColor(hl.color)}
					title={hl.selectedText || hl.title}
					aria-label={t("reader.rangeHighlightMarker")}
					onclick={(e) => handleRangeMarkerClick(hl, e)}
				>
					<sup class="open-bible-range-marker-icon" use:icon={"bookmark"}></sup>
				</button>
			{/each}
		{:else}
			{segment.text}
		{/if}
	{/each}
{/snippet}

<!-- svelte-ignore a11y_click_events_have_key_events -->
<div
	class="open-bible-reader-verse"
	class:is-selected={isSelected}
	class:has-checkbox={isSelectionMode}
	class:is-highlighted={!isSelectionMode && highlights.length > 0}
	class:has-note-lanes={!isSelectionMode && totalLanes > 0}
	class:has-thompson-xref={showXrefGutter && xrefRefs.length > 0}
	class:has-thompson-xref-start={showXrefGutter && xrefRefs.length > 0 && xrefGutterAlign === "start"}
	style:--note-lane-count={isSelectionMode ? 0 : totalLanes}
	data-verse={verse.number}
	role="button"
	tabindex="0"
	onclick={(e) => onVerseClick(verse.number, e)}
>
	{#if isSelectionMode}
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<span
			class="open-bible-reader-verse-checkbox-wrap"
			onclick={(e) => e.stopPropagation()}
			role="presentation"
		>
			<input
				type="checkbox"
				class="open-bible-reader-verse-checkbox"
				checked={isSelected}
				aria-label={`Selecionar versículo ${verse.number}`}
				onchange={(e) => {
					e.stopPropagation();
					onToggleVerseSelection?.(verse.number);
				}}
			/>
		</span>
	{/if}
	{#if !isSelectionMode && totalLanes > 0}
		<div class="open-bible-verse-lines-gutter">
			{#each laneSlots as slot, slotIdx (slotIdx)}
				{#if slot}
					<button
						type="button"
						class="open-bible-verse-note-line"
						class:is-start={slot.isStart}
						class:is-end={slot.isEnd}
						class:is-hovered={Boolean(hoveredNotePath && hoveredNotePath === slot.note.linkedNotePath)}
						style:--note-line-color={resolveHighlightCssColor(slot.note.color)}
						aria-label={`${slot.note.noteTitle}`}
						onclick={(e) => {
							e.stopPropagation();
							onOpenNote(slot.note.linkedNotePath, e);
						}}
						onmouseenter={(e) => {
							onNoteLineEnter?.(slot.note.linkedNotePath);
							onNoteLineHover?.(e, slot.note.linkedNotePath);
						}}
						onmouseleave={() => onNoteLineLeave?.()}
						onmousemove={(e) => onNoteLineHover?.(e, slot.note.linkedNotePath)}
						onkeydown={(e) => onNoteLineKeyDown?.(e, slot.note.linkedNotePath, e.currentTarget)}
					></button>
				{:else}
					<span class="open-bible-verse-note-line is-empty"></span>
				{/if}
			{/each}
		</div>
	{/if}
	<span class="open-bible-reader-verse-number">{verse.number}</span>
	<span class="open-bible-reader-verse-text">
		{#if !isSelectionMode && rangedHighlights.length > 0}
			{@render renderRangeSegments()}
		{:else if !isSelectionMode && legacyHighlights.length > 0}
			{@render renderUnderlines(legacyHighlights, verse.text, 0)}
		{:else}
			{verse.text}
		{/if}
	</span>
	{#if showXrefGutter && xrefRefs.length > 0 && onXrefSelect}
		<ThompsonMarginGutter refs={xrefRefs} onSelectRef={onXrefSelect} />
	{/if}
</div>
