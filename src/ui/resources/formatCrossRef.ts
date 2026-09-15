import { BIBLE_CANON } from "../../bibleCanon";
import type { CrossReference } from "../../data/crossRefModel";
import { formatReference } from "../../utils/verseFormat";

function verseNumbers(ref: CrossReference): number[] {
	const nums: number[] = [];
	for (let verse = ref.toVerseStart; verse <= ref.toVerseEnd; verse++) {
		nums.push(verse);
	}
	return nums;
}

function formatShortVerseRange(ref: CrossReference): string {
	return ref.toVerseStart === ref.toVerseEnd
		? `${ref.toVerseStart}`
		: `${ref.toVerseStart}-${ref.toVerseEnd}`;
}

export function formatCrossRefOrigin(ref: CrossReference): string {
	const book = BIBLE_CANON.find((entry) => entry.id === ref.fromBook);
	const verse = `${ref.fromChapter}:${ref.fromVerse}`;
	if (!book) {
		return verse;
	}
	return `${book.abbreviation} ${verse}`;
}

export function formatCrossRef(
	ref: CrossReference,
	style: "long" | "short",
	locale: "pt" | "en",
): string {
	const book = BIBLE_CANON.find((entry) => entry.id === ref.toBook);
	const range = formatShortVerseRange(ref);

	if (!book) {
		return `? ${ref.toChapter}:${range}`;
	}

	if (style === "short") {
		return `${book.abbreviation} ${ref.toChapter}:${range}`;
	}

	const bookName = locale === "pt" ? book.namePt : book.nameEn;
	return formatReference(bookName, ref.toChapter, verseNumbers(ref));
}
