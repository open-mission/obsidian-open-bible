<script lang="ts">
	import type { BibleBook } from "../../../models/bible";
	import { t } from "../../../i18n";
	import PickerHeader from "../../kit/PickerHeader.svelte";
	import EmptyState from "../../kit/EmptyState.svelte";

	interface Props {
		book: BibleBook;
		currentBookId: number | undefined;
		currentChapter: number | undefined;
		onBack: () => void;
		onSelectChapter: (chapter: number) => void;
		onClose: () => void;
	}

	let {
		book,
		currentBookId,
		currentChapter,
		onBack,
		onSelectChapter,
		onClose,
	}: Props = $props();
</script>

<PickerHeader
	title=""
	closeLabel={t("chapterPicker.close")}
	{onClose}
	{onBack}
	backLabel={book.name}
/>

{#if book.chapters.length === 0}
	<EmptyState title={t("chapterPicker.noChaptersDesc")} />
{:else}
	<div class="open-bible-chapters-grid">
		{#each book.chapters as chapter (chapter)}
			<button
				type="button"
				class="open-bible-chapter-tile"
				class:is-active={book.id === currentBookId && chapter === currentChapter}
				aria-label={t("chapterPicker.chapterAria", { chapter })}
				onclick={() => onSelectChapter(chapter)}
			>
				{chapter}
			</button>
		{/each}
	</div>
{/if}