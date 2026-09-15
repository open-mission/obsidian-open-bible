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

	it("splits text for phrase highlights like 'torre que estavam construindo'", () => {
		const text = "O SENHOR, porém, desceu para ver a cidade e a torre que estavam construindo.";
		const phrase = "torre que estavam construindo";
		const charStart = text.indexOf(phrase);
		const charEnd = charStart + phrase.length;

		const hl: BibleNoteItem = {
			path: "hl-torre.md",
			type: "highlight",
			title: phrase,
			book: "Gênesis",
			chapter: 11,
			verses: [5],
			versesStr: "5",
			color: "green",
			reference: "Gênesis 11:5",
			charStart,
			charEnd,
			selectedText: phrase,
		};

		const segments = segmentVerseText(text, 5, [hl]);
		assert.equal(segments.length, 3);
		assert.equal(segments[0].text, text.substring(0, charStart));
		assert.equal(segments[0].highlights.length, 0);

		assert.equal(segments[1].text, phrase);
		assert.equal(segments[1].highlights.length, 1);
		assert.equal(segments[1].highlights[0].color, "green");

		assert.equal(segments[2].text, ".");
		assert.equal(segments[2].highlights.length, 0);
	});

	it("combines full-verse and ranged highlights on the same verse", () => {
		const text = "O SENHOR, porém, desceu para ver a cidade e a torre que estavam construindo.";
		const fullHl: BibleNoteItem = {
			path: "hl-full.md",
			type: "highlight",
			title: "Gênesis 11:5",
			book: "Gênesis",
			chapter: 11,
			verses: [5],
			versesStr: "5",
			color: "yellow",
			reference: "Gênesis 11:5",
		};
		const wordHl: BibleNoteItem = {
			path: "hl-senhor.md",
			type: "highlight",
			title: "SENHOR",
			book: "Gênesis",
			chapter: 11,
			verses: [5],
			versesStr: "5",
			color: "blue",
			reference: "Gênesis 11:5",
			charStart: 2,
			charEnd: 8,
			selectedText: "SENHOR",
		};

		const segments = segmentVerseText(text, 5, [fullHl, wordHl]);
		assert.equal(segments.length, 3);
		// Before "SENHOR": covers fullHl
		assert.equal(segments[0].text, "O ");
		assert.equal(segments[0].highlights.length, 1);
		assert.equal(segments[0].highlights[0].color, "yellow");

		// "SENHOR": covers both fullHl and wordHl
		assert.equal(segments[1].text, "SENHOR");
		assert.equal(segments[1].highlights.length, 2);

		// After "SENHOR": covers fullHl
		assert.equal(segments[2].highlights.length, 1);
		assert.equal(segments[2].highlights[0].color, "yellow");
	});

	it("marks activeTextSelection range as isSelected: true", () => {
		const text = "O SENHOR, porém, desceu para ver a cidade e a torre que estavam construindo.";
		const phrase = "torre que estavam construindo";
		const charStart = text.indexOf(phrase);
		const charEnd = charStart + phrase.length;

		const segments = segmentVerseText(text, 5, [], { charStart, charEnd });
		assert.equal(segments.length, 3);
		assert.equal(segments[0].text, text.substring(0, charStart));
		assert.equal(segments[0].isSelected, false);

		assert.equal(segments[1].text, phrase);
		assert.equal(segments[1].isSelected, true);

		assert.equal(segments[2].text, ".");
		assert.equal(segments[2].isSelected, false);
	});
});
