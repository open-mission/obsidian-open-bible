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

/**
 * Regex to scan text for possible bible references.
 * Matches patterns like:
 * - 1 João 3:16
 * - 1Jo 3.16
 * - Gênesis 1:1-5
 * - Gen 1.10 NVT
 * - Mt 5:14-16 ARA
 * - Sl 23.1-6
 *
 * Uses lookahead/lookbehind instead of \b to support accented characters.
 * Restricts whitespace to spaces and tabs so matches stay within single lines.
 */
const VERSE_REF_REGEX = /(?<![A-Za-z0-9_À-ÿ])([1-3][ \t]*[A-Za-zÀ-ÿ]+|[A-Za-zÀ-ÿ]+(?:[ \t]+dos[ \t]+[A-Za-zÀ-ÿ]+|[ \t]+of[ \t]+[A-Za-zÀ-ÿ]+)?)[ \t]+(\d+)[:\.,](\d+)(?:[-–](\d+))?(?:[ \t]+([A-Za-z]{2,6}))?(?![A-Za-z0-9_À-ÿ])/g;

/**
 * Finds all valid Bible verse references in a string of text.
 * Used by the editor extension and Markdown post processor to underline and preview references.
 */
export function findAllReferencesInText(text: string): ParsedVerseReference[] {
	if (!text || text.length < 3) return [];
	const results: ParsedVerseReference[] = [];
	VERSE_REF_REGEX.lastIndex = 0;

	let match: RegExpExecArray | null;
	while ((match = VERSE_REF_REGEX.exec(text)) !== null) {
		const bookCandidate = match[1].trim();
		// Ignore common short abbreviations or single characters
		if (bookCandidate.length < 2) continue;

		const canon = getCanonBook(bookCandidate);
		if (!canon) continue;

		const chapter = parseInt(match[2], 10);
		if (isNaN(chapter) || chapter < 1 || chapter > canon.chaptersCount) continue;

		// Require at least a verse specification (e.g. Gen 1:1 or Gen 1.1) to avoid turning general chapter mentions into verse popovers
		if (!match[3]) continue;

		const verseStart = parseInt(match[3], 10);
		if (isNaN(verseStart) || verseStart < 1) continue;

		const verseEnd = match[4] ? parseInt(match[4], 10) : undefined;
		if (verseEnd !== undefined && (isNaN(verseEnd) || verseEnd < verseStart)) continue;

		const versionCandidate = match[5] ? match[5].toUpperCase().trim() : undefined;
		let versionAbbr: string | undefined = undefined;
		let rawMatch = match[0];

		if (versionCandidate) {
			if (KNOWN_VERSIONS.has(versionCandidate)) {
				versionAbbr = versionCandidate;
			} else {
				// If not a known version, don't consume the trailing word as part of the reference
				rawMatch = rawMatch.replace(new RegExp(`[ \\t]+${match[5]}$`), "");
			}
		}

		results.push({
			raw: rawMatch,
			bookName: canon.namePt,
			canonicalBookId: canon.id,
			chapter,
			verseStart,
			verseEnd,
			versionAbbr,
			startIndex: match.index,
			endIndex: match.index + rawMatch.length,
		});
	}

	return results;
}

/** Returns the reference whose span contains posInText (0-based index in text). */
export function findReferenceAtPosition(
	text: string,
	posInText: number,
	inclusiveEnd = false
): ParsedVerseReference | null {
	for (const ref of findAllReferencesInText(text)) {
		const inRange = inclusiveEnd
			? posInText >= ref.startIndex && posInText <= ref.endIndex
			: posInText >= ref.startIndex && posInText < ref.endIndex;
		if (inRange) return ref;
	}
	return null;
}

