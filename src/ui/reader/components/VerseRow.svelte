<script lang="ts">
	import { Menu } from "obsidian";
	import type { CrossReference } from "../../../data/crossRefModel";
	import type { BibleVerse } from "../../../models/bible";
	import type { BibleNoteItem } from "../../../models/note";
	import type { BibleResourceLink } from "../../../models/resource";
	import type {
		ResourceDisplayStyle,
		ResourceTypeConfig,
	} from "../../../settings";
	import { t } from "../../../i18n";
	import { icon } from "../../actions/icon";
	import { resolveHighlightCssColor } from "../highlightStyles";
	import type { VerseLaneSlot } from "../noteLanes";
	import { segmentVerseText, type TextSegment } from "../textSegmentation";
	import type { TextRangeData } from "../textRangeSelection";
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
		activeTextSelection?: TextRangeData | null;
		justCapturedTextRange?: boolean;
		resourceLinks?: BibleResourceLink[];
		resourceTypes?: ResourceTypeConfig[];
		autoResourceMatches?: AutoResourceMatch[];
		resourceDisplayStyle?: ResourceDisplayStyle;
		resourceColorize?: boolean;
		onVerseClick: (verseNumber: number, event: MouseEvent) => void;
		onToggleVerseSelection?: (verseNumber: number) => void;
		onVerseTextClick?: (event: MouseEvent) => void;
		onOpenNote: (path: string, event?: MouseEvent) => void;
		onNoteLineHover?: (event: MouseEvent, notePath: string) => void;
		onNoteLineEnter?: (notePath: string) => void;
		onNoteLineLeave?: () => void;
		onNoteLineKeyDown?: (
			event: KeyboardEvent,
			notePath: string,
			targetEl: HTMLElement,
		) => void;
		onXrefSelect?: (ref: CrossReference, event: MouseEvent) => void;
		onRemoveHighlight?: (highlightPath: string) => void;
		onOpenResourceGroup?: (
			links: BibleResourceLink[],
			event: MouseEvent,
		) => void;
		onUnlinkResource?: (linkPath: string) => void;
		onResourceHover?: (
			event: MouseEvent,
			link: BibleResourceLink,
			targetEl: HTMLElement,
		) => void;
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
		activeTextSelection = null,
		justCapturedTextRange = false,
		resourceLinks = [],
		resourceTypes = [],
		autoResourceMatches = [],
		resourceDisplayStyle = "icon",
		resourceColorize = true,
		onVerseClick,
		onToggleVerseSelection,
		onVerseTextClick,
		onOpenNote,
		onNoteLineHover,
		onNoteLineEnter,
		onNoteLineLeave,
		onNoteLineKeyDown,
		onXrefSelect,
		onRemoveHighlight,
		onOpenResourceGroup,
		onUnlinkResource,
		onResourceHover,
	}: Props = $props();

	const legacyHighlights = $derived(
		highlights.filter(
			(h) => h.charStart === undefined || h.charEnd === undefined,
		),
	);

	const rangedHighlights = $derived(
		highlights.filter(
			(h) => h.charStart !== undefined && h.charEnd !== undefined,
		),
	);

	/** Virtual occurrence of a resource's linked word in this verse (auto-match). */
	interface AutoResourceMatch {
		link: BibleResourceLink;
		charStart: number;
		charEnd: number;
	}

	interface ResourceAnchor {
		link: BibleResourceLink;
		charStart: number;
		charEnd: number;
	}

	interface ResourceAnchorGroup {
		charStart: number;
		charEnd: number;
		anchors: ResourceAnchor[];
	}

	const showResourceIcon = $derived(resourceDisplayStyle !== "underline");
	const showResourceUnderline = $derived(resourceDisplayStyle !== "icon");

	/** Unified anchors: ranged links + auto-matched occurrences + whole-verse links (0..len). */
	const resourceAnchors = $derived.by((): ResourceAnchor[] => {
		const len = verse.text.length;
		const list: ResourceAnchor[] = [];
		for (const link of resourceLinks) {
			if (link.charStart !== undefined && link.charEnd !== undefined) {
				list.push({
					link,
					charStart: Math.max(0, Math.min(link.charStart, len)),
					charEnd: Math.max(0, Math.min(link.charEnd, len)),
				});
			} else {
				list.push({ link, charStart: 0, charEnd: len });
			}
		}
		for (const m of autoResourceMatches) {
			list.push({
				link: m.link,
				charStart: Math.max(0, Math.min(m.charStart, len)),
				charEnd: Math.max(0, Math.min(m.charEnd, len)),
			});
		}
		return list.filter(
			(a) =>
				a.charStart < a.charEnd ||
				(a.charStart === 0 && a.charEnd === 0 && len === 0),
		);
	});

	/** Anchors grouped by exact (start, end), indexed by end offset for marker rendering. */
	const resourceGroupsByEnd = $derived.by(
		(): Map<number, ResourceAnchorGroup[]> => {
			const byEnd = new Map<number, Map<number, ResourceAnchor[]>>();
			for (const a of resourceAnchors) {
				let m = byEnd.get(a.charEnd);
				if (!m) {
					m = new Map();
					byEnd.set(a.charEnd, m);
				}
				const list = m.get(a.charStart) ?? [];
				if (
					!list.some((existing) => existing.link.path === a.link.path)
				) {
					list.push(a);
				}
				m.set(a.charStart, list);
			}
			const out = new Map<number, ResourceAnchorGroup[]>();
			for (const [end, m] of byEnd) {
				out.set(
					end,
					[...m.entries()].map(([start, anchors]) => ({
						charStart: start,
						charEnd: end,
						anchors,
					})),
				);
			}
			return out;
		},
	);

	function anchorsOverlappingSegment(
		charStart: number,
		charEnd: number,
	): ResourceAnchor[] {
		return resourceAnchors.filter(
			(a) => a.charStart <= charStart && a.charEnd >= charEnd,
		);
	}

	const textSegments = $derived(
		segmentVerseText(
			verse.text,
			verse.number,
			highlights,
			activeTextSelection,
			resourceAnchors,
		),
	);

	function handleRangeMarkerClick(
		highlight: BibleNoteItem,
		event: MouseEvent,
	) {
		event.stopPropagation();
		const menu = new Menu();

		menu.addItem((item) => {
			item.setTitle(t("note.openInEditor"))
				.setIcon("file-text")
				.onClick(() => {
					onOpenNote(highlight.path, event);
				});
		});

		menu.addSeparator();

		menu.addItem((item) => {
			item.setTitle(t("popover.removeHighlight"))
				.setIcon("trash-2")
				.onClick(() => {
					onRemoveHighlight?.(highlight.path);
				});
		});

		menu.showAtMouseEvent(event);
	}

	function resourceTypeOf(
		link: BibleResourceLink,
	): ResourceTypeConfig | undefined {
		return resourceTypes.find((r) => r.id === link.resourceType);
	}

	function handleResourceAnchorClick(
		group: ResourceAnchorGroup,
		event: MouseEvent,
	) {
		event.stopPropagation();
		// Single link opens its preview directly; multiple links open the chooser modal (parent decides).
		onOpenResourceGroup?.(
			group.anchors.map((a) => a.link),
			event,
		);
	}

	function handleResourceHover(event: MouseEvent, link: BibleResourceLink) {
		onResourceHover?.(event, link, event.currentTarget as HTMLElement);
	}

	function handleResourceTextClick(
		anchors: ResourceAnchor[],
		segment: TextSegment,
		event: MouseEvent,
	) {
		if (isSelectionMode) return;
		if (justCapturedTextRange) return;
		if (segment.isSelected) return;

		const selection = window.getSelection();
		if (selection && !selection.isCollapsed && selection.toString().trim()) {
			return;
		}

		event.stopPropagation();

		// Prioritize specific word-level anchors if present over whole-verse anchors
		const rangedAnchors = anchors.filter(
			(a) =>
				a.link.charStart !== undefined ||
				a.charStart > 0 ||
				a.charEnd < verse.text.length,
		);
		const effectiveAnchors =
			rangedAnchors.length > 0 ? rangedAnchors : anchors;

		const uniqueLinks = effectiveAnchors.reduce<BibleResourceLink[]>(
			(acc, a) => {
				if (!acc.some((l) => l.path === a.link.path)) {
					acc.push(a.link);
				}
				return acc;
			},
			[],
		);

		if (uniqueLinks.length > 0) {
			onOpenResourceGroup?.(uniqueLinks, event);
		}
	}
</script>

{#snippet renderUnderlines(
	hlList: BibleNoteItem[],
	text: string,
	index: number,
)}
	{#if index < hlList.length}
		{@const hl = hlList[index]}
		<span
			class="open-bible-hl-line"
			style:--hl-line-color={resolveHighlightCssColor(hl.color)}
			style:--hl-line-offset="{hlList.length === 1
				? 3.5
				: index * 3.5 + 3}px"
			style:--hl-line-thickness="{hlList.length === 1 ? 2.5 : 2}px"
		>
			{@render renderUnderlines(hlList, text, index + 1)}
		</span>
	{:else}
		{text}
	{/if}
{/snippet}

{#snippet renderResourceGroupMarker(group: ResourceAnchorGroup)}
	{@const first = group.anchors[0].link}
	{@const resType = resourceTypeOf(first)}
	<button
		type="button"
		class="open-bible-resource-marker"
		style:--resource-color={resourceColorize
			? resType?.color || "var(--interactive-accent)"
			: undefined}
		title={group.anchors.map((a) => a.link.resourceName).join(", ") +
			` · ${resType?.label || first.resourceType} · ${first.reference}`}
		aria-label={`${t("reader.resourceLinkMarker")}: ${group.anchors.map((a) => a.link.resourceName).join(", ")}`}
		onclick={(e) => handleResourceAnchorClick(group, e)}
		onmouseenter={(e) => handleResourceHover(e, first)}
		onmousemove={(e) => handleResourceHover(e, first)}
	>
		<sup
			class="open-bible-resource-marker-icon"
			use:icon={resType?.icon || "link"}
		></sup>
	</button>
{/snippet}

{#snippet renderRangeSegments()}
	{#each textSegments as segment (segment.charStart)}
		{@const overlapping = anchorsOverlappingSegment(
			segment.charStart,
			segment.charEnd,
		)}
		{@const rangedOverlapping = overlapping.filter(
			(a) =>
				a.link.charStart !== undefined ||
				a.charStart > 0 ||
				a.charEnd < verse.text.length,
		)}
		{@const effectiveAnchors =
			rangedOverlapping.length > 0 ? rangedOverlapping : overlapping}
		{@const underlineLink =
			showResourceUnderline && effectiveAnchors.length > 0
				? effectiveAnchors[0].link
				: null}
		{@const underlineType = underlineLink
			? resourceTypeOf(underlineLink)
			: undefined}
		{#if underlineLink}
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<span
				class="open-bible-resource-text"
				role="button"
				tabindex="0"
				style:--resource-color={underlineType?.color ||
					"var(--interactive-accent)"}
				style:color={resourceColorize
					? underlineType?.color || undefined
					: undefined}
				title={effectiveAnchors.map((a) => a.link.resourceName).join(", ") +
					` · ${underlineType?.label || underlineLink.resourceType} · ${underlineLink.reference}`}
				aria-label={`${t("reader.resourceLinkMarker")}: ${effectiveAnchors.map((a) => a.link.resourceName).join(", ")}`}
				onclick={(e) =>
					handleResourceTextClick(effectiveAnchors, segment, e)}
				onkeydown={(e) => {
					if (e.key === "Enter" || e.key === " ") {
						e.preventDefault();
						e.stopPropagation();
						handleResourceTextClick(
							effectiveAnchors,
							segment,
							e as unknown as MouseEvent,
						);
					}
				}}
				onmouseenter={(e) => handleResourceHover(e, underlineLink)}
				onmousemove={(e) => handleResourceHover(e, underlineLink)}
			>
				{#if segment.isSelected}
					<mark class="open-bible-selected-text-range"
						>{segment.text}</mark
					>
				{:else if segment.highlights.length > 0}
					{@render renderUnderlines(
						segment.highlights,
						segment.text,
						0,
					)}
				{:else}
					{segment.text}
				{/if}
			</span>
		{:else if segment.isSelected}
			<mark class="open-bible-selected-text-range">
				{#if segment.highlights.length > 0}
					{@render renderUnderlines(
						segment.highlights,
						segment.text,
						0,
					)}
				{:else}
					{segment.text}
				{/if}
			</mark>
		{:else if segment.highlights.length > 0}
			{@render renderUnderlines(segment.highlights, segment.text, 0)}
		{:else}
			{segment.text}
		{/if}
		{#each segment.highlights.filter((h) => h.charStart !== undefined && h.charEnd === segment.charEnd) as hl (hl.path)}
			<button
				type="button"
				class="open-bible-range-marker"
				style:--marker-color={resolveHighlightCssColor(hl.color)}
				title={hl.selectedText || hl.title}
				aria-label={t("reader.rangeHighlightMarker")}
				onclick={(e) => handleRangeMarkerClick(hl, e)}
			>
				<sup class="open-bible-range-marker-icon" use:icon={"bookmark"}
				></sup>
			</button>
		{/each}
		{#if showResourceIcon}
			{#each resourceGroupsByEnd.get(segment.charEnd) ?? [] as group (group.charStart)}
				{@render renderResourceGroupMarker(group)}
			{/each}
		{/if}
	{/each}
{/snippet}

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
	class="open-bible-reader-verse"
	class:is-selected={isSelected && !activeTextSelection}
	class:has-active-range={Boolean(activeTextSelection)}
	class:has-checkbox={isSelectionMode}
	class:is-highlighted={!isSelectionMode && highlights.length > 0}
	class:has-note-lanes={!isSelectionMode && totalLanes > 0}
	class:has-thompson-xref={showXrefGutter && xrefRefs.length > 0}
	class:has-thompson-xref-start={showXrefGutter &&
		xrefRefs.length > 0 &&
		xrefGutterAlign === "start"}
	style:--note-lane-count={isSelectionMode ? 0 : totalLanes}
	data-verse={verse.number}
	role={isSelectionMode ? "button" : "group"}
	tabindex={isSelectionMode ? 0 : undefined}
	onclick={(e) => {
		if (isSelectionMode) {
			onVerseClick(verse.number, e);
		}
	}}
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
				aria-label={t("reader.selectVerseAria", { verse: verse.number })}
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
						class:is-hovered={Boolean(
							hoveredNotePath &&
								hoveredNotePath === slot.note.linkedNotePath,
						)}
						style:--note-line-color={resolveHighlightCssColor(
							slot.note.color,
						)}
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
						onmousemove={(e) =>
							onNoteLineHover?.(e, slot.note.linkedNotePath)}
						onkeydown={(e) =>
							onNoteLineKeyDown?.(
								e,
								slot.note.linkedNotePath,
								e.currentTarget,
							)}
					></button>
				{:else}
					<span class="open-bible-verse-note-line is-empty"></span>
				{/if}
			{/each}
		</div>
	{/if}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<span
		class="open-bible-reader-verse-number"
		role="button"
		tabindex="0"
		title={t("reader.selectVerseTooltip", { number: verse.number })}
		aria-label={t("reader.selectVerseTooltip", { number: verse.number })}
		onclick={(e) => {
			e.stopPropagation();
			onVerseClick(verse.number, e);
		}}
		onkeydown={(e) => {
			if (e.key === "Enter" || e.key === " ") {
				e.preventDefault();
				onVerseClick(verse.number, e as unknown as MouseEvent);
			}
		}}
	>
		{verse.number}
	</span>
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<span
		class="open-bible-reader-verse-text"
		role="presentation"
		onclick={(e) => onVerseTextClick?.(e)}
	>
		{#if !isSelectionMode && (rangedHighlights.length > 0 || resourceAnchors.length > 0 || Boolean(activeTextSelection))}
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
