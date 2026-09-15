<script lang="ts">
	import { Menu, Notice, Platform, TFile } from "obsidian";
	import { t } from "../../../i18n";
	import type { BibleBook, BibleVerse } from "../../../models/bible";
	import type { BibleNoteItem } from "../../../models/note";
	import { DEFAULT_NOTE_CONFIGS, type ReaderContainerWidth, type ReaderSpacing } from "../../../settings";
	import type { CrossReference, CrossReferenceBlock } from "../../../data/crossRefModel";
	import type { CrossReferenceService } from "../../../services/CrossReferenceService";
	import type { NavigationDirection } from "../types";
	import { shouldUseCenter, splitThompsonColumns, type ThompsonLayoutMode } from "../thompsonLayout";
	import { THOMPSON_NARROW_BREAKPOINT } from "../thompsonMenu";
	import { icon } from "../../actions/icon";
	import Button from "../../kit/Button.svelte";
	import EmptyState from "../../kit/EmptyState.svelte";
	import type OpenBiblePlugin from "../../../main";
	import VerseRow from "./VerseRow.svelte";
	import VerseActionBar from "../../components/VerseActionBar.svelte";
	import { applyVerseClick } from "../verseSelection";
	import { captureTextSelection, clearBrowserSelection, type TextRangeData } from "../textRangeSelection";
	import { buildNoteLanes, buildVerseLanesMap, resolveNoteTitle } from "../noteLanes";
	import { formatReference, formatVersesText } from "../../../services/verseFormat";
	import { createNoteFromSelection, findNotesForPassage } from "../../../services/NoteService";
	import { NotePreviewModal, openNoteInEditor } from "../../modals/NotePreviewModal";
	import { ConfirmDeleteHighlightModal } from "../../modals/ConfirmDeleteModal";

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
		plugin?: OpenBiblePlugin;
		versionAbbr?: string;
		selectedVerseNumber?: number;
		navigationDirection?: NavigationDirection;
		isSelectionMode?: boolean;
		onRetry?: () => void;
		onToggleTwoColumns?: () => void;
		onSelectCrossRef?: (verseNumber: number, ref: CrossReference, event: MouseEvent) => void;
		onSelectVerse?: (verseNumber: number | undefined) => void;
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
		plugin,
		versionAbbr = "",
		navigationDirection = "jump",
		isSelectionMode = false,
		onRetry,
		onToggleTwoColumns,
		onSelectCrossRef,
		onSelectVerse,
	}: Props = $props();

	let selectedVerseNumbers = $state<number[]>([]);
	let lastClickedVerse = $state<number | null>(null);
	let textRangeSelection = $state<TextRangeData | null>(null);
	let hoveredNotePath = $state<string | null>(null);
	let versesContainerEl = $state<HTMLElement | undefined>();
	let containerWidthPx = $state(0);
	let vaultVersion = $state(0);

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

	let prevBookId: number | undefined;
	let prevChapter: number | undefined;

	// Reset selection when passage changes
	$effect(() => {
		const bId = book?.id;
		const ch = chapter;
		if (bId !== prevBookId || ch !== prevChapter) {
			prevBookId = bId;
			prevChapter = ch;
			clearSelection();
		}
	});

	// Subscribe to highlights and vault changes
	$effect(() => {
		if (!plugin?.highlightService) return;
		const unsub = plugin.highlightService.subscribe(() => {
			vaultVersion++;
		});
		return unsub;
	});

	$effect(() => {
		const targetApp = plugin?.app;
		if (!targetApp) return;
		const notify = () => {
			vaultVersion++;
		};
		const e1 = targetApp.vault.on("create", notify);
		const e2 = targetApp.vault.on("delete", notify);
		const e3 = targetApp.vault.on("rename", notify);
		const e4 = targetApp.metadataCache.on("changed", notify);
		return () => {
			targetApp.vault.offref(e1);
			targetApp.vault.offref(e2);
			targetApp.vault.offref(e3);
			targetApp.metadataCache.offref(e4);
		};
	});

	let chapterHighlights = $derived.by(() => {
		void vaultVersion;
		if (!plugin?.highlightService || !book || chapter === undefined) return [];
		return plugin.highlightService.getHighlightsForChapter(book.name, chapter);
	});

	let chapterNotes = $derived.by(() => {
		void vaultVersion;
		const targetApp = plugin?.app;
		if (!targetApp || !book || chapter === undefined) return [];
		return findNotesForPassage(targetApp, book.name, chapter, plugin.settings.notesFolder);
	});

	let verseHighlightsMap = $derived.by(() => {
		const map = new Map<number, BibleNoteItem[]>();
		for (const hl of chapterHighlights) {
			for (const v of hl.verses) {
				const list = map.get(v) ?? [];
				if (!list.some((existing) => existing.path === hl.path)) {
					list.push(hl);
				}
				map.set(v, list);
			}
		}
		return map;
	});

	let noteLanesData = $derived.by(() => {
		const targetApp = plugin?.app;
		const laneSources = chapterNotes.map((n) => ({
			id: n.path,
			verses: n.verses,
			color: n.color,
			linkedNotePath: n.path,
			noteTitle: n.title,
		}));
		return buildNoteLanes(laneSources, (path, fallback) => {
			const file = path && targetApp ? targetApp.vault.getAbstractFileByPath(path) : null;
			return resolveNoteTitle(path, fallback, file instanceof TFile ? file.basename : null);
		});
	});

	let verseLanesMap = $derived.by(() =>
		buildVerseLanesMap(
			verses.map((v) => v.number),
			noteLanesData
		)
	);

	let selectedVerses = $derived(
		verses.filter((v) => selectedVerseNumbers.includes(v.number))
	);

	let formattedRef = $derived(
		book && chapter !== undefined && selectedVerseNumbers.length > 0
			? formatReference(book.name, chapter, selectedVerseNumbers, versionAbbr)
			: ""
	);

	let activeHighlight = $derived.by(() => {
		if (selectedVerseNumbers.length === 0) return null;
		return (
			chapterHighlights.find(
				(h) =>
					h.verses.length === selectedVerseNumbers.length &&
					h.verses.every((v) => selectedVerseNumbers.includes(v))
			) ?? null
		);
	});

	let currentColor = $derived<string | null>(activeHighlight ? activeHighlight.color : null);

	let justCapturedTextRange = false;

	function clearSelection() {
		selectedVerseNumbers = [];
		lastClickedVerse = null;
		textRangeSelection = null;
		onSelectVerse?.(undefined);
	}

	function handleVerseClick(verseNumber: number, event: MouseEvent) {
		if (justCapturedTextRange) {
			justCapturedTextRange = false;
			return;
		}
		textRangeSelection = null;
		const next = applyVerseClick(
			selectedVerseNumbers,
			lastClickedVerse,
			verseNumber,
			verses.map((v) => v.number),
			event.shiftKey,
			isSelectionMode
		);
		selectedVerseNumbers = next.selected;
		lastClickedVerse = next.lastClicked;
		onSelectVerse?.(selectedVerseNumbers[0]);
	}

	function handleToggleVerseSelection(verseNumber: number) {
		textRangeSelection = null;
		const next = applyVerseClick(
			selectedVerseNumbers,
			lastClickedVerse,
			verseNumber,
			verses.map((v) => v.number),
			false,
			true
		);
		selectedVerseNumbers = next.selected;
		lastClickedVerse = next.lastClicked;
		onSelectVerse?.(selectedVerseNumbers[0]);
	}

	function handleVerseTextMouseUp(event: MouseEvent | TouchEvent) {
		const target = event.target as HTMLElement;
		const verseTextEl = target.closest(".open-bible-reader-verse-text") as HTMLElement | null;

		if (!verseTextEl) {
			return;
		}

		const rangeData = captureTextSelection(verseTextEl);
		if (rangeData) {
			justCapturedTextRange = true;
			textRangeSelection = rangeData;
			selectedVerseNumbers = [rangeData.verseNumber];
			lastClickedVerse = rangeData.verseNumber;
			onSelectVerse?.(rangeData.verseNumber);
			clearBrowserSelection();
			setTimeout(() => {
				justCapturedTextRange = false;
			}, 300);
		}
	}

	async function copyReference() {
		if (!formattedRef) return;
		try {
			await navigator.clipboard.writeText(formattedRef);
			new Notice(t("notices.referenceCopied"));
			clearSelection();
		} catch (e) {
			console.error("OpenBible: error copying reference", e);
		}
	}

	async function copyText() {
		if (!book || chapter === undefined || selectedVerses.length === 0) return;
		try {
			const quote =
				textRangeSelection?.selectedText ||
				formatVersesText(selectedVerses, book.name, chapter, versionAbbr);
			await navigator.clipboard.writeText(quote);
			new Notice(t("notices.textCopied"));
			clearSelection();
		} catch (e) {
			console.error("OpenBible: error copying scripture text", e);
		}
	}

	async function handleCreateNote(colorId?: string) {
		if (!plugin || !book || chapter === undefined || selectedVerses.length === 0) return;
		try {
			const noteConfigs = plugin.settings.configuredNotes && plugin.settings.configuredNotes.length > 0
				? plugin.settings.configuredNotes
				: DEFAULT_NOTE_CONFIGS;
			const target = colorId ? noteConfigs.find((c) => c.id === colorId || c.color === colorId) : noteConfigs[0];
			const color = target ? target.color : (colorId || currentColor || "yellow");
			const label = target ? target.label : undefined;

			await createNoteFromSelection(plugin.app, plugin.settings, {
				book,
				chapter,
				verses: selectedVerses,
				versionAbbr,
				color,
				label,
				selectedText: textRangeSelection?.selectedText,
				charStart: textRangeSelection?.charStart,
				charEnd: textRangeSelection?.charEnd,
			});
			new Notice(t("notices.noteCreated"));
			clearSelection();
		} catch (err) {
			console.error("OpenBible: error creating note", err);
			new Notice(t("notices.createNoteError"));
		}
	}

	async function handleHighlightColor(colorId: string) {
		if (!plugin?.highlightService || !book || chapter === undefined || selectedVerses.length === 0) return;
		try {
			const highlightConfig = plugin.settings.configuredHighlights?.find(
				(h) => h.id === colorId || h.color === colorId
			);
			const color = highlightConfig ? highlightConfig.color : colorId;
			const label = highlightConfig ? highlightConfig.label : undefined;

			await plugin.highlightService.addOrUpdateHighlight({
				book,
				chapter,
				verses: selectedVerses,
				versionAbbr,
				color,
				label,
				selectedText: textRangeSelection?.selectedText,
				charStart: textRangeSelection?.charStart,
				charEnd: textRangeSelection?.charEnd,
			});
			new Notice(t("notices.highlightAdded"));
			clearSelection();
		} catch (err) {
			console.error("OpenBible: error adding highlight", err);
		}
	}

	async function handleRemoveHighlight() {
		if (!plugin?.highlightService || !book || chapter === undefined || selectedVerseNumbers.length === 0) return;

		if (plugin.settings.confirmHighlightDeletion) {
			const targetHl = activeHighlight ?? chapterHighlights.find((h) => h.verses.some((v) => selectedVerseNumbers.includes(v)));
			const ref = targetHl?.reference ?? formattedRef;
			new ConfirmDeleteHighlightModal(plugin.app, plugin, ref, async () => {
				await plugin.highlightService.removeHighlightForVerses(book.name, chapter, selectedVerseNumbers);
				new Notice(t("notices.highlightRemoved"));
				clearSelection();
			}).open();
		} else {
			await plugin.highlightService.removeHighlightForVerses(book.name, chapter, selectedVerseNumbers);
			new Notice(t("notices.highlightRemoved"));
			clearSelection();
		}
	}

	async function handleRemoveHighlightByPath(path: string) {
		if (!plugin?.highlightService) return;
		if (plugin.settings.confirmHighlightDeletion) {
			const hl = chapterHighlights.find((h) => h.path === path);
			new ConfirmDeleteHighlightModal(plugin.app, plugin, hl?.reference || "", async () => {
				await plugin.highlightService.removeHighlight(path);
				new Notice(t("notices.highlightRemoved"));
			}).open();
		} else {
			await plugin.highlightService.removeHighlight(path);
			new Notice(t("notices.highlightRemoved"));
		}
	}

	function handleOpenNote(notePath: string, event?: MouseEvent) {
		if (!plugin) return;
		if (event?.ctrlKey || event?.metaKey) {
			void openNoteInEditor(plugin.app, notePath);
		} else {
			new NotePreviewModal(plugin.app, plugin, notePath).open();
		}
	}

	function handleNoteLineHover(event: MouseEvent, notePath: string) {
		const targetApp = plugin?.app;
		if (!targetApp || !notePath) return;
		const targetEl = event.currentTarget as HTMLElement;

		const isTriggerKey = event.shiftKey || event.metaKey || event.ctrlKey;
		if (!isTriggerKey) return;

		const simulatedEvent = new MouseEvent("mouseover", {
			bubbles: true,
			cancelable: true,
			view: window,
			clientX: event.clientX,
			clientY: event.clientY,
			ctrlKey: true,
			metaKey: true,
			shiftKey: true,
			altKey: event.altKey,
		});

		targetApp.workspace.trigger("hover-link", {
			event: simulatedEvent,
			source: "open-bible",
			hoverParent: targetApp.workspace.getLeaf(),
			targetEl,
			linktext: notePath,
			sourcePath: "",
		});
	}

	function handleNoteLineKeyDown(event: KeyboardEvent, notePath: string, targetEl: HTMLElement) {
		if (event.key === "Shift" || event.key === "Control" || event.key === "Meta") {
			const targetApp = plugin?.app;
			if (!targetApp || !notePath) return;

			const rect = targetEl.getBoundingClientRect();
			const simulatedEvent = new MouseEvent("mouseover", {
				bubbles: true,
				cancelable: true,
				view: window,
				clientX: rect.left + rect.width / 2,
				clientY: rect.top + rect.height / 2,
				ctrlKey: true,
				metaKey: true,
				shiftKey: true,
			});

			targetApp.workspace.trigger("hover-link", {
				event: simulatedEvent,
				source: "open-bible",
				hoverParent: targetApp.workspace.getLeaf(),
				targetEl,
				linktext: notePath,
				sourcePath: "",
			});
		}
	}

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
	class:has-verse-selection={selectedVerseNumbers.length > 0}
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
		{#key `${book.id}-${chapter}`}
			<div
				class="open-bible-chapter-transition"
				class:is-next={navigationDirection === "next"}
				class:is-prev={navigationDirection === "prev"}
				class:is-jump={navigationDirection === "jump"}
			>
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
						onmouseup={handleVerseTextMouseUp}
						ontouchend={handleVerseTextMouseUp}
					>
						<div class="open-bible-thompson-column open-bible-thompson-column-left">
							{#each thompsonColumns.left as verse (verse.number)}
								<VerseRow
									{verse}
									isSelected={selectedVerseNumbers.includes(verse.number)}
									{isSelectionMode}
									{hoveredNotePath}
									highlights={verseHighlightsMap.get(verse.number) ?? []}
									laneSlots={verseLanesMap.get(verse.number) ?? []}
									totalLanes={noteLanesData.totalLanes}
									xrefRefs={verseXrefsMap.get(verse.number) ?? []}
									showXrefGutter={showThompsonXrefs}
									xrefGutterAlign="end"
									onVerseClick={handleVerseClick}
									onToggleVerseSelection={handleToggleVerseSelection}
									onOpenNote={handleOpenNote}
									onNoteLineHover={handleNoteLineHover}
									onNoteLineEnter={(path) => (hoveredNotePath = path)}
									onNoteLineLeave={() => (hoveredNotePath = null)}
									onNoteLineKeyDown={handleNoteLineKeyDown}
									onXrefSelect={(ref, ev) => onSelectCrossRef?.(verse.number, ref, ev)}
									onRemoveHighlight={handleRemoveHighlightByPath}
								/>
							{/each}
						</div>
						<div class="open-bible-thompson-column open-bible-thompson-column-right">
							{#each thompsonColumns.right as verse (verse.number)}
								<VerseRow
									{verse}
									isSelected={selectedVerseNumbers.includes(verse.number)}
									{isSelectionMode}
									{hoveredNotePath}
									highlights={verseHighlightsMap.get(verse.number) ?? []}
									laneSlots={verseLanesMap.get(verse.number) ?? []}
									totalLanes={noteLanesData.totalLanes}
									xrefRefs={verseXrefsMap.get(verse.number) ?? []}
									showXrefGutter={showThompsonXrefs}
									xrefGutterAlign="start"
									onVerseClick={handleVerseClick}
									onToggleVerseSelection={handleToggleVerseSelection}
									onOpenNote={handleOpenNote}
									onNoteLineHover={handleNoteLineHover}
									onNoteLineEnter={(path) => (hoveredNotePath = path)}
									onNoteLineLeave={() => (hoveredNotePath = null)}
									onNoteLineKeyDown={handleNoteLineKeyDown}
									onXrefSelect={(ref, ev) => onSelectCrossRef?.(verse.number, ref, ev)}
									onRemoveHighlight={handleRemoveHighlightByPath}
								/>
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
						onmouseup={handleVerseTextMouseUp}
						ontouchend={handleVerseTextMouseUp}
					>
						{#each verses as verse (verse.number)}
							<VerseRow
								{verse}
								isSelected={selectedVerseNumbers.includes(verse.number)}
								{isSelectionMode}
								{hoveredNotePath}
								highlights={verseHighlightsMap.get(verse.number) ?? []}
								laneSlots={verseLanesMap.get(verse.number) ?? []}
								totalLanes={noteLanesData.totalLanes}
								xrefRefs={verseXrefsMap.get(verse.number) ?? []}
								showXrefGutter={showThompsonXrefs}
								onVerseClick={handleVerseClick}
								onToggleVerseSelection={handleToggleVerseSelection}
								onOpenNote={handleOpenNote}
								onNoteLineHover={handleNoteLineHover}
								onNoteLineEnter={(path) => (hoveredNotePath = path)}
								onNoteLineLeave={() => (hoveredNotePath = null)}
								onNoteLineKeyDown={handleNoteLineKeyDown}
								onXrefSelect={(ref, ev) => onSelectCrossRef?.(verse.number, ref, ev)}
								onRemoveHighlight={handleRemoveHighlightByPath}
							/>
						{/each}
					</div>
				{/if}
			</div>
		{/key}
	{/if}

	{#if selectedVerseNumbers.length > 0}
		<VerseActionBar
			reference={formattedRef}
			selectedCount={selectedVerseNumbers.length}
			selectedSnippet={textRangeSelection?.selectedText}
			configuredHighlights={plugin?.settings.configuredHighlights || []}
			configuredNotes={plugin?.settings.configuredNotes || []}
			{currentColor}
			onCopyReference={copyReference}
			onCopyText={copyText}
			onCreateNote={handleCreateNote}
			onHighlightColor={handleHighlightColor}
			onRemoveHighlight={handleRemoveHighlight}
			onOpenConfigureHighlights={() => plugin?.openPluginSettings()}
			onClose={clearSelection}
		/>
	{/if}
</div>
