<script lang="ts">
	import { onMount } from "svelte";
	import { Platform } from "obsidian";
	import { icon } from "../../actions/icon";
	import type OpenBiblePlugin from "../../../main";
	import type { CrossReference, CrossReferenceBlock } from "../../../data/crossRefModel";
	import { chainForDialog } from "../../../data/crossRefModel";
	import { getLocale, t } from "../../../i18n";
	import { formatCrossRef, formatCrossRefOrigin } from "../../resources/formatCrossRef";
	import { openCrossRefPreview } from "../../resources/openCrossRefPreview";
	import type { ReaderContainerWidth } from "../../../settings";
	import IconButton from "../../kit/IconButton.svelte";
	import SearchField from "../../kit/SearchField.svelte";
	import CrossRefBlockComponent from "./CrossRefBlock.svelte";

	interface Props {
		plugin: OpenBiblePlugin;
		bookId: number;
		bookName: string;
		chapter: number;
		containerWidth?: ReaderContainerWidth;
		selectedVerseNumber?: number;
		isFixed?: boolean;
		isExpanded?: boolean;
		columns?: 1 | 2;
		onToggleFixed?: () => void;
		onToggleExpanded?: () => void;
		onToggleColumns?: () => void;
		onScrollToVerse?: (verse: number) => void;
	}

	let {
		plugin,
		bookId,
		bookName,
		chapter,
		containerWidth = "default",
		selectedVerseNumber,
		isFixed = false,
		isExpanded = true,
		columns = 2,
		onToggleFixed,
		onToggleExpanded,
		onToggleColumns,
		onScrollToVerse,
	}: Props = $props();

	let isMaximized = $state(false);
	let barHeight = $state(220);
	let isResizing = $state(false);
	let containerEl = $state<HTMLDivElement | null>(null);
	let listWidth = $state(0);

	let searchQuery = $state("");
	let isSearchOpen = $state(false);
	let searchInputEl = $state<HTMLInputElement | null>(null);

	let crossRefBlocks = $state<CrossReferenceBlock[]>([]);
	let expandedOverflowBlocks = $state<Set<number>>(new Set());
	let collapsedVerseBlocks = $state<Set<number>>(new Set());

	let effectiveColumns = $derived<1 | 2>(
		Platform.isMobile || (listWidth > 0 && listWidth < 540) ? 1 : columns
	);

	let filteredCrossRefBlocks = $derived.by(() => {
		const q = searchQuery.trim().toLowerCase();
		if (!q) return crossRefBlocks;
		const locale = getLocale();
		const originPrefix = `${bookName} ${chapter}:`.toLowerCase();
		return crossRefBlocks.filter((block) => {
			const origin = `${originPrefix}${block.fromVerse}`;
			if (origin.includes(q) || String(block.fromVerse) === q) return true;
			return block.refs.some((ref) =>
				formatCrossRef(ref, "long", locale).toLowerCase().includes(q)
			);
		});
	});

	let totalRefCount = $derived(
		filteredCrossRefBlocks.reduce((acc, block) => acc + block.refs.length, 0)
	);

	let areAllVersesCollapsed = $derived(
		crossRefBlocks.length > 0 && collapsedVerseBlocks.size >= crossRefBlocks.length
	);

	function loadBlocks() {
		if (!bookId || !chapter || !plugin.crossReferenceService) {
			crossRefBlocks = [];
			return;
		}
		if (!plugin.crossReferenceService.isReady()) {
			void plugin.crossReferenceService.load().then(() => {
				if (!bookId || !chapter) return;
				crossRefBlocks = plugin.crossReferenceService.getBlocksForChapter(bookId, chapter);
			});
			return;
		}
		crossRefBlocks = plugin.crossReferenceService.getBlocksForChapter(bookId, chapter);
	}

	$effect(() => {
		bookId;
		chapter;
		loadBlocks();
	});


	onMount(() => {
		if (plugin.settings.crossRefsBottomPanelHeight) {
			barHeight = plugin.settings.crossRefsBottomPanelHeight;
		}
		loadBlocks();
	});

	function handleResizerMouseDown(event: MouseEvent) {
		if (!isFixed || !isExpanded) return;
		event.preventDefault();
		event.stopPropagation();
		isResizing = true;
		const resizeStartY = event.clientY;
		const resizeStartHeight = barHeight;

		const onMouseMove = (e: MouseEvent) => {
			if (!isResizing) return;
			const delta = resizeStartY - e.clientY;
			const maxH = Math.min(window.innerHeight * 0.8, 800);
			const minH = 110;
			barHeight = Math.round(Math.max(minH, Math.min(maxH, resizeStartHeight + delta)));
			if (isMaximized) isMaximized = false;
		};

		const onMouseUp = async () => {
			if (!isResizing) return;
			isResizing = false;
			window.removeEventListener("mousemove", onMouseMove);
			window.removeEventListener("mouseup", onMouseUp);
			document.body.classList.remove("open-bible-is-resizing");
			await plugin.updateGeneral({ crossRefsBottomPanelHeight: barHeight });
		};

		document.body.classList.add("open-bible-is-resizing");
		window.addEventListener("mousemove", onMouseMove);
		window.addEventListener("mouseup", onMouseUp);
	}

	function handleResizerTouchStart(event: TouchEvent) {
		if (!isFixed || !isExpanded || event.touches.length === 0) return;
		const touch = event.touches[0];
		isResizing = true;
		const resizeStartY = touch.clientY;
		const resizeStartHeight = barHeight;

		const onTouchMove = (e: TouchEvent) => {
			if (!isResizing || e.touches.length === 0) return;
			const t = e.touches[0];
			const delta = resizeStartY - t.clientY;
			const maxH = Math.min(window.innerHeight * 0.8, 800);
			const minH = 110;
			barHeight = Math.round(Math.max(minH, Math.min(maxH, resizeStartHeight + delta)));
			if (isMaximized) isMaximized = false;
		};

		const onTouchEnd = async () => {
			if (!isResizing) return;
			isResizing = false;
			window.removeEventListener("touchmove", onTouchMove);
			window.removeEventListener("touchend", onTouchEnd);
			document.body.classList.remove("open-bible-is-resizing");
			await plugin.updateGeneral({ crossRefsBottomPanelHeight: barHeight });
		};

		document.body.classList.add("open-bible-is-resizing");
		window.addEventListener("touchmove", onTouchMove, { passive: true });
		window.addEventListener("touchend", onTouchEnd);
	}

	function handleResizerDoubleClick(event: MouseEvent) {
		event.stopPropagation();
		if (isMaximized) {
			isMaximized = false;
			barHeight = 220;
		} else {
			barHeight = Math.round(Math.min(window.innerHeight * 0.65, 550));
		}
	}

	function toggleSearch(event?: MouseEvent) {
		event?.stopPropagation();
		isSearchOpen = !isSearchOpen;
		if (isSearchOpen) {
			setTimeout(() => searchInputEl?.focus(), 50);
		} else {
			searchQuery = "";
		}
	}

	function toggleAllVersesCollapse() {
		if (areAllVersesCollapsed) {
			collapsedVerseBlocks = new Set();
		} else {
			collapsedVerseBlocks = new Set(crossRefBlocks.map((b) => b.fromVerse));
		}
	}

	function toggleVerseCollapsed(fromVerse: number) {
		const next = new Set(collapsedVerseBlocks);
		if (next.has(fromVerse)) {
			next.delete(fromVerse);
		} else {
			next.add(fromVerse);
		}
		collapsedVerseBlocks = next;
	}

	function toggleVerseOverflow(fromVerse: number) {
		const next = new Set(expandedOverflowBlocks);
		if (next.has(fromVerse)) {
			next.delete(fromVerse);
		} else {
			next.add(fromVerse);
		}
		expandedOverflowBlocks = next;
	}

	function makeSelectCrossRefHandler(block: CrossReferenceBlock, expanded: boolean) {
		return (ref: CrossReference, _event: MouseEvent) => {
			const chainRefs = chainForDialog(block, expanded);
			const chainIndex = chainRefs.indexOf(ref);
			void openCrossRefPreview(plugin.app, plugin, ref, {
				originLabel: formatCrossRefOrigin(ref),
				chainRefs,
				chainIndex: chainIndex >= 0 ? chainIndex : 0,
			});
		};
	}
</script>

<div
	bind:this={containerEl}
	class="open-bible-footnotes-container open-bible-backlinks-panel"
	class:is-fixed={isFixed}
	class:is-collapsed={!isExpanded}
	class:is-maximized={isMaximized && isExpanded}
	class:is-resizing={isResizing}
	data-container-width={containerWidth}
	style:height={isFixed && isExpanded && !isMaximized ? `${barHeight}px` : undefined}
>
	{#if isFixed && isExpanded && !isMaximized}
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="open-bible-footnotes-resizer"
			title={t("resources.pinFixed")}
			onmousedown={handleResizerMouseDown}
			ontouchstart={handleResizerTouchStart}
			ondblclick={handleResizerDoubleClick}
		>
			<span class="open-bible-footnotes-resizer-line"></span>
		</div>
	{/if}

	<div class="open-bible-footnotes-inner">
		<div class="open-bible-footnotes-header">
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<div
				class="open-bible-footnotes-title-group"
				role="button"
				tabindex="0"
				onclick={onToggleExpanded}
				aria-expanded={isExpanded}
				title={isExpanded ? t("resources.collapsePanel") : t("resources.expandPanel")}
			>
				<span
					class="open-bible-footnotes-chevron"
					class:is-expanded={isExpanded}
					use:icon={"chevron-right"}
				></span>
				<span class="open-bible-footnotes-title">
					{t("resources.crossReferences")}
				</span>
				<span class="open-bible-footnotes-count">{totalRefCount}</span>
			</div>

			<div class="open-bible-footnotes-actions">
				<IconButton
					iconName={areAllVersesCollapsed ? "unfold-vertical" : "fold-vertical"}
					ariaLabel={areAllVersesCollapsed ? t("resources.expandAll") : t("resources.collapseAll")}
					title={areAllVersesCollapsed ? t("resources.expandAll") : t("resources.collapseAll")}
					onclick={toggleAllVersesCollapse}
				/>
				<IconButton
					iconName={columns === 2 ? "rows-2" : "columns-2"}
					ariaLabel={columns === 2 ? t("resources.columnsOne") : t("resources.columnsTwo")}
					title={columns === 2 ? t("resources.columnsOne") : t("resources.columnsTwo")}
					onclick={onToggleColumns}
				/>
				<IconButton
					iconName="search"
					active={isSearchOpen || Boolean(searchQuery)}
					title={t("resources.searchTitle")}
					ariaLabel={t("resources.searchTitle")}
					onclick={toggleSearch}
				/>
				{#if onToggleFixed}
					<IconButton
						active={isFixed}
						iconName={isFixed ? "pin-off" : "pin"}
						ariaLabel={isFixed ? t("resources.pinInline") : t("resources.pinFixed")}
						title={isFixed ? t("resources.pinInline") : t("resources.pinFixed")}
						onclick={onToggleFixed}
					/>
				{/if}
			</div>
		</div>

		{#if isExpanded && (isSearchOpen || searchQuery)}
			<div class="open-bible-footnotes-search-row">
				<SearchField
					placeholder={t("resources.searchPlaceholder")}
					bind:value={searchQuery}
					bind:inputEl={searchInputEl}
				/>
			</div>
		{/if}

		{#if isExpanded}
			<div class="open-bible-footnotes-content">
				{#if filteredCrossRefBlocks.length === 0}
					<div class="open-bible-footnotes-empty">
						<span>{t("resources.crossRefsEmpty")}</span>
					</div>
				{:else}
					<div
						class="open-bible-footnotes-list"
						bind:clientWidth={listWidth}
						data-columns={effectiveColumns}
					>
						{#if effectiveColumns === 2}
							<div class="open-bible-footnotes-col">
								{#each filteredCrossRefBlocks.filter((_, i) => i % 2 === 0) as block (block.fromVerse)}
									{@const isVerseExpanded = expandedOverflowBlocks.has(block.fromVerse)}
									{@const isVerseCollapsed = collapsedVerseBlocks.has(block.fromVerse)}
									<CrossRefBlockComponent
										fromBookName={bookName}
										fromChapter={chapter}
										fromVerse={block.fromVerse}
										refs={block.refs}
										expanded={isVerseExpanded}
										collapsed={isVerseCollapsed}
										onToggleExpand={() => toggleVerseOverflow(block.fromVerse)}
										onToggleCollapsed={() => toggleVerseCollapsed(block.fromVerse)}
										onSelectRef={makeSelectCrossRefHandler(block, isVerseExpanded)}
										{selectedVerseNumber}
										{onScrollToVerse}
									/>
								{/each}
							</div>
							<div class="open-bible-footnotes-col">
								{#each filteredCrossRefBlocks.filter((_, i) => i % 2 !== 0) as block (block.fromVerse)}
									{@const isVerseExpanded = expandedOverflowBlocks.has(block.fromVerse)}
									{@const isVerseCollapsed = collapsedVerseBlocks.has(block.fromVerse)}
									<CrossRefBlockComponent
										fromBookName={bookName}
										fromChapter={chapter}
										fromVerse={block.fromVerse}
										refs={block.refs}
										expanded={isVerseExpanded}
										collapsed={isVerseCollapsed}
										onToggleExpand={() => toggleVerseOverflow(block.fromVerse)}
										onToggleCollapsed={() => toggleVerseCollapsed(block.fromVerse)}
										onSelectRef={makeSelectCrossRefHandler(block, isVerseExpanded)}
										{selectedVerseNumber}
										{onScrollToVerse}
									/>
								{/each}
							</div>
						{:else}
							{#each filteredCrossRefBlocks as block (block.fromVerse)}
								{@const isVerseExpanded = expandedOverflowBlocks.has(block.fromVerse)}
								{@const isVerseCollapsed = collapsedVerseBlocks.has(block.fromVerse)}
								<CrossRefBlockComponent
									fromBookName={bookName}
									fromChapter={chapter}
									fromVerse={block.fromVerse}
									refs={block.refs}
									expanded={isVerseExpanded}
									collapsed={isVerseCollapsed}
									onToggleExpand={() => toggleVerseOverflow(block.fromVerse)}
									onToggleCollapsed={() => toggleVerseCollapsed(block.fromVerse)}
									onSelectRef={makeSelectCrossRefHandler(block, isVerseExpanded)}
									{selectedVerseNumber}
									{onScrollToVerse}
								/>
							{/each}
						{/if}
					</div>
				{/if}
			</div>
		{/if}
	</div>
</div>
