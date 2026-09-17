import type { BibleNoteItem } from "../../models/note";

export interface TextSegment {
	text: string;
	charStart: number;
	charEnd: number;
	highlights: BibleNoteItem[];
	isSelected?: boolean;
}

export function segmentVerseText(
	verseText: string,
	verseNumber: number,
	allHighlights: BibleNoteItem[],
	activeTextSelection?: { charStart: number; charEnd: number } | null,
	extraRanges?: Array<{ charStart?: number; charEnd?: number }> | null,
): TextSegment[] {
	const rangedHighlights = allHighlights.filter(
		(h) => h.charStart !== undefined && h.charEnd !== undefined
	);
	const fullVerseHighlights = allHighlights.filter(
		(h) => h.charStart === undefined || h.charEnd === undefined
	);

	const hasActiveSelection = Boolean(
		activeTextSelection &&
		activeTextSelection.charStart !== undefined &&
		activeTextSelection.charEnd !== undefined &&
		activeTextSelection.charStart < activeTextSelection.charEnd
	);

	const hasExtraRanges = Boolean(
		extraRanges?.some(
			(r) =>
				r.charStart !== undefined &&
				r.charEnd !== undefined &&
				r.charStart < r.charEnd,
		),
	);

	if (rangedHighlights.length === 0 && !hasActiveSelection && !hasExtraRanges) {
		return [
			{
				text: verseText,
				charStart: 0,
				charEnd: verseText.length,
				highlights: fullVerseHighlights,
				isSelected: false,
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

	if (hasActiveSelection && activeTextSelection) {
		const start = Math.max(0, Math.min(activeTextSelection.charStart, verseText.length));
		const end = Math.max(0, Math.min(activeTextSelection.charEnd, verseText.length));
		boundaries.add(start);
		boundaries.add(end);
	}

	if (extraRanges) {
		for (const r of extraRanges) {
			if (r.charStart !== undefined && r.charEnd !== undefined) {
				const start = Math.max(0, Math.min(r.charStart, verseText.length));
				const end = Math.max(0, Math.min(r.charEnd, verseText.length));
				boundaries.add(start);
				boundaries.add(end);
			}
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

		const isSelected = Boolean(
			hasActiveSelection &&
			activeTextSelection &&
			activeTextSelection.charStart <= start &&
			activeTextSelection.charEnd >= end
		);

		segments.push({
			text,
			charStart: start,
			charEnd: end,
			highlights: overlappingHighlights,
			isSelected,
		});
	}

	return segments;
}
