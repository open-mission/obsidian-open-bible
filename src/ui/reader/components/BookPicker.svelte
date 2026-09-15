<script lang="ts">
	import { onMount } from "svelte";
	import { Platform } from "obsidian";
	import { icon } from "../../actions/icon";
	import { matchesBookSearch } from "../../../constants";
	import { parseSingleReference } from "../../../services/VerseReferenceParser";
	import type { BibleBook } from "../../../models/bible";
	import { t } from "../../../i18n";
	import PickerHeader from "../../kit/PickerHeader.svelte";
	import EmptyState from "../../kit/EmptyState.svelte";

	type ActiveBookTab = "all" | "ot" | "nt";

	interface Props {
		books: BibleBook[];
		currentBookId: number | undefined;
		onSelectBook: (book: BibleBook) => void;
		onNavigateToChapter?: (bookId: number, chapter: number) => void;
		onClose: () => void;
	}

	let {
		books,
		currentBookId,
		onSelectBook,
		onNavigateToChapter,
		onClose,
	}: Props = $props();

	let searchQuery = $state("");
	let activeTab = $state<ActiveBookTab>("all");
	let searchInputEl = $state<HTMLInputElement | undefined>();

	let otCount = $derived(books.filter((b) => b.testament === 1).length);
	let ntCount = $derived(books.filter((b) => b.testament === 2).length);

	let parsedRef = $derived.by(() => {
		const q = searchQuery.trim();
		if (!q) return null;
		return parseSingleReference(q);
	});

	let matchedRefBook = $derived.by(() => {
		if (!parsedRef) return null;
		return books.find((b) => b.id === parsedRef.canonicalBookId) ?? null;
	});

	let filteredBooks = $derived.by(() => {
		let list = books;
		if (activeTab === "ot") {
			list = list.filter((b) => b.testament === 1);
		} else if (activeTab === "nt") {
			list = list.filter((b) => b.testament === 2);
		}

		const query = searchQuery.trim();
		if (query) {
			const matched = matchedRefBook;
			const textFiltered = list.filter((b) => matchesBookSearch(b.name, query));
			if (matched && !textFiltered.some((b) => b.id === matched.id)) {
				const belongsToTab =
					activeTab === "all" ||
					(activeTab === "ot" && matched.testament === 1) ||
					(activeTab === "nt" && matched.testament === 2);
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

	let isSectionedAllView = $derived(activeTab === "all" && !searchQuery.trim());
	let otBooks = $derived(filteredBooks.filter((b) => b.testament === 1));
	let ntBooks = $derived(filteredBooks.filter((b) => b.testament === 2));

	function handleBookClick(book: BibleBook) {
		if (matchedRefBook?.id === book.id && parsedRef?.chapter && onNavigateToChapter) {
			if (book.chapters.includes(parsedRef.chapter)) {
				onNavigateToChapter(book.id, parsedRef.chapter);
				return;
			}
		}
		onSelectBook(book);
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === "Enter") {
			e.preventDefault();

			// If reference matched with chapter (e.g. "Gn 10" or "Genesis 10:1")
			if (parsedRef && matchedRefBook && onNavigateToChapter && parsedRef.chapter) {
				if (matchedRefBook.chapters.includes(parsedRef.chapter)) {
					onNavigateToChapter(matchedRefBook.id, parsedRef.chapter);
					return;
				}
			}

			// If reference matched a book without chapter
			if (matchedRefBook) {
				onSelectBook(matchedRefBook);
				return;
			}

			// Fallback to selecting first filtered book
			if (filteredBooks.length > 0) {
				onSelectBook(filteredBooks[0]);
			}
		}
	}

	onMount(() => {
		if (!Platform.isMobile) {
			setTimeout(() => {
				searchInputEl?.focus();
			}, 40);
		}
	});
</script>

<PickerHeader
	title=""
	closeLabel={t("bookPicker.close")}
	{onClose}
/>

<!-- Search Input -->
<div class="open-bible-picker-search-wrap">
	<span class="open-bible-picker-search-icon" use:icon={"search"}></span>
	<input
		bind:this={searchInputEl}
		type="search"
		class="open-bible-picker-search-input"
		placeholder={t("bookPicker.searchPlaceholder")}
		bind:value={searchQuery}
		onkeydown={handleKeyDown}
	/>
</div>

{#if parsedRef && matchedRefBook}
	<button
		type="button"
		class="open-bible-picker-ref-badge"
		onclick={() => handleBookClick(matchedRefBook!)}
	>
		<span class="open-bible-picker-ref-badge-icon" use:icon={"bookmark"}></span>
		<div class="open-bible-picker-ref-badge-content">
			<span class="open-bible-picker-ref-badge-title">
				{matchedRefBook.name} {parsedRef.chapter}{parsedRef.verseStart ? `:${parsedRef.verseStart}${parsedRef.verseEnd ? `-${parsedRef.verseEnd}` : ""}` : ""}
				{#if parsedRef.versionAbbr}
					<span class="open-bible-picker-ref-badge-version">({parsedRef.versionAbbr})</span>
				{/if}
			</span>
			<span class="open-bible-picker-ref-badge-hint">{t("bookPicker.pressEnterToOpen")}</span>
		</div>
		<span class="open-bible-picker-ref-badge-arrow" use:icon={"arrow-right"}></span>
	</button>
{/if}

<!-- Tabs: Todos, AT, NT -->
<div class="open-bible-picker-tabs">
	<button
		type="button"
		class="open-bible-picker-tab"
		class:is-active={activeTab === "all"}
		onclick={() => (activeTab = "all")}
	>
		{t("bookPicker.tabAll", { count: books.length })}
	</button>
	<button
		type="button"
		class="open-bible-picker-tab"
		class:is-active={activeTab === "ot"}
		onclick={() => (activeTab = "ot")}
	>
		{t("bookPicker.tabOt", { count: otCount })}
	</button>
	<button
		type="button"
		class="open-bible-picker-tab"
		class:is-active={activeTab === "nt"}
		onclick={() => (activeTab = "nt")}
	>
		{t("bookPicker.tabNt", { count: ntCount })}
	</button>
</div>

<!-- Body with books grid -->
<div class="open-bible-picker-body">
	{#if filteredBooks.length === 0}
		<EmptyState title={t("bookPicker.noBooksFound", { query: searchQuery })} />
	{:else if isSectionedAllView}
		{#if otBooks.length > 0}
			<div class="open-bible-books-section">
				<h4 class="open-bible-books-section-title">{t("bookPicker.sectionOt")}</h4>
				<div class="open-bible-books-grid">
					{#each otBooks as book (book.id)}
						<button
							type="button"
							class="open-bible-book-tile"
							class:is-active={book.id === currentBookId}
							class:is-reference-target={matchedRefBook?.id === book.id}
							aria-label={book.chapters.length === 1
								? t("bookPicker.bookAriaSingle", { name: book.name })
								: t("bookPicker.bookAriaPlural", { name: book.name, count: book.chapters.length })}
							onclick={() => handleBookClick(book)}
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
			</div>
		{/if}

		{#if ntBooks.length > 0}
			<div class="open-bible-books-section">
				<h4 class="open-bible-books-section-title">{t("bookPicker.sectionNt")}</h4>
				<div class="open-bible-books-grid">
					{#each ntBooks as book (book.id)}
						<button
							type="button"
							class="open-bible-book-tile"
							class:is-active={book.id === currentBookId}
							class:is-reference-target={matchedRefBook?.id === book.id}
							aria-label={book.chapters.length === 1
								? t("bookPicker.bookAriaSingle", { name: book.name })
								: t("bookPicker.bookAriaPlural", { name: book.name, count: book.chapters.length })}
							onclick={() => handleBookClick(book)}
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
			</div>
		{/if}
	{:else}
		<div class="open-bible-books-grid">
			{#each filteredBooks as book (book.id)}
				<button
					type="button"
					class="open-bible-book-tile"
					class:is-active={book.id === currentBookId}
					class:is-reference-target={matchedRefBook?.id === book.id}
					aria-label={book.chapters.length === 1
						? t("bookPicker.bookAriaSingle", { name: book.name })
						: t("bookPicker.bookAriaPlural", { name: book.name, count: book.chapters.length })}
					onclick={() => handleBookClick(book)}
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