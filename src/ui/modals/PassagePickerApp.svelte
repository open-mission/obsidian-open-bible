<script lang="ts">
	import { onMount } from "svelte";
	import { Platform } from "obsidian";
	import { icon } from "../actions/icon";
	import { t } from "../../i18n";
	import type OpenBiblePlugin from "../../main";
	import type { BibleBook, BibleVerse } from "../../models/bible";
	import type { HighlightConfig } from "../../settings";
	import { matchesBookSearch } from "../../constants";
	import { parseSingleReference, type ParsedVerseReference } from "../../services/VerseReferenceParser";
	import { formatReference, formatVerseRange, formatVersesText } from "../../services/verseFormat";
	import EmptyState from "../kit/EmptyState.svelte";

	type Step = "books" | "chapters" | "verses";
	type BookTab = "all" | "ot" | "nt";

	interface Props {
		plugin: OpenBiblePlugin;
		mode: "insert" | "createNote";
		onComplete: (data: {
			book: BibleBook;
			chapter: number;
			verses: BibleVerse[];
			versionAbbr: string;
			color?: string;
			label?: string;
		}) => void;
		onClose: () => void;
	}

	let { plugin, mode, onComplete, onClose }: Props = $props();

	// State
	let searchQuery = $state("");
	let searchInputEl = $state<HTMLInputElement | undefined>();
	let step = $state<Step>("books");
	let bookTab = $state<BookTab>("all");

	let availableBooks = $state<BibleBook[]>([]);
	let activeDbPath = $state<string>("");
	let activeDbAbbr = $state<string>("");
	let loadingInit = $state(true);

	// Navigation selection
	let selectedBook = $state<BibleBook | null>(null);
	let selectedChapter = $state<number | null>(null);
	let chapterVerses = $state<BibleVerse[]>([]);
	let loadingVerses = $state(false);

	// Selected verse numbers for step 3
	let selectedVerseNumbers = $state<number[]>([]);

	// Note category / color selection
	let configuredNotes = $derived(
		(plugin.settings.configuredNotes && plugin.settings.configuredNotes.length > 0)
			? plugin.settings.configuredNotes
			: (plugin.settings.configuredHighlights || [])
	);
	let selectedCategory = $state<HighlightConfig | null>(null);

	// Direct parsed reference from search input
	let parsedRef = $derived.by(() => {
		const q = searchQuery.trim();
		if (!q) return null;
		return parseSingleReference(q);
	});

	let matchedRefBook = $derived.by(() => {
		if (!parsedRef) return null;
		return availableBooks.find((b) => b.id === parsedRef.canonicalBookId) ?? null;
	});

	let searchRefPreview = $state<{
		book: BibleBook;
		chapter: number;
		verses: BibleVerse[];
		versionAbbr: string;
	} | null>(null);
	let loadingSearchPreview = $state(false);

	// Filtered books for Step 1
	let otCount = $derived(availableBooks.filter((b) => b.testament === 1).length);
	let ntCount = $derived(availableBooks.filter((b) => b.testament === 2).length);

	let filteredBooks = $derived.by(() => {
		let list = availableBooks;
		if (bookTab === "ot") {
			list = list.filter((b) => b.testament === 1);
		} else if (bookTab === "nt") {
			list = list.filter((b) => b.testament === 2);
		}

		const query = searchQuery.trim();
		if (query) {
			const matched = matchedRefBook;
			const textFiltered = list.filter((b) => matchesBookSearch(b.name, query));
			if (matched && !textFiltered.some((b) => b.id === matched.id)) {
				const belongsToTab =
					bookTab === "all" ||
					(bookTab === "ot" && matched.testament === 1) ||
					(bookTab === "nt" && matched.testament === 2);
				if (belongsToTab) {
					list = [matched, ...textFiltered];
				} else {
					list = textFiltered;
				}
			} else {
				list = textFiltered;
			}
		}
		return list;
	});

	onMount(() => {
		selectedCategory = configuredNotes[0] ?? null;
		void initDatabase();
		if (!Platform.isMobile) {
			setTimeout(() => {
				searchInputEl?.focus();
			}, 50);
		}
	});

	async function initDatabase(): Promise<void> {
		loadingInit = true;
		try {
			const dbInfo = await plugin.versePreviewService.resolveDatabase();
			if (dbInfo) {
				activeDbPath = dbInfo.path;
				activeDbAbbr = dbInfo.abbreviation;
				const inspected = await plugin.bibleText.inspectVersion(dbInfo.path);
				availableBooks = inspected.books;
			}
		} catch (error) {
			console.error("OpenBible: error initializing passage picker", error);
		} finally {
			loadingInit = false;
		}
	}

	// Watch parsedRef changes to load search preview
	$effect(() => {
		const ref = parsedRef;
		const book = matchedRefBook;
		if (ref && book && ref.chapter) {
			void loadSearchPreview(ref, book);
		} else {
			searchRefPreview = null;
		}
	});

	async function loadSearchPreview(ref: ParsedVerseReference, book: BibleBook): Promise<void> {
		loadingSearchPreview = true;
		try {
			const preview = await plugin.versePreviewService.getVersePreview(ref);
			if (preview && preview.verses.length > 0) {
				searchRefPreview = {
					book,
					chapter: preview.chapter,
					verses: preview.verses,
					versionAbbr: preview.versionAbbr,
				};
			} else {
				searchRefPreview = null;
			}
		} catch (e) {
			searchRefPreview = null;
		} finally {
			loadingSearchPreview = false;
		}
	}

	function handleSelectBook(book: BibleBook) {
		selectedBook = book;
		selectedChapter = null;
		selectedVerseNumbers = [];
		step = "chapters";
	}

	async function handleSelectChapter(chapter: number): Promise<void> {
		selectedChapter = chapter;
		selectedVerseNumbers = [];
		step = "verses";
		loadingVerses = true;
		try {
			if (selectedBook && activeDbPath) {
				const verses = await plugin.bibleText.readChapter(activeDbPath, selectedBook.id, chapter);
				chapterVerses = verses;
				// Select all verses by default for entire chapter convenience
				selectedVerseNumbers = verses.map((v) => v.number);
			}
		} catch (error) {
			console.error("OpenBible: error reading verses", error);
		} finally {
			loadingVerses = false;
		}
	}

	function toggleVerse(num: number, isShift: boolean) {
		if (selectedVerseNumbers.includes(num)) {
			if (selectedVerseNumbers.length === 1) {
				// Keep at least one or allow empty
				selectedVerseNumbers = [];
			} else {
				selectedVerseNumbers = selectedVerseNumbers.filter((n) => n !== num);
			}
		} else {
			if (isShift && selectedVerseNumbers.length > 0) {
				const min = Math.min(...selectedVerseNumbers, num);
				const max = Math.max(...selectedVerseNumbers, num);
				const range: number[] = [];
				for (let i = min; i <= max; i++) {
					range.push(i);
				}
				selectedVerseNumbers = range;
			} else {
				selectedVerseNumbers = [...selectedVerseNumbers, num].sort((a, b) => a - b);
			}
		}
	}

	function selectAllVerses() {
		selectedVerseNumbers = chapterVerses.map((v) => v.number);
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === "Enter") {
			if (searchRefPreview && searchRefPreview.verses.length > 0) {
				e.preventDefault();
				submitSearchPreview();
				return;
			}
		}
		if (e.key === "Escape") {
			e.preventDefault();
			onClose();
		}
	}

	function submitSearchPreview() {
		if (!searchRefPreview) return;
		onComplete({
			book: searchRefPreview.book,
			chapter: searchRefPreview.chapter,
			verses: searchRefPreview.verses,
			versionAbbr: searchRefPreview.versionAbbr,
			color: selectedCategory?.color,
			label: selectedCategory?.label,
		});
	}

	function submitStepSelection() {
		if (!selectedBook || selectedChapter === null) return;
		const filtered = chapterVerses.filter((v) =>
			selectedVerseNumbers.length === 0 || selectedVerseNumbers.includes(v.number)
		);
		onComplete({
			book: selectedBook,
			chapter: selectedChapter,
			verses: filtered.length > 0 ? filtered : chapterVerses,
			versionAbbr: activeDbAbbr,
			color: selectedCategory?.color,
			label: selectedCategory?.label,
		});
	}
</script>

<div class="open-bible-passage-picker-app">
	<!-- Modal Header -->
	<div class="open-bible-passage-picker-header">
		<div class="open-bible-passage-picker-header-title">
			<span class="open-bible-passage-picker-icon" use:icon={mode === "insert" ? "book-open" : "file-plus"}></span>
			<h3>{mode === "insert" ? t("passagePicker.titleInsert") : t("passagePicker.titleNote")}</h3>
		</div>
		<button
			type="button"
			class="open-bible-passage-picker-close-btn clickable-icon"
			aria-label={t("bookPicker.close")}
			onclick={onClose}
		>
			<span use:icon={"x"}></span>
		</button>
	</div>

	<!-- Top Search Input -->
	<div class="open-bible-passage-picker-search-bar">
		<span class="open-bible-picker-search-icon" use:icon={"search"}></span>
		<input
			bind:this={searchInputEl}
			type="search"
			class="open-bible-picker-search-input"
			placeholder={t("passagePicker.searchPlaceholder")}
			bind:value={searchQuery}
			onkeydown={handleKeyDown}
		/>
	</div>

	<!-- Case 1: Direct Reference Detected from Search Bar -->
	{#if parsedRef && matchedRefBook}
		<div class="open-bible-passage-picker-preview-card">
			<div class="open-bible-passage-picker-preview-header">
				<div class="open-bible-passage-picker-preview-ref">
					<span class="open-bible-picker-ref-badge-icon" use:icon={"bookmark"}></span>
					<strong>
						{matchedRefBook.name} {parsedRef.chapter}{parsedRef.verseStart ? `:${parsedRef.verseStart}${parsedRef.verseEnd ? `-${parsedRef.verseEnd}` : ""}` : ""}
					</strong>
					<span class="open-bible-passage-picker-version-badge">
						{parsedRef.versionAbbr || activeDbAbbr}
					</span>
				</div>
			</div>

			{#if loadingSearchPreview}
				<div class="open-bible-passage-picker-loading">{t("common.loading")}</div>
			{:else if searchRefPreview && searchRefPreview.verses.length > 0}
				<div class="open-bible-passage-picker-preview-verses">
					{#each searchRefPreview.verses as v (v.number)}
						<p class="open-bible-passage-picker-verse-line">
							<span class="open-bible-preview-verse-number">{v.number}</span>
							<span class="open-bible-preview-verse-text">{v.text}</span>
						</p>
					{/each}
				</div>

				<!-- Note category / color selector for createNote mode -->
				{#if mode === "createNote" && configuredNotes.length > 0}
					<div class="open-bible-passage-picker-categories">
						<span class="open-bible-passage-picker-cat-label">{t("passagePicker.noteCategory")}:</span>
						<div class="open-bible-passage-picker-cat-pills">
							{#each configuredNotes as cat (cat.id)}
								<button
									type="button"
									class="open-bible-passage-picker-cat-pill"
									class:is-active={selectedCategory?.id === cat.id}
									style="--cat-color: var(--open-bible-hl-{cat.color}, #eab308);"
									onclick={() => (selectedCategory = cat)}
								>
									<span class="open-bible-cat-color-dot"></span>
									<span>{cat.label}</span>
								</button>
							{/each}
						</div>
					</div>
				{/if}

				<!-- Action CTA -->
				<div class="open-bible-passage-picker-cta-row">
					<button
						type="button"
						class="mod-cta open-bible-passage-picker-cta-btn"
						onclick={submitSearchPreview}
					>
						{mode === "insert" ? t("passagePicker.insertAtCursor") : t("passagePicker.createNoteButton")}
						<span class="open-bible-cta-key-hint">↵ Enter</span>
					</button>
				</div>
			{:else}
				<div class="open-bible-passage-picker-missing">{t("resources.verseMissing")}</div>
			{/if}
		</div>
	{:else}
		<!-- Case 2: Stepped Visual Picker (Books -> Chapters -> Verses) -->
		<div class="open-bible-passage-picker-stepper-header">
			<div class="open-bible-passage-picker-breadcrumbs">
				<button
					type="button"
					class="open-bible-crumb-btn"
					class:is-active={step === "books"}
					onclick={() => (step = "books")}
				>
					{t("passagePicker.stepBook")}
				</button>
				{#if selectedBook}
					<span class="open-bible-crumb-sep">›</span>
					<button
						type="button"
						class="open-bible-crumb-btn"
						class:is-active={step === "chapters"}
						onclick={() => (step = "chapters")}
					>
						{selectedBook.name}
					</button>
				{/if}
				{#if selectedChapter !== null}
					<span class="open-bible-crumb-sep">›</span>
					<span class="open-bible-crumb-text is-active">
						Cap. {selectedChapter}
					</span>
				{/if}
			</div>

			{#if step === "chapters" || step === "verses"}
				<button
					type="button"
					class="open-bible-back-step-btn"
					onclick={() => {
						if (step === "verses") step = "chapters";
						else if (step === "chapters") step = "books";
					}}
				>
					<span use:icon={"arrow-left"}></span>
					{step === "verses" ? selectedBook?.name : t("passagePicker.stepBook")}
				</button>
			{/if}
		</div>

		<!-- Step 1: Books -->
		{#if step === "books"}
			<div class="open-bible-picker-tabs">
				<button
					type="button"
					class="open-bible-picker-tab"
					class:is-active={bookTab === "all"}
					onclick={() => (bookTab = "all")}
				>
					{t("bookPicker.tabAll", { count: availableBooks.length })}
				</button>
				<button
					type="button"
					class="open-bible-picker-tab"
					class:is-active={bookTab === "ot"}
					onclick={() => (bookTab = "ot")}
				>
					{t("bookPicker.tabOt", { count: otCount })}
				</button>
				<button
					type="button"
					class="open-bible-picker-tab"
					class:is-active={bookTab === "nt"}
					onclick={() => (bookTab = "nt")}
				>
					{t("bookPicker.tabNt", { count: ntCount })}
				</button>
			</div>

			<div class="open-bible-passage-picker-content-scroll">
				{#if filteredBooks.length === 0}
					<EmptyState title={t("bookPicker.noBooksFound", { query: searchQuery })} />
				{:else}
					<div class="open-bible-books-grid">
						{#each filteredBooks as book (book.id)}
							<button
								type="button"
								class="open-bible-book-tile"
								class:is-active={selectedBook?.id === book.id}
								onclick={() => handleSelectBook(book)}
							>
								<span class="open-bible-book-tile-name">{book.name}</span>
								<span class="open-bible-book-tile-count">
									{book.chapters.length === 1
										? t("bookPicker.chapterCountSingle")
										: t("bookPicker.chapterCountPlural", { count: book.chapters.length })}
								</span>
							</button>
						{/each}
					</div>
				{/if}
			</div>

		<!-- Step 2: Chapters -->
		{:else if step === "chapters" && selectedBook}
			<div class="open-bible-passage-picker-content-scroll">
				<div class="open-bible-chapters-grid">
					{#each selectedBook.chapters as chapter (chapter)}
						<button
							type="button"
							class="open-bible-chapter-tile"
							class:is-active={selectedChapter === chapter}
							onclick={() => void handleSelectChapter(chapter)}
						>
							{chapter}
						</button>
					{/each}
				</div>
			</div>

		<!-- Step 3: Verses -->
		{:else if step === "verses" && selectedBook && selectedChapter !== null}
			<div class="open-bible-passage-picker-verses-wrap">
				<div class="open-bible-passage-picker-verses-toolbar">
					<span class="open-bible-passage-picker-verses-info">
						<strong>{selectedBook.name} {selectedChapter}</strong>:
						{selectedVerseNumbers.length === chapterVerses.length
							? t("passagePicker.allChapter")
							: `${selectedVerseNumbers.length} selecionado(s)`}
					</span>
					<button
						type="button"
						class="open-bible-passage-picker-select-all-btn"
						onclick={selectAllVerses}
					>
						{t("passagePicker.selectAllVerses")}
					</button>
				</div>

				{#if loadingVerses}
					<div class="open-bible-passage-picker-loading">{t("common.loading")}</div>
				{:else}
					<div class="open-bible-passage-picker-verses-grid">
						{#each chapterVerses as v (v.number)}
							<button
								type="button"
								class="open-bible-verse-pill"
								class:is-selected={selectedVerseNumbers.includes(v.number)}
								onclick={(e) => toggleVerse(v.number, e.shiftKey)}
							>
								{v.number}
							</button>
						{/each}
					</div>

					<div class="open-bible-passage-picker-verses-preview">
						{#each chapterVerses.filter((v) => selectedVerseNumbers.includes(v.number)) as v (v.number)}
							<p class="open-bible-passage-picker-verse-line">
								<span class="open-bible-preview-verse-number">{v.number}</span>
								<span class="open-bible-preview-verse-text">{v.text}</span>
							</p>
						{/each}
					</div>
				{/if}

				<!-- Category selection for createNote mode -->
				{#if mode === "createNote" && configuredNotes.length > 0}
					<div class="open-bible-passage-picker-categories">
						<span class="open-bible-passage-picker-cat-label">{t("passagePicker.noteCategory")}:</span>
						<div class="open-bible-passage-picker-cat-pills">
							{#each configuredNotes as cat (cat.id)}
								<button
									type="button"
									class="open-bible-passage-picker-cat-pill"
									class:is-active={selectedCategory?.id === cat.id}
									style="--cat-color: var(--open-bible-hl-{cat.color}, #eab308);"
									onclick={() => (selectedCategory = cat)}
								>
									<span class="open-bible-cat-color-dot"></span>
									<span>{cat.label}</span>
								</button>
							{/each}
						</div>
					</div>
				{/if}

				<!-- Footer action -->
				<div class="open-bible-passage-picker-cta-row">
					<button
						type="button"
						class="mod-cta open-bible-passage-picker-cta-btn"
						disabled={selectedVerseNumbers.length === 0}
						onclick={submitStepSelection}
					>
						{mode === "insert" ? t("passagePicker.insertAtCursor") : t("passagePicker.createNoteButton")}
					</button>
				</div>
			</div>
		{/if}
	{/if}
</div>
