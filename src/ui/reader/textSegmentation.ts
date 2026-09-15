import type { BibleNoteItem } from "../../models/note";

export interface TextSegment {
	text: string;
	charStart: number;
	charEnd: number;
	highlights: BibleNoteItem[];
}

export function segmentVerseText(
	verseText: string,
	verseNumber: number,
	allHighlights: BibleNoteItem[]
): TextSegment[] {
	const rangedHighlights = allHighlights.filter(
		(h) => h.charStart !== undefined && h.charEnd !== undefined
	);
	const fullVerseHighlights = allHighlights.filter(
		(h) => h.charStart === undefined || h.charEnd === undefined
	);

	if (rangedHighlights.length === 0) {
		return [
			{
				text: verseText,
				charStart: 0,
				charEnd: verseText.length,
				highlights: fullVerseHighlights,
			},
		];
	}

	const boundaries = new Set<number>([0, verseText.length]);
	for (const hl of rangedHighlights) {
		if (hl.charStart !== undefined && hl.charEnd !== undefined) {
			const start = Math.max(0, Math.min(hl.charStart, verseText.length));
			const end = Math.max(0, Math.min(hl.charEnd, verseText.length));
			boundaries.add(start);
			boundaries.add(end);
		}
	}

	const sortedBoundaries = Array.from(boundaries).sort((a, b) => a - b);
	const segments: TextSegment[] = [];

	for (let i = 0; i < sortedBoundaries.length - 1; i++) {
		const start = sortedBoundaries[i];
		const end = sortedBoundaries[i + 1];
		const text = verseText.substring(start, end);

		const overlappingHighlights = [
			...fullVerseHighlights,
			...rangedHighlights.filter(
				(hl) =>
					hl.charStart !== undefined &&
					hl.charEnd !== undefined &&
					hl.charStart <= start &&
					hl.charEnd >= end
			),
		];

		segments.push({
			text,
			charStart: start,
			charEnd: end,
			highlights: overlappingHighlights,
		});
	}

	return segments;
}
