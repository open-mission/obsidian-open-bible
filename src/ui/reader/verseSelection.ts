export function applyVerseClick(
	selected: number[],
	lastClicked: number | null,
	verseNumber: number,
	availableVerseNumbers: number[],
	shiftKey: boolean,
	isSelectionMode = false
): { selected: number[]; lastClicked: number } {
	if (shiftKey && lastClicked !== null) {
		const start = Math.min(lastClicked, verseNumber);
		const end = Math.max(lastClicked, verseNumber);
		const range = availableVerseNumbers.filter((n) => n >= start && n <= end);
		return {
			selected: [...new Set([...selected, ...range])].sort((a, b) => a - b),
			lastClicked: verseNumber,
		};
	}

	if (isSelectionMode) {
		// In selection mode (checkboxes / mobile mode), toggle the verse in/out of selection
		if (selected.includes(verseNumber)) {
			return {
				selected: selected.filter((n) => n !== verseNumber),
				lastClicked: verseNumber,
			};
		}
		return {
			selected: [...selected, verseNumber].sort((a, b) => a - b),
			lastClicked: verseNumber,
		};
	}

	// Normal mode: clicking a verse selects ONLY that verse
	// If it was already the only selected verse, clicking it again deselects it
	if (selected.length === 1 && selected[0] === verseNumber) {
		return {
			selected: [],
			lastClicked: verseNumber,
		};
	}

	return {
		selected: [verseNumber],
		lastClicked: verseNumber,
	};
}
