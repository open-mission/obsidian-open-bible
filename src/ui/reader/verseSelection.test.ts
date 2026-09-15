import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { applyVerseClick } from "./verseSelection";

describe("applyVerseClick", () => {
	const allVerses = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

	it("single click selects only that verse", () => {
		const res1 = applyVerseClick([], null, 3, allVerses, false);
		assert.deepEqual(res1.selected, [3]);
		assert.equal(res1.lastClicked, 3);

		// Clicking another verse without shift selects ONLY the new verse
		const res2 = applyVerseClick(res1.selected, res1.lastClicked, 5, allVerses, false);
		assert.deepEqual(res2.selected, [5]);
		assert.equal(res2.lastClicked, 5);
	});

	it("clicking the same single verse again deselects it", () => {
		const res1 = applyVerseClick([3], 3, 3, allVerses, false);
		assert.deepEqual(res1.selected, []);
		assert.equal(res1.lastClicked, 3);
	});

	it("shift-click selects a range of verses", () => {
		const res1 = applyVerseClick([], null, 2, allVerses, false);
		assert.deepEqual(res1.selected, [2]);

		const res2 = applyVerseClick(res1.selected, res1.lastClicked, 5, allVerses, true);
		assert.deepEqual(res2.selected, [2, 3, 4, 5]);
		assert.equal(res2.lastClicked, 5);
	});

	it("selection mode toggles verses without shift", () => {
		const res1 = applyVerseClick([], null, 2, allVerses, false, true);
		assert.deepEqual(res1.selected, [2]);

		const res2 = applyVerseClick(res1.selected, res1.lastClicked, 4, allVerses, false, true);
		assert.deepEqual(res2.selected, [2, 4]);

		const res3 = applyVerseClick(res2.selected, res2.lastClicked, 2, allVerses, false, true);
		assert.deepEqual(res3.selected, [4]);
	});
});
