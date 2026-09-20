<script lang="ts">
	import type { CrossReference } from "../../../data/crossRefModel";
	import { RESOURCE_XREF_BAR_LIMIT, splitVisible, crossRefDomKey } from "../../../data/crossRefModel";
	import { getLocale, t } from "../../../i18n";
	import { formatCrossRef } from "../../resources/formatCrossRef";
	import IconButton from "../../kit/IconButton.svelte";

	interface Props {
		fromBookName: string;
		fromChapter: number;
		fromVerse: number;
		refs: CrossReference[];
		expanded: boolean;
		collapsed?: boolean;
		onToggleExpand: () => void;
		onToggleCollapsed?: () => void;
		onSelectRef: (ref: CrossReference, event: MouseEvent) => void;
		onHoverRef?: (event: MouseEvent, ref: CrossReference) => void;
		selectedVerseNumber?: number;
		onScrollToVerse?: (verse: number) => void;
	}

	let {
		fromBookName,
		fromChapter,
		fromVerse,
		refs,
		expanded,
		collapsed: externalCollapsed,
		onToggleExpand,
		onToggleCollapsed,
		onSelectRef,
		onHoverRef,
		selectedVerseNumber,
		onScrollToVerse,
	}: Props = $props();

	let internalCollapsed = $state(false);
	let isCollapsed = $derived(externalCollapsed !== undefined ? externalCollapsed : internalCollapsed);

	const locale = $derived(getLocale());
	const isVerseActive = $derived(
		selectedVerseNumber !== undefined && selectedVerseNumber === fromVerse
	);
	const { visible, overflow } = $derived(splitVisible(refs, RESOURCE_XREF_BAR_LIMIT));
	const showAllRefs = $derived(expanded);
	const displayRefs = $derived(showAllRefs ? refs : visible);
	const hasOverflow = $derived(overflow.length > 0);

	function toggleCollapse(event?: MouseEvent) {
		event?.stopPropagation();
		if (onToggleCollapsed) {
			onToggleCollapsed();
		} else {
			internalCollapsed = !internalCollapsed;
		}
	}
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<div
	class="tree-item open-bible-footnote-item open-bible-xref-block"
	class:is-active-verse={isVerseActive}
	class:is-collapsed={isCollapsed}
	id={`open-bible-xref-${fromVerse}`}
	data-footnote-verse={fromVerse}
	role="group"
>
	<div class="open-bible-footnote-header-row">
		<div
			class="open-bible-footnote-header-left"
			role="button"
			tabindex="0"
			onclick={toggleCollapse}
			onkeydown={(e) => {
				if (e.key === "Enter" || e.key === " ") {
					e.preventDefault();
					toggleCollapse();
				}
			}}
		>
			<span class="open-bible-footnote-chevron" class:is-expanded={!isCollapsed}>
				<IconButton
					class="open-bible-footnote-action-icon"
					iconName={isCollapsed ? "chevron-right" : "chevron-down"}
					title={isCollapsed ? t("resources.expandPanel") : t("resources.collapsePanel")}
					ariaLabel={isCollapsed ? t("resources.expandPanel") : t("resources.collapsePanel")}
					onclick={(e) => {
						e.stopPropagation();
						toggleCollapse(e);
					}}
				/>
			</span>
			<span
				class="open-bible-footnote-ref"
				role="button"
				tabindex="0"
				title={t("resources.scrollToVerse")}
				onclick={(e) => {
					e.stopPropagation();
					onScrollToVerse?.(fromVerse);
				}}
				onkeydown={(e) => {
					if (e.key === "Enter" || e.key === " ") {
						e.preventDefault();
						e.stopPropagation();
						onScrollToVerse?.(fromVerse);
					}
				}}
			>
				{fromBookName} {fromChapter}:{fromVerse}
			</span>
			<span class="open-bible-footnote-count-badge">
				{refs.length}
			</span>
		</div>
	</div>

	{#if !isCollapsed}
		<div class="open-bible-footnote-body">
			<div class="open-bible-xref-links">
				{#each displayRefs as ref, index (crossRefDomKey(ref))}
					{#if index > 0}<span class="open-bible-xref-comma" aria-hidden="true">, </span>{/if}
					<button
						type="button"
						class="open-bible-xref-link"
						title={formatCrossRef(ref, "long", locale)}
						onclick={(event) => {
							event.stopPropagation();
							onSelectRef(ref, event);
						}}
						onmouseenter={(event) => onHoverRef?.(event, ref)}
					>
						{formatCrossRef(ref, "long", locale)}
					</button>
				{/each}
			</div>
			{#if hasOverflow}
				<button
					type="button"
					class="open-bible-xref-toggle"
					onclick={(event) => {
						event.stopPropagation();
						onToggleExpand();
					}}
				>
					{showAllRefs ? t("resources.seeLess") : `${t("resources.seeMore")} (+${overflow.length})`}
				</button>
			{/if}
		</div>
	{/if}
</div>
