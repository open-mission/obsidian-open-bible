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

	const verseText = getPureVerseText(verseTextElement);
	const charStart = getCharOffset(verseTextElement, range.startContainer, range.startOffset);
	const charEnd = getCharOffset(verseTextElement, range.endContainer, range.endOffset);

	if (charStart === -1 || charEnd === -1 || charStart >= charEnd) {
		return null;
	}

	let trimmedStart = charStart;
	let trimmedEnd = charEnd;
	while (trimmedStart < trimmedEnd && /\s/.test(verseText[trimmedStart])) {
		trimmedStart++;
	}
	while (trimmedEnd > trimmedStart && /\s/.test(verseText[trimmedEnd - 1])) {
		trimmedEnd--;
	}

	if (trimmedStart >= trimmedEnd) {
		return null;
	}

	const trimmedSelectedText = verseText.substring(trimmedStart, trimmedEnd);
	if (trimmedSelectedText !== selectedText) {
		return null;
	}

	return {
		verseNumber,
		charStart: trimmedStart,
		charEnd: trimmedEnd,
		selectedText: trimmedSelectedText,
	};
}

function getPureVerseText(rootElement: HTMLElement): string {
	let text = "";
	const walker = document.createTreeWalker(
		rootElement,
		NodeFilter.SHOW_TEXT,
		{
			acceptNode(node: Node) {
				if (node.parentElement?.closest(".open-bible-range-marker")) {
					return NodeFilter.FILTER_REJECT;
				}
				return NodeFilter.FILTER_ACCEPT;
			},
		}
	);

	let currentNode = walker.nextNode();
	while (currentNode) {
		text += currentNode.textContent || "";
		currentNode = walker.nextNode();
	}
	return text;
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
		{
			acceptNode(node: Node) {
				if (node.parentElement?.closest(".open-bible-range-marker")) {
					return NodeFilter.FILTER_REJECT;
				}
				return NodeFilter.FILTER_ACCEPT;
			},
		}
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
