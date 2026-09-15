export interface TextRangeData {
	verseNumber: number;
	charStart: number;
	charEnd: number;
	selectedText: string;
}

export function captureTextSelection(
	verseTextElement: HTMLElement
): TextRangeData | null {
	const selection = window.getSelection();
	if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
		return null;
	}

	const range = selection.getRangeAt(0);
	const verseRow = verseTextElement.closest("[data-verse]");
	if (!verseRow) {
		return null;
	}

	const verseNumber = parseInt(verseRow.getAttribute("data-verse") || "0", 10);
	if (!verseNumber) {
		return null;
	}

	if (!verseTextElement.contains(range.commonAncestorContainer)) {
		return null;
	}

	const selectedText = selection.toString().trim();
	if (!selectedText) {
		return null;
	}

	const verseText = verseTextElement.textContent || "";
	const charStart = getCharOffset(verseTextElement, range.startContainer, range.startOffset);
	const charEnd = getCharOffset(verseTextElement, range.endContainer, range.endOffset);

	if (charStart === -1 || charEnd === -1 || charStart >= charEnd) {
		return null;
	}

	const extractedText = verseText.substring(charStart, charEnd);
	if (extractedText.trim() !== selectedText) {
		return null;
	}

	return {
		verseNumber,
		charStart,
		charEnd,
		selectedText,
	};
}

function getCharOffset(
	rootElement: HTMLElement,
	targetNode: Node,
	targetOffset: number
): number {
	let offset = 0;
	const walker = document.createTreeWalker(
		rootElement,
		NodeFilter.SHOW_TEXT,
		null
	);

	let currentNode: Node | null = walker.nextNode();

	while (currentNode) {
		if (currentNode === targetNode) {
			return offset + targetOffset;
		}

		const nodeLength = currentNode.textContent?.length || 0;
		offset += nodeLength;

		currentNode = walker.nextNode();
	}

	return -1;
}

export function clearBrowserSelection(): void {
	const selection = window.getSelection();
	if (selection) {
		selection.removeAllRanges();
	}
}
