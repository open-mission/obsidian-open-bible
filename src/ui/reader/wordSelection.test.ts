import test from "node:test";
import assert from "node:assert/strict";
import { findWordAtCharOffset } from "./textRangeSelection";
import type { BibleResourceLink } from "../../models/resource";

test("findWordAtCharOffset finds whole words including accents", () => {
	const text = "No princípio criou Deus os céus e a terra.";

	// Clicking on "princípio"
	const match1 = findWordAtCharOffset(text, 5);
	assert.ok(match1);
	assert.equal(match1.word, "princípio");
	assert.equal(text.substring(match1.start, match1.end), "princípio");

	// Clicking on "céus"
	const match2 = findWordAtCharOffset(text, 28);
	assert.ok(match2);
	assert.equal(match2.word, "céus");
	assert.equal(text.substring(match2.start, match2.end), "céus");

	// Clicking right at the end of "céus" (offset 31)
	const match3 = findWordAtCharOffset(text, 31);
	assert.ok(match3);
	assert.equal(match3.word, "céus");

	// Clicking on "terra"
	const match4 = findWordAtCharOffset(text, 38);
	assert.ok(match4);
	assert.equal(match4.word, "terra");

	// Clicking outside text range or empty
	assert.equal(findWordAtCharOffset(text, -1), null);
	assert.equal(findWordAtCharOffset(text, 100), null);
	assert.equal(findWordAtCharOffset("", 0), null);
});

test("resource occurrence matching respects matchAllOccurrences flag", () => {
	const verses = [
		{ number: 1, text: "No princípio criou Deus os céus e a terra." },
		{ number: 8, text: "E chamou Deus à expansão Céus, e foi a tarde e a manhã, o dia segundo." },
		{ number: 20, text: "E disse Deus: Produzam as águas répteis de alma vivente; e voem as aves sobre a face da expansão dos céus." },
	];

	const singleOccurrenceLink: BibleResourceLink = {
		path: "data/resources/links/link-1.md",
		resourceType: "concept",
		resourcePath: "data/resources/Céus.md",
		resourceName: "Céus",
		book: "Gênesis",
		chapter: 1,
		verses: [1],
		versesStr: "1",
		color: "blue",
		reference: "Gênesis 1:1",
		selectedText: "céus",
		charStart: 27,
		charEnd: 31,
		matchAllOccurrences: false,
	};

	const allOccurrencesLink: BibleResourceLink = {
		...singleOccurrenceLink,
		path: "data/resources/links/link-2.md",
		matchAllOccurrences: true,
	};

	function isWordChar(ch: string | undefined): boolean {
		return Boolean(ch && /[\p{L}\p{N}_]/u.test(ch));
	}

	function computeAutoMatches(links: BibleResourceLink[]) {
		const matchesByVerse = new Map<number, Array<{ needle: string; start: number; end: number }>>();
		const ranged = links.filter(
			(l) =>
				Boolean(l.matchAllOccurrences) &&
				l.selectedText &&
				l.selectedText.trim() &&
				l.charStart !== undefined &&
				l.charEnd !== undefined,
		);

		if (ranged.length === 0) return matchesByVerse;

		for (const v of verses) {
			const found: Array<{ needle: string; start: number; end: number }> = [];
			const hayLower = v.text.toLowerCase();
			for (const link of ranged) {
				const needle = link.selectedText!.trim();
				const needleLower = needle.toLowerCase();
				let from = 0;
				while (from <= hayLower.length - needleLower.length) {
					const idx = hayLower.indexOf(needleLower, from);
					if (idx < 0) break;
					const end = idx + needle.length;
					const wholeWord = !isWordChar(v.text[idx - 1]) && !isWordChar(v.text[end]);
					const isOriginal =
						link.verses.includes(v.number) && link.charStart === idx && link.charEnd === end;
					if (wholeWord && !isOriginal) {
						found.push({ needle, start: idx, end });
					}
					from = idx + Math.max(1, needle.length);
				}
			}
			if (found.length > 0) matchesByVerse.set(v.number, found);
		}
		return matchesByVerse;
	}

	// When link has matchAllOccurrences: false
	const matchesSingle = computeAutoMatches([singleOccurrenceLink]);
	assert.equal(matchesSingle.size, 0, "Single occurrence link must not produce auto-matches across other verses");

	// When link has matchAllOccurrences: true
	const matchesAll = computeAutoMatches([allOccurrencesLink]);
	assert.equal(matchesAll.size, 2, "All occurrences link must match verses 8 and 20");
	assert.ok(matchesAll.has(8), "Verse 8 must have auto match");
	assert.ok(matchesAll.has(20), "Verse 20 must have auto match");
	assert.equal(matchesAll.has(1), false, "Verse 1 is the original verse, not an auto-match");
});
