import { BIBLE_CANON } from "../../bibleCanon";
import type { CrossReference } from "../../data/crossRefModel";
import type { ParsedVerseReference } from "../../services/VerseReferenceParser";

export function crossRefToParsedVerseReference(
	ref: CrossReference,
	locale: "pt" | "en",
): ParsedVerseReference | null {
	const book = BIBLE_CANON.find((entry) => entry.id === ref.toBook);
	if (!book) {
		return null;
	}
	return {
		raw: "",
		bookName: locale === "pt" ? book.namePt : book.nameEn,
		canonicalBookId: ref.toBook,
		chapter: ref.toChapter,
		verseStart: ref.toVerseStart,
		verseEnd: ref.toVerseEnd !== ref.toVerseStart ? ref.toVerseEnd : undefined,
		startIndex: 0,
		endIndex: 0,
	};
}
