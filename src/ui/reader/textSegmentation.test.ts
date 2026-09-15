import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { segmentVerseText } from "./textSegmentation";
import type { BibleNoteItem } from "../../models/note";

describe("textSegmentation", () => {
	it("returns single segment when no ranged highlights exist", () => {
		const text = "No princípio criou Deus os céus e a terra.";
		const segments = segmentVerseText(text, 1, []);
		assert.equal(segments.length, 1);
		assert.equal(segments[0].text, text);
		assert.equal(segments[0].highlights.length, 0);
	});

	it("splits text into segments for word-level highlights", () => {
		const text = "No princípio criou Deus os céus e a terra.";
		const hl: BibleNoteItem = {
			path: "hl.md",
			type: "highlight",
			title: "Deus",
			book: "Gênesis",
			chapter: 1,
			verses: [1],
			versesStr: "1",
			color: "yellow",
			reference: "Gênesis 1:1",
			charStart: 19,
			charEnd: 23,
			selectedText: "Deus",
		};

		const segments = segmentVerseText(text, 1, [hl]);
		assert.equal(segments.length, 3);
		assert.equal(segments[0].text, "No princípio criou ");
		assert.equal(segments[0].highlights.length, 0);
		assert.equal(segments[1].text, "Deus");
		assert.equal(segments[1].highlights.length, 1);
		assert.equal(segments[2].text, " os céus e a terra.");
		assert.equal(segments[2].highlights.length, 0);
	});
});
