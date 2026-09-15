import { getCanonBook } from "../bibleCanon";

export interface ParsedVerseReference {
	raw: string;
	bookName: string;
	canonicalBookId: number;
	chapter: number;
	verseStart: number;
	verseEnd?: number;
	versionAbbr?: string;
	startIndex: number;
	endIndex: number;
}

const KNOWN_VERSIONS = new Set([
	"ARA", "NVT", "NVI", "ARC", "NAA", "ACF", "AS21", "TB", "KJV", "NKJV",
	"ESV", "NIV", "NLT", "CSB", "NASB", "NET", "RSV", "NRSV", "MSG", "AMP",
]);

const SINGLE_REF_REGEX = /(?<![A-Za-z0-9_À-ÿ])([1-3]\s*[A-Za-zÀ-ÿ]+|[A-Za-zÀ-ÿ]+(?:\s+dos\s+[A-Za-zÀ-ÿ]+|\s+of\s+[A-Za-zÀ-ÿ]+)?)\s+(\d+)(?:[:\.,](\d+)(?:[-–](\d+))?)?(?:\s+([A-Za-z]{2,6}))?(?![A-Za-z0-9_À-ÿ])/;

export function parseSingleReference(text: string): ParsedVerseReference | null {
	if (!text) return null;
	const trimmed = text.trim();
	const match = SINGLE_REF_REGEX.exec(trimmed);
	if (!match) return null;

	const bookCandidate = match[1].trim();
	const canon = getCanonBook(bookCandidate);
	if (!canon) return null;

	const chapter = parseInt(match[2], 10);
	if (isNaN(chapter) || chapter < 1 || chapter > canon.chaptersCount) return null;

	const verseStart = match[3] ? parseInt(match[3], 10) : 1;
	const verseEnd = match[4] ? parseInt(match[4], 10) : undefined;
	const versionCandidate = match[5] ? match[5].toUpperCase().trim() : undefined;

	let versionAbbr: string | undefined = undefined;
	if (versionCandidate && (KNOWN_VERSIONS.has(versionCandidate) || versionCandidate.length <= 5)) {
		versionAbbr = versionCandidate;
	}

	return {
		raw: match[0],
		bookName: canon.namePt,
		canonicalBookId: canon.id,
		chapter,
		verseStart,
		verseEnd,
		versionAbbr,
		startIndex: match.index,
		endIndex: match.index + match[0].length,
	};
}
