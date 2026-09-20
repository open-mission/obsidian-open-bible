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
	import { captureTextSelection, captureWordAtPosition, clearBrowserSelection, type TextRangeData } from "../textRangeSelection";
	import { buildNoteLanes, buildVerseLanesMap, resolveNoteTitle } from "../noteLanes";
	import { formatReference, formatVersesText } from "../../../services/verseFormat";
	import { createNoteFromSelection, findNotesForPassage } from "../../../services/NoteService";
	import { NotePreviewModal, openNoteInEditor } from "../../modals/NotePreviewModal";
	import { ConfirmDeleteHighlightModal } from "../../modals/ConfirmDeleteModal";
	import { ResourceLinkModal } from "../../modals/ResourceLinkModal";
	import { ResourceChooserModal } from "../../modals/ResourceChooserModal";
	import { ResourcePreviewModal } from "../../modals/ResourcePreviewModal";
	import { HighlightPickerModal } from "../../modals/HighlightPickerModal";
	import { ResourceTypePickerModal } from "../../modals/ResourceTypePickerModal";
	import type { BibleResourceLink } from "../../../models/resource";

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
		onOpenResource?: (link: BibleResourceLink) => void;
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
		onOpenResource,
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
		if (!plugin?.resourceService) return;
		const unsub = plugin.resourceService.subscribe(() => {
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

	let chapterResourceLinks = $derived.by((): BibleResourceLink[] => {
		void vaultVersion;
		if (!plugin?.resourceService || !book || chapter === undefined) return [];
		return plugin.resourceService.getLinksForChapter(book.name, chapter);
	});

	let verseResourcesMap = $derived.by(() => {
		const map = new Map<number, BibleResourceLink[]>();
		for (const link of chapterResourceLinks) {
			for (const v of link.verses) {
				const list = map.get(v) ?? [];
				if (!list.some((existing) => existing.path === link.path)) {
					list.push(link);
				}
				map.set(v, list);
			}
		}
		return map;
	});

	let resourceTypes = $derived(plugin?.resourceService?.getResourceTypes() ?? []);
	let resourceDisplayStyle = $derived(plugin?.settings.resourceDisplayStyle ?? "icon");
	let resourceColorize = $derived(plugin?.settings.resourceColorize ?? true);

	interface AutoResourceMatch {
		link: BibleResourceLink;
		charStart: number;
		charEnd: number;
	}

	function isWordChar(ch: string | undefined): boolean {
		return Boolean(ch && /[\p{L}\p{N}_]/u.test(ch));
	}

	/**
	 * A word-linked resource (e.g. "Deus") shows its marker on every whole-word
	 * occurrence of the linked text across the chapter, not just where it was created.
	 */
	let autoMatchesByVerse = $derived.by(() => {
		const map = new Map<number, AutoResourceMatch[]>();
		if (!book || chapter === undefined) return map;
		const ranged = chapterResourceLinks.filter(
			(l) =>
				Boolean(l.matchAllOccurrences) &&
				l.selectedText &&
				l.selectedText.trim() &&
				l.charStart !== undefined &&
				l.charEnd !== undefined,
		);
		if (ranged.length === 0) return map;
		for (const v of verses) {
			const found: AutoResourceMatch[] = [];
			const hayLower = v.text.toLowerCase();
			for (const link of ranged) {
				const needle = link.selectedText!.trim();
				const needleLower = needle.toLowerCase();
				let from = 0;
				while (from <= hayLower.length - needleLower.length) {
					const idx = hayLower.indexOf(needleLower, from);
					if (idx < 0) break;
					const end = idx + needle.length;
					const wholeWord = !isWordChar(v.text[idx - 1]) && !isWordChar(v.text[end]);
					const isOriginal =
						link.verses.includes(v.number) && link.charStart === idx && link.charEnd === end;
					if (wholeWord && !isOriginal) {
						found.push({ link, charStart: idx, charEnd: end });
					}
					from = idx + Math.max(1, needle.length);
				}
			}
			if (found.length > 0) map.set(v.number, found);
		}
		return map;
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

	let justCapturedTextRange = $state(false);

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

	function handleVerseTextClick(event: MouseEvent) {
		if (isSelectionMode) return;
		if (justCapturedTextRange) return;

		const selection = window.getSelection();
		if (selection && !selection.isCollapsed && selection.toString().trim()) {
			return;
		}

		if (selectedVerseNumbers.length > 0 || textRangeSelection) {
			clearSelection();
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

	function handleLinkResource(typeId: string) {
		if (!plugin?.resourceService || !book || chapter === undefined || selectedVerses.length === 0) return;
		const resType = plugin.resourceService.getResourceType(typeId);
		if (!resType) return;
		const snippet = textRangeSelection?.selectedText;
		const charStart = textRangeSelection?.charStart;
		const charEnd = textRangeSelection?.charEnd;
		new ResourceLinkModal(
			plugin.app,
			plugin,
			resType,
			formattedRef,
			async (resource, matchAll) => {
				try {
					await plugin.resourceService.addOrUpdateLink({
						typeId,
						resourcePath: resource.path,
						resourceName: resource.name,
						book,
						chapter,
						verses: selectedVerses,
						versionAbbr,
						selectedText: snippet,
						charStart,
						charEnd,
						matchAllOccurrences: matchAll,
					});
					new Notice(t("notices.resourceLinked"));
					clearSelection();
				} catch (err) {
					console.error("OpenBible: error linking resource", err);
					new Notice(t("notices.resourceLinkError"));
				}
			},
			async (name, matchAll) => {
				try {
					const resource = await plugin.resourceService.ensureResource(typeId, name);
					new Notice(t("notices.resourceCreated"));
					await plugin.resourceService.addOrUpdateLink({
						typeId,
						resourcePath: resource.path,
						resourceName: resource.name,
						book,
						chapter,
						verses: selectedVerses,
						versionAbbr,
						selectedText: snippet,
						charStart,
						charEnd,
						matchAllOccurrences: matchAll,
					});
					new Notice(t("notices.resourceLinked"));
					clearSelection();
				} catch (err) {
					console.error("OpenBible: error creating resource", err);
					new Notice(t("notices.resourceLinkError"));
				}
			},
			snippet,
		).open();
	}

	function handleOpenResource(link: BibleResourceLink, event?: MouseEvent) {
		if (!plugin) return;
		if (event?.ctrlKey || event?.metaKey) {
			void openNoteInEditor(plugin.app, link.resourcePath);
			return;
		}
		if (onOpenResource) {
			onOpenResource(link);
			return;
		}
		new ResourcePreviewModal(
			plugin.app,
			plugin,
			link,
			(bookName, ch, vNum, vAbbr) => {
				void plugin.navigateToPassage(bookName, ch, vNum, vAbbr);
			},
			(linkPath) => {
				void handleUnlinkResource(linkPath);
			},
		).open();
	}

	/**
	 * Marker click: a single link opens its preview directly; several links
	 * at the same anchor open the chooser modal listing the linked items.
	 */
	function handleOpenResourceGroup(links: BibleResourceLink[], event?: MouseEvent) {
		if (!plugin || links.length === 0) return;
		if (links.length === 1) {
			handleOpenResource(links[0], event);
			return;
		}
		new ResourceChooserModal(
			plugin.app,
			plugin,
			links,
			(link) => handleOpenResource(link),
			(linkPath) => {
				void handleUnlinkResource(linkPath);
			},
		).open();
	}

	/** Shift (or configured modifier) + hover on a marker/linked word previews the resource. */
	function handleResourceHover(event: MouseEvent, link: BibleResourceLink, targetEl: HTMLElement) {
		const targetApp = plugin?.app;
		if (!targetApp || !link?.resourcePath) return;
		const mod = plugin?.settings.resourceHoverModifier ?? "shift";
		const triggered =
			mod === "none"
				? true
				: mod === "alt"
					? event.altKey
					: mod === "ctrlCmd"
						? event.ctrlKey || event.metaKey
						: event.shiftKey;
		if (!triggered) return;

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
			linktext: link.resourcePath,
			sourcePath: "",
		});
	}

	async function handleUnlinkResource(linkPath: string) {
		if (!plugin?.resourceService) return;
		await plugin.resourceService.removeLink(linkPath);
		new Notice(t("notices.resourceLinkRemoved"));
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

		const verseTextEl = target?.closest(".open-bible-reader-verse-text") as HTMLElement | null;

		// 1. If no textRangeSelection yet, check if there's an active browser selection to capture
		if (!textRangeSelection && verseTextEl) {
			const browserRange = captureTextSelection(verseTextEl);
			if (browserRange) {
				justCapturedTextRange = true;
				textRangeSelection = browserRange;
				selectedVerseNumbers = [browserRange.verseNumber];
				lastClickedVerse = browserRange.verseNumber;
				onSelectVerse?.(browserRange.verseNumber);
				clearBrowserSelection();
				setTimeout(() => {
					justCapturedTextRange = false;
				}, 300);
			}
		}

		// 2. If still no textRangeSelection and right-clicked directly on verse text, capture the word under cursor
		if (!textRangeSelection && verseTextEl) {
			const wordRange = captureWordAtPosition(verseTextEl, event.clientX, event.clientY);
			if (wordRange) {
				textRangeSelection = wordRange;
				selectedVerseNumbers = [wordRange.verseNumber];
				lastClickedVerse = wordRange.verseNumber;
				onSelectVerse?.(wordRange.verseNumber);
			}
		}

		// If nothing is selected, do not intercept with custom menu
		if (selectedVerseNumbers.length === 0 && !textRangeSelection) {
			return;
		}

		event.preventDefault();
		event.stopPropagation();

		const menu = new Menu();

		// 1. Criar nota (immediately creates note)
		menu.addItem((item) => {
			item.setTitle(t("contextMenu.createNote") || "Criar nota")
				.setIcon("file-text")
				.onClick(() => {
					void handleCreateNote();
				});
		});

		// 2. Highlight (opens modal with highlight options)
		menu.addItem((item) => {
			item.setTitle(t("contextMenu.highlight") || "Highlight")
				.setIcon("highlighter")
				.onClick(() => {
					if (!plugin) return;
					new HighlightPickerModal(
						plugin.app,
						formattedRef,
						plugin.settings.configuredHighlights || [],
						currentColor,
						(colorId) => void handleHighlightColor(colorId),
						selectedVerseNumbers.length > 0 ? () => void handleRemoveHighlight() : undefined,
						() => plugin.openPluginSettings(),
					).open();
				});
		});

		// 3. Vincular recursos (opens modal with resource types)
		menu.addItem((item) => {
			item.setTitle(t("contextMenu.linkResource") || "Vincular recursos")
				.setIcon("link")
				.onClick(() => {
					if (!plugin) return;
					if (resourceTypes.length === 1) {
						handleLinkResource(resourceTypes[0].id);
					} else if (resourceTypes.length > 1) {
						new ResourceTypePickerModal(
							plugin.app,
							formattedRef,
							resourceTypes,
							(typeId) => handleLinkResource(typeId),
						).open();
					}
				});
		});

		// 4. Comparar versões
		menu.addItem((item) => {
			item.setTitle(t("contextMenu.compare") || "Comparar versões")
				.setIcon("columns")
				.onClick(() => {
					handleCompare();
				});
		});

		menu.showAtMouseEvent(event);
	}

	function handleCompare() {
		if (!plugin || !book) return;
		plugin.openCompareModal({
			bookId: book.id,
			chapter,
			verseNumbers: selectedVerseNumbers.length > 0 ? selectedVerseNumbers : [],
		});
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
									{justCapturedTextRange}
									{hoveredNotePath}
									highlights={verseHighlightsMap.get(verse.number) ?? []}
									laneSlots={verseLanesMap.get(verse.number) ?? []}
									totalLanes={noteLanesData.totalLanes}
									xrefRefs={verseXrefsMap.get(verse.number) ?? []}
									showXrefGutter={showThompsonXrefs}
									xrefGutterAlign="end"
									activeTextSelection={textRangeSelection?.verseNumber === verse.number ? textRangeSelection : null}
									onVerseClick={handleVerseClick}
									onToggleVerseSelection={handleToggleVerseSelection}
									onVerseTextClick={handleVerseTextClick}
									onOpenNote={handleOpenNote}
									onNoteLineHover={handleNoteLineHover}
									onNoteLineEnter={(path) => (hoveredNotePath = path)}
									onNoteLineLeave={() => (hoveredNotePath = null)}
									onNoteLineKeyDown={handleNoteLineKeyDown}
									onXrefSelect={(ref, ev) => onSelectCrossRef?.(verse.number, ref, ev)}
									onRemoveHighlight={handleRemoveHighlightByPath}
									resourceLinks={verseResourcesMap.get(verse.number) ?? []}
									{resourceTypes}
									autoResourceMatches={autoMatchesByVerse.get(verse.number) ?? []}
									{resourceDisplayStyle}
									{resourceColorize}
									onOpenResourceGroup={handleOpenResourceGroup}
									onUnlinkResource={handleUnlinkResource}
									onResourceHover={handleResourceHover}
								/>
							{/each}
						</div>
						<div class="open-bible-thompson-column open-bible-thompson-column-right">
							{#each thompsonColumns.right as verse (verse.number)}
								<VerseRow
									{verse}
									isSelected={selectedVerseNumbers.includes(verse.number)}
									{isSelectionMode}
									{justCapturedTextRange}
									{hoveredNotePath}
									highlights={verseHighlightsMap.get(verse.number) ?? []}
									laneSlots={verseLanesMap.get(verse.number) ?? []}
									totalLanes={noteLanesData.totalLanes}
									xrefRefs={verseXrefsMap.get(verse.number) ?? []}
									showXrefGutter={showThompsonXrefs}
									xrefGutterAlign="start"
									activeTextSelection={textRangeSelection?.verseNumber === verse.number ? textRangeSelection : null}
									onVerseClick={handleVerseClick}
									onToggleVerseSelection={handleToggleVerseSelection}
									onVerseTextClick={handleVerseTextClick}
									onOpenNote={handleOpenNote}
									onNoteLineHover={handleNoteLineHover}
									onNoteLineEnter={(path) => (hoveredNotePath = path)}
									onNoteLineLeave={() => (hoveredNotePath = null)}
									onNoteLineKeyDown={handleNoteLineKeyDown}
									onXrefSelect={(ref, ev) => onSelectCrossRef?.(verse.number, ref, ev)}
									onRemoveHighlight={handleRemoveHighlightByPath}
									resourceLinks={verseResourcesMap.get(verse.number) ?? []}
									{resourceTypes}
									autoResourceMatches={autoMatchesByVerse.get(verse.number) ?? []}
									{resourceDisplayStyle}
									{resourceColorize}
									onOpenResourceGroup={handleOpenResourceGroup}
									onUnlinkResource={handleUnlinkResource}
									onResourceHover={handleResourceHover}
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
								{justCapturedTextRange}
								{hoveredNotePath}
								highlights={verseHighlightsMap.get(verse.number) ?? []}
								laneSlots={verseLanesMap.get(verse.number) ?? []}
								totalLanes={noteLanesData.totalLanes}
								xrefRefs={verseXrefsMap.get(verse.number) ?? []}
								showXrefGutter={showThompsonXrefs}
								activeTextSelection={textRangeSelection?.verseNumber === verse.number ? textRangeSelection : null}
								onVerseClick={handleVerseClick}
								onToggleVerseSelection={handleToggleVerseSelection}
								onVerseTextClick={handleVerseTextClick}
								onOpenNote={handleOpenNote}
								onNoteLineHover={handleNoteLineHover}
								onNoteLineEnter={(path) => (hoveredNotePath = path)}
								onNoteLineLeave={() => (hoveredNotePath = null)}
								onNoteLineKeyDown={handleNoteLineKeyDown}
								onXrefSelect={(ref, ev) => onSelectCrossRef?.(verse.number, ref, ev)}
								onRemoveHighlight={handleRemoveHighlightByPath}
								resourceLinks={verseResourcesMap.get(verse.number) ?? []}
								{resourceTypes}
								autoResourceMatches={autoMatchesByVerse.get(verse.number) ?? []}
								{resourceDisplayStyle}
								{resourceColorize}
								onOpenResourceGroup={handleOpenResourceGroup}
								onUnlinkResource={handleUnlinkResource}
								onResourceHover={handleResourceHover}
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
			configuredResources={resourceTypes}
			{currentColor}
			onCopyReference={copyReference}
			onCopyText={copyText}
			onCreateNote={handleCreateNote}
			onHighlightColor={handleHighlightColor}
			onRemoveHighlight={handleRemoveHighlight}
			onLinkResource={handleLinkResource}
			onCompare={handleCompare}
			onOpenConfigureHighlights={() => plugin?.openPluginSettings()}
			onClose={clearSelection}
		/>
	{/if}
</div>
