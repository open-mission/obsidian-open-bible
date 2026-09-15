import type { Editor } from "obsidian";

/**
 * Inserts formatted Scripture quote text relative to the current paragraph block in an active editor.
 *
 * @param editor Obsidian editor instance
 * @param formattedText Formatted markdown quote (e.g. from formatVersesText)
 * @param position "below" to insert after the current block, or "above" to insert before it
 * @param targetLine Optional line number of the reference or cursor (defaults to current cursor line)
 */
export function insertScriptureInEditor(
	editor: Editor,
	formattedText: string,
	position: "below" | "above" = "below",
	targetLine?: number
): void {
	const lineCount = editor.lineCount();
	if (lineCount === 0) {
		editor.setValue(formattedText);
		return;
	}

	const cursor = editor.getCursor();
	const currentLineNum = Math.min(
		Math.max(0, targetLine !== undefined ? targetLine : cursor.line),
		lineCount - 1
	);

	if (position === "below") {
		// Find the end of the current paragraph / block
		let endLine = currentLineNum;
		while (endLine < lineCount - 1) {
			const nextText = editor.getLine(endLine + 1).trim();
			if (nextText === "") {
				break;
			}
			endLine++;
		}

		const lineContent = editor.getLine(endLine);
		const pos = { line: endLine, ch: lineContent.length };
		const hasEmptyLineAfter = endLine + 1 < lineCount && editor.getLine(endLine + 1).trim() === "";
		const suffix = hasEmptyLineAfter ? "" : (endLine + 1 < lineCount ? "\n\n" : "");
		editor.replaceRange(`\n\n${formattedText}${suffix}`, pos);
		editor.setCursor({ line: endLine + 2, ch: 0 });
	} else {
		// Find start of the current paragraph / block
		let startLine = currentLineNum;
		while (startLine > 0) {
			const prevText = editor.getLine(startLine - 1).trim();
			if (prevText === "") {
				break;
			}
			startLine--;
		}

		// Insert above the startLine
		const pos = { line: startLine, ch: 0 };
		const hasEmptyLineBefore = startLine > 0 && editor.getLine(startLine - 1).trim() === "";
		const prefix = startLine > 0 && !hasEmptyLineBefore ? "\n\n" : "";
		editor.replaceRange(`${prefix}${formattedText}\n\n`, pos);
		editor.setCursor({ line: startLine, ch: 0 });
	}
}

/**
 * Inserts formatted Scripture quote directly at the editor's active cursor position.
 */
export function insertScriptureAtCursor(editor: Editor, formattedText: string): void {
	const cursor = editor.getCursor();
	const line = editor.getLine(cursor.line);

	// If line is empty or whitespace only, replace line with formatted text
	if (line.trim() === "") {
		editor.replaceRange(`${formattedText}\n`, { line: cursor.line, ch: 0 }, { line: cursor.line, ch: line.length });
	} else {
		// Insert at cursor
		editor.replaceRange(formattedText, cursor);
	}
}
