<script lang="ts">
	import { onMount } from "svelte";
	import { Notice } from "obsidian";
	import { normalizeText } from "../../constants";
	import type { BibleDatabaseInfo, BibleBook, BibleVerse } from "../../models/bible";
	import type { BibleVersion } from "../../models/bibleVersion";
	import type { BibleTextService } from "../../services/bibleTextService";
	import type { BibleVersionService } from "../../services/bibleVersionService";
	import type { OpenBibleSettings, ReadingHistoryEntry, ReaderContainerWidth, ReaderSpacing } from "../../settings";
	import { t } from "../../i18n";
	import ReaderToolbar from "./components/ReaderToolbar.svelte";
	import VersesView from "./components/VersesView.svelte";
	import DrawerModal from "./components/DrawerModal.svelte";
	import BookPicker from "./components/BookPicker.svelte";
	import ChapterPicker from "./components/ChapterPicker.svelte";
	import VersionPicker from "./components/VersionPicker.svelte";
	import HistoryPicker from "./components/HistoryPicker.svelte";
	import AppearancePanel from "./components/AppearancePanel.svelte";
	import HighlightsPanel from "./components/HighlightsPanel.svelte";
	import ResourcesPanel from "./components/ResourcesPanel.svelte";
	import ResourceDetailPanel from "../resources/ResourceDetailPanel.svelte";
	import ResourceHomePanel from "../resources/ResourceHomePanel.svelte";
	import { ResourcePreviewModal } from "../modals/ResourcePreviewModal";
	import CrossRefBottomPanel from "./components/CrossRefBottomPanel.svelte";
	import Button from "../kit/Button.svelte";
	import EmptyState from "../kit/EmptyState.svelte";

	import type OpenBiblePlugin from "../../main";
	import type { BibleResourceItem, BibleResourceLink } from "../../models/resource";
	import type { CrossReference } from "../../data/crossRefModel";
	import { indexOfCrossRef } from "../../data/crossRefModel";
	import { openCrossRefPreview } from "../resources/openCrossRefPreview";
	import { formatCrossRefOrigin } from "../resources/formatCrossRef";
	import type { BibleReaderController, BibleReaderViewState, NavigationDirection } from "./types";

	type PickerMode = "book" | "chapter" | "version" | "history" | "appearance" | "highlights" | "resources" | null;

	interface Props {
		plugin?: OpenBiblePlugin;
		textService: BibleTextService;
		versionService: BibleVersionService;
		settings: OpenBibleSettings;
		initialViewState?: BibleReaderViewState;
		updateSettings: (patch: Partial<OpenBibleSettings>) => Promise<void>;
		onViewConfigChange?: (patch: Partial<BibleReaderViewState>) => void;
		openSettings: () => void;
		onPassageChange: (bookName: string, chapter: number | undefined) => void;
		registerController?: (controller: BibleReaderController) => void;
	}

	let {
		plugin,
		textService,
		versionService,
		settings,
		initialViewState,
		updateSettings,
		onViewConfigChange,
		openSettings,
		onPassageChange,
		registerController,
	}: Props = $props();

	let containerEl = $state<HTMLElement | undefined>();
	let scrollContainerEl = $state<HTMLElement | undefined>();
	let versions = $state<BibleVersion[]>([]);
	let currentInfo = $state<BibleDatabaseInfo | undefined>();
	let currentBookId = $state<number | undefined>();
	let currentChapter = $state<number | undefined>();
	let verses = $state<BibleVerse[]>([]);

	let isLoadingVersions = $state(true);
	let isLoadingVerses = $state(false);
	let verseError = $state<string | null>(null);

	let activePicker = $state<PickerMode>(null);
	let selectedBookForPicker = $state<BibleBook | undefined>();
	let currentRequestId = 0;

	// Local display states initialized per-view (isolated from other open reader views)
	function getInitialDisplayState() {
		return {
			twoColumns:
				initialViewState?.twoColumns !== undefined
					? initialViewState.twoColumns
					: Boolean(settings.readerTwoColumns ?? settings.twoColumnLayout),
			containerWidth:
				initialViewState?.containerWidth || settings.readerContainerWidth || ("default" as ReaderContainerWidth),
			verseSpacing:
				initialViewState?.verseSpacing || settings.readerVerseSpacing || ("normal" as ReaderSpacing),
			lineSpacing:
				initialViewState?.lineSpacing || settings.readerLineSpacing || ("normal" as ReaderSpacing),
			thompsonCrossRefsEnabled:
				initialViewState?.thompsonCrossRefsEnabled !== undefined
					? initialViewState.thompsonCrossRefsEnabled
					: Boolean(settings.thompsonCrossRefsEnabled),
			thompsonCrossRefsPosition:
				initialViewState?.thompsonCrossRefsPosition || settings.thompsonCrossRefsPosition || ("margin" as const),
			showCrossRefsBottomPanel:
				initialViewState?.showCrossRefsBottomPanel !== undefined
					? initialViewState.showCrossRefsBottomPanel
					: (settings.showCrossRefsBottomPanel ?? true),
			crossRefsBottomPanelFixed:
				initialViewState?.crossRefsBottomPanelFixed !== undefined
					? initialViewState.crossRefsBottomPanelFixed
					: Boolean(settings.crossRefsBottomPanelFixed),
			crossRefsBottomPanelColumns:
				initialViewState?.crossRefsBottomPanelColumns || settings.crossRefsBottomPanelColumns || (2 as const),
			crossRefsBottomPanelCollapsed:
				initialViewState?.crossRefsBottomPanelCollapsed !== undefined
					? initialViewState.crossRefsBottomPanelCollapsed
					: Boolean(settings.crossRefsBottomPanelCollapsed),
			secondaryPanelWidth:
				initialViewState?.secondaryPanelWidth || settings.readerSecondaryPanelWidth || 380,
			secondaryPanelOpen:
				initialViewState?.secondaryPanelOpen !== undefined
					? initialViewState.secondaryPanelOpen
					: false,
			secondaryPanelMode:
				initialViewState?.secondaryPanelMode ||
				(initialViewState?.secondaryPanelResourcePath ? "detail" : "home"),
			secondaryPanelResourcePath:
				initialViewState?.secondaryPanelResourcePath || "",
		};
	}

	const initial = getInitialDisplayState();
	let twoColumns = $state(initial.twoColumns);
	let containerWidth = $state<ReaderContainerWidth>(initial.containerWidth);
	let verseSpacing = $state<ReaderSpacing>(initial.verseSpacing);
	let lineSpacing = $state<ReaderSpacing>(initial.lineSpacing);
	let thompsonCrossRefsEnabled = $state(initial.thompsonCrossRefsEnabled);
	let thompsonCrossRefsPosition = $state<"margin" | "center">(initial.thompsonCrossRefsPosition);
	let showCrossRefsBottomPanel = $state(initial.showCrossRefsBottomPanel);
	let crossRefsBottomPanelFixed = $state(initial.crossRefsBottomPanelFixed);
	let crossRefsBottomPanelColumns = $state<1 | 2>(initial.crossRefsBottomPanelColumns);
	let crossRefsBottomPanelCollapsed = $state(initial.crossRefsBottomPanelCollapsed);
	let secondaryResource = $state<BibleResourceLink | null>(null);
	let secondaryPanelOpen = $state<boolean>(initial.secondaryPanelOpen);
	let secondaryPanelMode = $state<"detail" | "home">(initial.secondaryPanelMode);
	let secondaryPanelWidth = $state<number>(initial.secondaryPanelWidth);
	let isDraggingSplit = $state(false);
	let activeVerseNumber = $state<number | undefined>();
	let navigationDirection = $state<NavigationDirection>("jump");
	let isSelectionMode = $state(false);

	function toggleSelectionMode(): boolean {
		isSelectionMode = !isSelectionMode;
		return isSelectionMode;
	}

	export function syncSettings(): void {
		twoColumns = Boolean(settings.readerTwoColumns ?? settings.twoColumnLayout);
		containerWidth = settings.readerContainerWidth || "default";
		verseSpacing = settings.readerVerseSpacing || "normal";
		lineSpacing = settings.readerLineSpacing || "normal";
		thompsonCrossRefsEnabled = Boolean(settings.thompsonCrossRefsEnabled);
		thompsonCrossRefsPosition = settings.thompsonCrossRefsPosition || "margin";
		showCrossRefsBottomPanel = settings.showCrossRefsBottomPanel ?? true;
		crossRefsBottomPanelFixed = Boolean(settings.crossRefsBottomPanelFixed);
		crossRefsBottomPanelColumns = settings.crossRefsBottomPanelColumns || 2;
		crossRefsBottomPanelCollapsed = Boolean(settings.crossRefsBottomPanelCollapsed);
		if (settings.readerSecondaryPanelWidth && !initialViewState?.secondaryPanelWidth) {
			secondaryPanelWidth = settings.readerSecondaryPanelWidth;
		}
	}

	let currentBook = $derived(
		currentInfo?.books.find((b) => b.id === currentBookId)
	);

	let currentBookName = $derived(currentBook?.name ?? "");

	let bookIndex = $derived(
		currentInfo && currentBookId !== undefined
			? currentInfo.books.findIndex((b) => b.id === currentBookId)
			: -1
	);

	let chapterIndex = $derived(
		currentBook && currentChapter !== undefined
			? currentBook.chapters.indexOf(currentChapter)
			: -1
	);

	let canNavigatePrevious = $derived(
		Boolean(
			currentInfo &&
				currentBook &&
				currentChapter !== undefined &&
				!(bookIndex <= 0 && chapterIndex <= 0)
		)
	);

	let canNavigateNext = $derived(
		Boolean(
			currentInfo &&
				currentBook &&
				currentChapter !== undefined &&
				!(
					bookIndex >= currentInfo.books.length - 1 &&
					chapterIndex >= currentBook.chapters.length - 1
				)
		)
	);

	async function recordReadingHistory(
		bookId: number,
		bookName: string,
		chapter: number,
		versionAbbr: string,
		versionPath?: string,
	): Promise<void> {
		if (!settings.readingHistory) {
			settings.readingHistory = [];
		}

		const history = settings.readingHistory;
		const latest = history[0];
		if (
			latest &&
			latest.bookId === bookId &&
			latest.chapter === chapter &&
			latest.versionAbbr === versionAbbr
		) {
			latest.timestamp = Date.now();
			await updateSettings({ readingHistory: [...history] });
			return;
		}

		const filtered = history.filter(
			(h) => !(h.bookId === bookId && h.chapter === chapter && h.versionAbbr === versionAbbr)
		);

		const newEntry: ReadingHistoryEntry = {
			id: `${bookId}-${chapter}-${versionAbbr}-${Date.now()}`,
			bookId,
			bookName,
			chapter,
			versionAbbr,
			versionPath,
			timestamp: Date.now(),
		};

		const updated = [newEntry, ...filtered].slice(0, 50);
		await updateSettings({ readingHistory: updated });
	}

	async function initDatabases(): Promise<void> {
		isLoadingVersions = true;
		try {
			versions = await versionService.listVersions();
			if (versions.length > 0) {
				let targetPath = versions[0].filePath;
				let initialBookId: number | undefined;
				let initialChapter: number | undefined;

				if (initialViewState?.versionPath) {
					const found = versions.find((v) => v.filePath === initialViewState.versionPath);
					if (found) {
						targetPath = found.filePath;
						if (initialViewState.bookId) initialBookId = initialViewState.bookId;
						if (initialViewState.chapter) initialChapter = initialViewState.chapter;
					}
				} else if (settings.rememberLastReadPassage && settings.lastReadVersionPath) {
					const found = versions.find((v) => v.filePath === settings.lastReadVersionPath);
					if (found) {
						targetPath = found.filePath;
						if (settings.lastReadBookId > 0) initialBookId = settings.lastReadBookId;
						if (settings.lastReadChapter > 0) initialChapter = settings.lastReadChapter;
					}
				} else if (settings.defaultVersionPath) {
					const found = versions.find(
						(v) =>
							v.filePath === settings.defaultVersionPath ||
							v.filePath.endsWith(`/${settings.defaultVersionPath}`)
					);
					if (found) {
						targetPath = found.filePath;
					}
				}

				await selectDatabase(targetPath, initialBookId, initialChapter);
			}
		} finally {
			isLoadingVersions = false;
		}
	}

	export async function selectDatabase(
		filePath: string,
		initialBookId?: number,
		initialChapter?: number,
	): Promise<void> {
		const previousBook = currentInfo?.books.find((b) => b.id === currentBookId);
		const previousBookName = previousBook?.name;
		const previousChapter = currentChapter;

		try {
			const info = await textService.inspectVersion(filePath);
			currentInfo = info;

			const versionItem = versions.find((v) => v.filePath === filePath);
			if (versionItem) {
				versionItem.name = info.name;
				versionItem.abbreviation = info.abbreviation;
			}

			if (info.books.length === 0) {
				verseError = t("reader.noBooksError");
				verses = [];
				return;
			}

			let bookToSelect = info.books[0];
			if (initialBookId !== undefined) {
				const match = info.books.find((b) => b.id === initialBookId);
				if (match) bookToSelect = match;
			} else if (previousBookName) {
				const match = info.books.find(
					(b) =>
						normalizeText(b.name) === normalizeText(previousBookName) ||
						b.id === previousBook?.id
				);
				if (match) bookToSelect = match;
			}

			currentBookId = bookToSelect.id;
			let chapterToSelect = bookToSelect.chapters[0];
			if (initialChapter !== undefined && bookToSelect.chapters.includes(initialChapter)) {
				chapterToSelect = initialChapter;
			} else if (previousChapter && bookToSelect.chapters.includes(previousChapter)) {
				chapterToSelect = previousChapter;
			}
			currentChapter = chapterToSelect;

			await loadChapter(bookToSelect.id, chapterToSelect);
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			verseError = t("reader.openVersionFailedPrefix", { message });
		}
	}

	async function loadChapter(bookId: number, chapter: number): Promise<void> {
		if (!currentInfo) return;
		const requestId = ++currentRequestId;
		isLoadingVerses = true;
		verseError = null;

		try {
			const loadedVerses = await textService.readChapter(currentInfo.path, bookId, chapter);
			if (requestId !== currentRequestId) return;
			verses = loadedVerses;

			if (scrollContainerEl) {
				scrollContainerEl.scrollTo({ top: 0, behavior: "auto" });
			} else if (containerEl) {
				containerEl.scrollTo({ top: 0, behavior: "auto" });
			}

			const bookObj = currentInfo.books.find((b) => b.id === bookId);
			const bookName = bookObj?.name ?? "";

			onPassageChange(bookName, chapter);
			onViewConfigChange?.({
				bookId,
				chapter,
				versionPath: currentInfo.path,
			});

			await updateSettings({
				lastReadVersionPath: currentInfo.path,
				lastReadVersionAbbr: currentInfo.abbreviation,
				lastReadBookId: bookId,
				lastReadChapter: chapter,
			});

			void recordReadingHistory(
				bookId,
				bookName,
				chapter,
				currentInfo.abbreviation,
				currentInfo.path
			);
		} catch (error) {
			if (requestId !== currentRequestId) return;
			const message = error instanceof Error ? error.message : String(error);
			verseError = t("reader.readChapterFailedPrefix", { message });
		} finally {
			if (requestId === currentRequestId) {
				isLoadingVerses = false;
			}
		}
	}

	function navigateChapter(direction: -1 | 1): void {
		if (!currentInfo || currentBookId === undefined || currentChapter === undefined) return;
		if (bookIndex < 0 || !currentBook) return;

		let targetBookIndex = bookIndex;
		let targetChapterIndex = chapterIndex + direction;

		if (targetChapterIndex < 0 && bookIndex > 0) {
			targetBookIndex -= 1;
			targetChapterIndex = currentInfo.books[targetBookIndex].chapters.length - 1;
		} else if (
			targetChapterIndex >= currentBook.chapters.length &&
			bookIndex < currentInfo.books.length - 1
		) {
			targetBookIndex += 1;
			targetChapterIndex = 0;
		}

		const targetBook = currentInfo.books[targetBookIndex];
		const targetChapter = targetBook?.chapters[targetChapterIndex];
		if (!targetBook || targetChapter === undefined) return;

		navigationDirection = direction === 1 ? "next" : "prev";
		currentBookId = targetBook.id;
		currentChapter = targetChapter;
		void loadChapter(targetBook.id, targetChapter);
	}

	function togglePicker(picker: Exclude<PickerMode, null>): void {
		if (activePicker === picker) {
			closePicker();
		} else {
			openPicker(picker);
		}
	}

	function openPicker(picker: Exclude<PickerMode, null>): void {
		activePicker = picker;
		if (picker === "chapter") {
			selectedBookForPicker = currentBook ?? currentInfo?.books[0];
		}
	}

	function closePicker(): void {
		activePicker = null;
	}

	function handleSelectBook(book: BibleBook): void {
		selectedBookForPicker = book;
		activePicker = "chapter";
	}

	function handleSelectChapter(chapter: number): void {
		if (selectedBookForPicker) {
			currentBookId = selectedBookForPicker.id;
		}
		navigationDirection = "jump";
		currentChapter = chapter;
		closePicker();
		if (currentBookId !== undefined) {
			void loadChapter(currentBookId, chapter);
		}
	}

	function toggleTwoColumns(): void {
		twoColumns = !twoColumns;
		onViewConfigChange?.({ twoColumns });
	}

	function toggleThompson(): void {
		thompsonCrossRefsEnabled = !thompsonCrossRefsEnabled;
		if (thompsonCrossRefsEnabled && plugin?.crossReferenceService && !plugin.crossReferenceService.isReady()) {
			void plugin.crossReferenceService.load();
		}
		onViewConfigChange?.({ thompsonCrossRefsEnabled });
	}

	async function handleSelectCrossRef(verseNumber: number, ref: CrossReference, _event: MouseEvent): Promise<void> {
		if (!plugin?.crossReferenceService || !currentBook) return;
		const chainRefs = plugin.crossReferenceService.getRefsForVerse(currentBook.id, currentChapter ?? 1, verseNumber);
		const chainIndex = indexOfCrossRef(chainRefs, ref);
		const openedRef = chainIndex >= 0 ? chainRefs[chainIndex]! : ref;

		await openCrossRefPreview(plugin.app, plugin, openedRef, {
			originLabel: formatCrossRefOrigin(openedRef),
			chainRefs,
			chainIndex: chainIndex >= 0 ? chainIndex : 0,
		});
	}

	function toggleBottomPanel(): void {
		showCrossRefsBottomPanel = !showCrossRefsBottomPanel;
		if (showCrossRefsBottomPanel && plugin?.crossReferenceService && !plugin.crossReferenceService.isReady()) {
			void plugin.crossReferenceService.load();
		}
		onViewConfigChange?.({ showCrossRefsBottomPanel });
	}

	function toggleBottomPanelFixed(): void {
		crossRefsBottomPanelFixed = !crossRefsBottomPanelFixed;
		onViewConfigChange?.({ crossRefsBottomPanelFixed });
	}

	function toggleBottomPanelCollapsed(): void {
		crossRefsBottomPanelCollapsed = !crossRefsBottomPanelCollapsed;
		onViewConfigChange?.({ crossRefsBottomPanelCollapsed });
	}

	function toggleBottomPanelColumns(): void {
		crossRefsBottomPanelColumns = crossRefsBottomPanelColumns === 2 ? 1 : 2;
		onViewConfigChange?.({ crossRefsBottomPanelColumns });
	}

	function scrollToVerse(verseNumber: number): void {
		activeVerseNumber = verseNumber;
		const verseEl = (scrollContainerEl || containerEl)?.querySelector<HTMLElement>(
			`.open-bible-reader-verse[data-verse="${verseNumber}"]`
		);
		if (verseEl) {
			verseEl.scrollIntoView({ behavior: "smooth", block: "center" });
			verseEl.classList.add("is-flashing");
			setTimeout(() => {
				verseEl.classList.remove("is-flashing");
			}, 2000);
		}
	}

	function handleAppearanceChange(patch: {
		readerContainerWidth?: ReaderContainerWidth;
		readerVerseSpacing?: ReaderSpacing;
		readerLineSpacing?: ReaderSpacing;
		thompsonCrossRefsPosition?: "margin" | "center";
		showCrossRefsBottomPanel?: boolean;
		crossRefsBottomPanelFixed?: boolean;
		crossRefsBottomPanelColumns?: 1 | 2;
		twoColumns?: boolean;
	}): void {
		if (patch.readerContainerWidth !== undefined) containerWidth = patch.readerContainerWidth;
		if (patch.readerVerseSpacing !== undefined) verseSpacing = patch.readerVerseSpacing;
		if (patch.readerLineSpacing !== undefined) lineSpacing = patch.readerLineSpacing;
		if (patch.thompsonCrossRefsPosition !== undefined) thompsonCrossRefsPosition = patch.thompsonCrossRefsPosition;
		if (patch.showCrossRefsBottomPanel !== undefined) showCrossRefsBottomPanel = patch.showCrossRefsBottomPanel;
		if (patch.crossRefsBottomPanelFixed !== undefined) crossRefsBottomPanelFixed = patch.crossRefsBottomPanelFixed;
		if (patch.crossRefsBottomPanelColumns !== undefined) crossRefsBottomPanelColumns = patch.crossRefsBottomPanelColumns;
		if (patch.twoColumns !== undefined) twoColumns = patch.twoColumns;
		onViewConfigChange?.({
			twoColumns,
			containerWidth,
			verseSpacing,
			lineSpacing,
			thompsonCrossRefsPosition,
			showCrossRefsBottomPanel,
			crossRefsBottomPanelFixed,
			crossRefsBottomPanelColumns,
		});
	}

	function handleOpenResource(link: BibleResourceLink): void {
		plugin?.updateResourceDetailViews(link);

		const mode = settings.resourceOpenMode ?? "reader";
		if (mode === "reader") {
			secondaryResource = link;
			secondaryPanelMode = "detail";
			secondaryPanelOpen = true;
			onViewConfigChange?.({
				secondaryPanelOpen: true,
				secondaryPanelMode: "detail",
				secondaryPanelResourcePath: link.resourcePath,
				secondaryPanelWidth,
			});
		} else if (mode === "workspace") {
			void plugin?.openResourceDetailView(link);
		} else {
			if (!plugin) return;
			new ResourcePreviewModal(
				plugin.app,
				plugin,
				link,
				(bookName, ch, vNum, vAbbr) => {
					void navigateTo(bookName, ch, vNum, vAbbr);
				},
				(linkPath) => {
					void plugin?.resourceService.removeLink(linkPath).then(() => {
						new Notice(t("notices.resourceLinkRemoved") || "Vínculo removido.");
					});
				},
			).open();
		}
	}

	function openSecondaryHub(): void {
		const mode = settings.resourceOpenMode ?? "reader";
		if (mode === "workspace") {
			void plugin?.openResourceHubView();
		} else {
			secondaryPanelMode = "home";
			secondaryPanelOpen = true;
			onViewConfigChange?.({
				secondaryPanelOpen: true,
				secondaryPanelMode: "home",
				secondaryPanelResourcePath: secondaryResource?.resourcePath,
				secondaryPanelWidth,
			});
		}
	}

	function handleSelectResourceFromHub(item: BibleResourceItem): void {
		const links = plugin?.resourceService?.getLinksForResource(item.path) ?? [];
		const targetLink: BibleResourceLink = links.length > 0 ? links[0] : {
			path: "",
			resourceType: item.resourceType,
			resourcePath: item.path,
			resourceName: item.name || item.title,
			book: "",
			chapter: 1,
			verses: [],
			versesStr: "",
			color: "blue",
			reference: "",
		};
		secondaryResource = targetLink;
		secondaryPanelMode = "detail";
		secondaryPanelOpen = true;
		onViewConfigChange?.({
			secondaryPanelOpen: true,
			secondaryPanelMode: "detail",
			secondaryPanelResourcePath: item.path,
			secondaryPanelWidth,
		});
	}

	function handleBackToHub(): void {
		secondaryPanelMode = "home";
		onViewConfigChange?.({
			secondaryPanelOpen: true,
			secondaryPanelMode: "home",
		});
	}

	function closeSecondaryPanel(): void {
		secondaryPanelOpen = false;
		secondaryResource = null;
		onViewConfigChange?.({
			secondaryPanelOpen: false,
			secondaryPanelResourcePath: undefined,
		});
	}

	function startResizing(e: MouseEvent) {
		e.preventDefault();
		isDraggingSplit = true;
		const startX = e.clientX;
		const startWidth = secondaryPanelWidth;

		function onMouseMove(moveEvent: MouseEvent) {
			const delta = startX - moveEvent.clientX;
			const maxAllowed = containerEl ? Math.floor(containerEl.clientWidth * 0.65) : 650;
			const newWidth = Math.max(260, Math.min(maxAllowed, startWidth + delta));
			secondaryPanelWidth = newWidth;
		}

		function onMouseUp() {
			isDraggingSplit = false;
			window.removeEventListener("mousemove", onMouseMove);
			window.removeEventListener("mouseup", onMouseUp);
			onViewConfigChange?.({ secondaryPanelWidth });
		}

		window.addEventListener("mousemove", onMouseMove);
		window.addEventListener("mouseup", onMouseUp);
	}

	function resetResizing() {
		secondaryPanelWidth = 380;
		onViewConfigChange?.({ secondaryPanelWidth: 380 });
	}

	function restoreSecondaryResourceIfSaved() {
		if (initialViewState?.secondaryPanelOpen && plugin) {
			secondaryPanelOpen = true;
			secondaryPanelMode = initialViewState.secondaryPanelMode || (initialViewState.secondaryPanelResourcePath ? "detail" : "home");
			if (initialViewState.secondaryPanelResourcePath) {
				const path = initialViewState.secondaryPanelResourcePath;
				const links = plugin.resourceService.getLinksForResource(path);
				if (links.length > 0) {
					secondaryResource = links[0];
				} else {
					const file = plugin.app.vault.getAbstractFileByPath(path);
					const baseName = file ? file.name.replace(/\.md$/i, "") : path.split("/").pop()?.replace(/\.md$/i, "") || path;
					secondaryResource = {
						path: "",
						resourceType: "custom",
						resourcePath: path,
						resourceName: baseName,
						book: "",
						chapter: 1,
						verses: [],
						versesStr: "",
						color: "blue",
						reference: "",
					};
				}
			}
		}
	}

	export async function navigateTo(
		bookIdOrName: number | string,
		chapter: number,
		verseNumber?: number,
		versionAbbr?: string,
	): Promise<boolean> {
		if (versionAbbr && currentInfo?.abbreviation.toUpperCase() !== versionAbbr.toUpperCase()) {
			const targetVersion = versions.find(
				(v) => v.abbreviation.toUpperCase() === versionAbbr.toUpperCase()
			);
			if (targetVersion) {
				await selectDatabase(targetVersion.filePath);
			}
		}

		if (!currentInfo) return false;
		const targetBook =
			typeof bookIdOrName === "number"
				? currentInfo.books.find((b) => b.id === bookIdOrName)
				: currentInfo.books.find(
						(b) =>
							normalizeText(b.name) === normalizeText(bookIdOrName) ||
							b.name.toLowerCase() === bookIdOrName.toLowerCase()
				  );
		if (!targetBook) return false;

		navigationDirection = "jump";
		currentBookId = targetBook.id;
		currentChapter = chapter;
		await loadChapter(targetBook.id, chapter);

		if (verseNumber !== undefined) {
			setTimeout(() => {
				const verseEl = (scrollContainerEl || containerEl)?.querySelector<HTMLElement>(
					`.open-bible-reader-verse[data-verse="${verseNumber}"]`
				);
				if (verseEl) {
					verseEl.scrollIntoView({ behavior: "smooth", block: "center" });
					verseEl.classList.add("is-flashing");
					setTimeout(() => {
						verseEl.classList.remove("is-flashing");
					}, 2000);
				}
			}, 150);
		}
		return true;
	}

	onMount(() => {
		void initDatabases();
		restoreSecondaryResourceIfSaved();
		registerController?.({
			navigateToPassage: async (
				bookId: number | string,
				chapter: number,
				verseNumber?: number,
				versionAbbr?: string,
			) => {
				return await navigateTo(bookId, chapter, verseNumber, versionAbbr);
			},
			openHistory: () => openPicker("history"),
			openBookPicker: () => openPicker("book"),
			openVersionPicker: () => openPicker("version"),
			openAppearancePicker: () => openPicker("appearance"),
			openHighlights: () => openPicker("highlights"),
			openResources: () => openPicker("resources"),
			openResourceHub: () => openSecondaryHub(),
			openSecondaryPanel: (l: BibleResourceLink) => handleOpenResource(l),
			closeSecondaryPanel: () => closeSecondaryPanel(),
			isSecondaryPanelOpen: () => secondaryPanelOpen,
			toggleSelectionMode: () => toggleSelectionMode(),
			isSelectionMode: () => isSelectionMode,
			refreshSettings: () => syncSettings(),
			getViewState: () => ({
				bookId: currentBookId,
				chapter: currentChapter,
				versionPath: currentInfo?.path,
				twoColumns,
				containerWidth,
				verseSpacing,
				lineSpacing,
				thompsonCrossRefsEnabled,
				thompsonCrossRefsPosition,
				showCrossRefsBottomPanel,
				crossRefsBottomPanelFixed,
				crossRefsBottomPanelColumns,
				crossRefsBottomPanelCollapsed,
				secondaryPanelOpen,
				secondaryPanelMode,
				secondaryPanelResourcePath: secondaryResource?.resourcePath,
				secondaryPanelWidth,
			}),
			toggleTwoColumns: () => toggleTwoColumns(),
			toggleThompson: () => toggleThompson(),
			toggleBottomPanel: () => toggleBottomPanel(),
			toggleBottomPanelFixed: () => toggleBottomPanelFixed(),
		});
	});
</script>

<div
	bind:this={containerEl}
	class="open-bible-reader"
	class:has-active-picker={activePicker !== null}
	class:has-secondary-panel={secondaryPanelOpen && (secondaryPanelMode === "home" || secondaryResource !== null)}
>
	{#if isLoadingVersions}
		<div class="open-bible-reader-loading">
			<span class="open-bible-reader-spinner"></span>
			<span class="open-bible-reader-loading-text">{t("reader.loading")}</span>
		</div>
	{:else if versions.length === 0}
		<EmptyState
			iconName="book-open"
			title={t("reader.emptyTitle")}
			description={t("reader.emptyDesc")}
		>
			<Button variant="cta" onclick={openSettings}>
				{t("reader.openSettings")}
			</Button>
		</EmptyState>
	{:else}
		<div class="open-bible-reader-body">
			<div class="open-bible-reader-main">
				<div class="open-bible-reader-scrollable" bind:this={scrollContainerEl}>
					<ReaderToolbar
						{currentInfo}
						{currentBookName}
						{currentChapter}
						{activePicker}
						{canNavigatePrevious}
						{canNavigateNext}
						{isSelectionMode}
						onToggleSelectionMode={toggleSelectionMode}
						onOpenResourceHub={openSecondaryHub}
						onNavigate={navigateChapter}
						onTogglePicker={togglePicker}
					/>

					<VersesView
						book={currentBook}
						chapter={currentChapter}
						{verses}
						{navigationDirection}
						isLoading={isLoadingVerses}
						error={verseError}
						isTwoColumns={twoColumns}
						{containerWidth}
						{verseSpacing}
						{lineSpacing}
						{thompsonCrossRefsEnabled}
						{thompsonCrossRefsPosition}
						crossReferenceService={plugin?.crossReferenceService}
						{plugin}
						versionAbbr={currentInfo?.abbreviation ?? ""}
						selectedVerseNumber={activeVerseNumber}
						{isSelectionMode}
						{canNavigatePrevious}
						{canNavigateNext}
						onNavigateChapter={navigateChapter}
						onRetry={() => {
							if (currentBookId !== undefined && currentChapter !== undefined) {
								void loadChapter(currentBookId, currentChapter);
							}
						}}
						onToggleTwoColumns={() => void toggleTwoColumns()}
						onSelectCrossRef={handleSelectCrossRef}
						onSelectVerse={(v) => (activeVerseNumber = v)}
						onOpenResource={handleOpenResource}
					/>

					{#if showCrossRefsBottomPanel && !crossRefsBottomPanelFixed && plugin && currentBookId !== undefined && currentChapter !== undefined}
						<CrossRefBottomPanel
							{plugin}
							bookId={currentBookId}
							bookName={currentBookName}
							chapter={currentChapter}
							{containerWidth}
							selectedVerseNumber={activeVerseNumber}
							isFixed={false}
							isExpanded={!crossRefsBottomPanelCollapsed}
							columns={crossRefsBottomPanelColumns}
							onToggleFixed={() => void toggleBottomPanelFixed()}
							onToggleExpanded={() => void toggleBottomPanelCollapsed()}
							onToggleColumns={() => void toggleBottomPanelColumns()}
							onScrollToVerse={scrollToVerse}
						/>
					{/if}
				</div>

				{#if showCrossRefsBottomPanel && crossRefsBottomPanelFixed && plugin && currentBookId !== undefined && currentChapter !== undefined}
					<CrossRefBottomPanel
						{plugin}
						bookId={currentBookId}
						bookName={currentBookName}
						chapter={currentChapter}
						{containerWidth}
						selectedVerseNumber={activeVerseNumber}
						isFixed={true}
						isExpanded={!crossRefsBottomPanelCollapsed}
						columns={crossRefsBottomPanelColumns}
						onToggleFixed={() => void toggleBottomPanelFixed()}
						onToggleExpanded={() => void toggleBottomPanelCollapsed()}
						onToggleColumns={() => void toggleBottomPanelColumns()}
						onScrollToVerse={scrollToVerse}
					/>
				{/if}
			</div>

			{#if secondaryPanelOpen && (secondaryPanelMode === "home" || secondaryResource)}
				<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
				<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
				<div
					class="open-bible-split-resizer"
					class:is-dragging={isDraggingSplit}
					role="separator"
					tabindex="0"
					aria-orientation="vertical"
					aria-valuenow={secondaryPanelWidth}
					aria-valuemin={260}
					aria-valuemax={650}
					aria-label={t("resources.resizeSecondaryPanel") || "Redimensionar painel secundário"}
					onmousedown={startResizing}
					ondblclick={resetResizing}
				>
					<div class="open-bible-split-resizer-handle"></div>
				</div>

				<div
					class="open-bible-reader-secondary-container"
					style:width="{secondaryPanelWidth}px"
				>
					{#if secondaryPanelMode === "home" && plugin}
						<ResourceHomePanel
							{plugin}
							embedded={true}
							currentResourcePath={secondaryResource?.path}
							onSelectResource={handleSelectResourceFromHub}
							onClose={closeSecondaryPanel}
							onOpenInWorkspace={() => {
								if (plugin) {
									void plugin.openResourceHubView();
								}
							}}
							onNavigateToPassage={(bName, ch, vNum, vAbbr) => {
								void navigateTo(bName, ch, vNum, vAbbr);
							}}
						/>
					{:else if secondaryResource}
						<ResourceDetailPanel
							{plugin}
							link={secondaryResource}
							embedded={true}
							onNavigate={(bName, ch, vNum, vAbbr) => {
								void navigateTo(bName, ch, vNum, vAbbr);
							}}
							onClose={closeSecondaryPanel}
							onBackToHub={handleBackToHub}
							onOpenInWorkspace={() => {
								if (plugin && secondaryResource) {
									void plugin.openResourceDetailView(secondaryResource);
								}
							}}
							onUnlink={(linkPath) => {
								if (plugin) {
									void plugin.resourceService.removeLink(linkPath).then(() => {
										new Notice(t("notices.resourceLinkRemoved") || "Vínculo removido.");
										closeSecondaryPanel();
									});
								}
							}}
						/>
					{/if}
				</div>
			{/if}
		</div>

		<!-- Pickers / Drawers -->
		{#if activePicker === "book" && currentInfo}
			<DrawerModal mode="book" onClose={closePicker}>
				<BookPicker
					books={currentInfo.books}
					{currentBookId}
					onSelectBook={handleSelectBook}
					onNavigateToChapter={(bookId, chapter) => {
						navigationDirection = "jump";
						currentBookId = bookId;
						currentChapter = chapter;
						closePicker();
						void loadChapter(bookId, chapter);
					}}
					onClose={closePicker}
				/>
			</DrawerModal>
		{:else if activePicker === "chapter" && currentInfo}
			{@const pickerBook = selectedBookForPicker ?? currentBook ?? currentInfo.books[0]}
			{#if pickerBook}
				<DrawerModal mode="chapter" onClose={closePicker}>
					<ChapterPicker
						book={pickerBook}
						{currentBookId}
						{currentChapter}
						onBack={() => (activePicker = "book")}
						onSelectChapter={handleSelectChapter}
						onClose={closePicker}
					/>
				</DrawerModal>
			{/if}
		{:else if activePicker === "version" && currentInfo}
			<DrawerModal mode="version" onClose={closePicker}>
				<VersionPicker
					{versions}
					currentDatabasePath={currentInfo.path}
					currentAbbr={currentInfo.abbreviation}
					onSelectDatabase={(path) => void selectDatabase(path)}
					onClose={closePicker}
				/>
			</DrawerModal>
		{:else if activePicker === "history"}
			<DrawerModal mode="history" onClose={closePicker}>
				<HistoryPicker
					history={settings.readingHistory || []}
					onSelect={(entry) => {
						void navigateTo(entry.bookId, entry.chapter, 1, entry.versionAbbr);
					}}
					onClear={async () => {
						settings.readingHistory = [];
						await updateSettings({ readingHistory: [] });
					}}
					onClose={closePicker}
				/>
			</DrawerModal>
		{:else if activePicker === "appearance"}
			<DrawerModal mode="appearance" onClose={closePicker}>
				<AppearancePanel
					{twoColumns}
					{containerWidth}
					{verseSpacing}
					{lineSpacing}
					thompsonEnabled={thompsonCrossRefsEnabled}
					thompsonPosition={thompsonCrossRefsPosition}
					bottomPanelEnabled={showCrossRefsBottomPanel}
					bottomPanelFixed={crossRefsBottomPanelFixed}
					bottomPanelColumns={crossRefsBottomPanelColumns}
					onToggleTwoColumns={() => void toggleTwoColumns()}
					onToggleThompson={() => void toggleThompson()}
					onToggleBottomPanel={() => void toggleBottomPanel()}
					onToggleBottomPanelFixed={() => void toggleBottomPanelFixed()}
					onChange={(patch) => void handleAppearanceChange(patch)}
					onClose={closePicker}
				/>
			</DrawerModal>
		{:else if activePicker === "highlights" && plugin}
			<DrawerModal mode="highlights" onClose={closePicker}>
				<HighlightsPanel
					{plugin}
					onNavigate={(bName, ch, vNum, vAbbr) => {
						void navigateTo(bName, ch, vNum, vAbbr);
					}}
					onClose={closePicker}
				/>
			</DrawerModal>
		{:else if activePicker === "resources" && plugin}
			<DrawerModal mode="highlights" onClose={closePicker}>
				<ResourcesPanel
					{plugin}
					onNavigate={(bName, ch, vNum, vAbbr) => {
						void navigateTo(bName, ch, vNum, vAbbr);
					}}
					onClose={closePicker}
				/>
			</DrawerModal>
		{/if}
	{/if}
</div>
