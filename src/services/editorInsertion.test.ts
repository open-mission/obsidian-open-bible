import test from "node:test";
import assert from "node:assert/strict";
import { insertScriptureInEditor, insertScriptureAtCursor } from "./editorInsertion";
import type { Editor } from "obsidian";

class MockEditor {
	lines: string[];
	cursor: { line: number; ch: number };

	constructor(text: string, cursor = { line: 0, ch: 0 }) {
		this.lines = text.split("\n");
		this.cursor = cursor;
	}

	lineCount(): number {
		return this.lines.length;
	}

	getLine(line: number): string {
		return this.lines[line] ?? "";
	}

	getCursor() {
		return this.cursor;
	}

	setCursor(pos: { line: number; ch: number }) {
		this.cursor = pos;
	}

	setValue(val: string) {
		this.lines = val.split("\n");
	}

	getValue(): string {
		return this.lines.join("\n");
	}

	replaceRange(replacement: string, from: { line: number; ch: number }, to?: { line: number; ch: number }) {
		const full = this.getValue();
		// Compute offset for from
		let fromOffset = 0;
		for (let i = 0; i < from.line; i++) {
			fromOffset += this.lines[i].length + 1;
		}
		fromOffset += from.ch;

		let toOffset = fromOffset;
		if (to) {
			toOffset = 0;
			for (let i = 0; i < to.line; i++) {
				toOffset += this.lines[i].length + 1;
			}
			toOffset += to.ch;
		}

		const newFull = full.slice(0, fromOffset) + replacement + full.slice(toOffset);
		this.lines = newFull.split("\n");
	}
}

test("editorInsertion - insertScriptureInEditor below", () => {
	const editor = new MockEditor("This is paragraph one.\n\nThis is paragraph two.", { line: 0, ch: 5 });
	insertScriptureInEditor(editor as unknown as Editor, "> Verse text", "below", 0);
	const expected = "This is paragraph one.\n\n> Verse text\n\nThis is paragraph two.";
	assert.strictEqual(editor.getValue(), expected);
});

test("editorInsertion - insertScriptureInEditor below at end of document", () => {
	const editor = new MockEditor("Single line document with reference.", { line: 0, ch: 10 });
	insertScriptureInEditor(editor as unknown as Editor, "> Verse text", "below", 0);
	const expected = "Single line document with reference.\n\n> Verse text";
	assert.strictEqual(editor.getValue(), expected);
});

test("editorInsertion - insertScriptureInEditor above", () => {
	const editor = new MockEditor("This is paragraph one.\n\nThis is paragraph two.", { line: 2, ch: 5 });
	insertScriptureInEditor(editor as unknown as Editor, "> Verse text", "above", 2);
	const expected = "This is paragraph one.\n\n> Verse text\n\nThis is paragraph two.";
	assert.strictEqual(editor.getValue(), expected);
});

test("editorInsertion - insertScriptureAtCursor on empty line", () => {
	const editor = new MockEditor("Line 1\n\nLine 3", { line: 1, ch: 0 });
	insertScriptureAtCursor(editor as unknown as Editor, "> Verse text");
	assert.strictEqual(editor.getValue(), "Line 1\n> Verse text\n\nLine 3");
});
