import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildNoteLanes, buildVerseLanesMap } from "./noteLanes";

describe("noteLanes", () => {
	it("places non-overlapping notes in the same lane", () => {
		const notes = [
			{ id: "note1", verses: [1, 2], color: "yellow", linkedNotePath: "note1.md", noteTitle: "Note 1" },
			{ id: "note2", verses: [4, 5], color: "green", linkedNotePath: "note2.md", noteTitle: "Note 2" },
		];

		const lanes = buildNoteLanes(notes, (p) => p);
		assert.equal(lanes.totalLanes, 1);
		assert.equal(lanes.notes[0].lane, 0);
		assert.equal(lanes.notes[1].lane, 0);
	});

	it("places overlapping notes in separate parallel lanes", () => {
		const notes = [
			{ id: "note1", verses: [1, 2, 3], color: "yellow", linkedNotePath: "note1.md", noteTitle: "Note 1" },
			{ id: "note2", verses: [2, 3, 4], color: "blue", linkedNotePath: "note2.md", noteTitle: "Note 2" },
		];

		const lanes = buildNoteLanes(notes, (p) => p);
		assert.equal(lanes.totalLanes, 2);
		assert.notEqual(lanes.notes[0].lane, lanes.notes[1].lane);
	});

	it("builds correct verse-lane slots with start/end markers", () => {
		const notes = [
			{ id: "note1", verses: [1, 2], color: "yellow", linkedNotePath: "note1.md", noteTitle: "Note 1" },
		];

		const lanes = buildNoteLanes(notes, (p) => p);
		const verseMap = buildVerseLanesMap([1, 2, 3], lanes);

		const v1 = verseMap.get(1);
		assert.ok(v1);
		assert.equal(v1[0]?.isStart, true);
		assert.equal(v1[0]?.isEnd, false);

		const v2 = verseMap.get(2);
		assert.ok(v2);
		assert.equal(v2[0]?.isStart, false);
		assert.equal(v2[0]?.isEnd, true);

		const v3 = verseMap.get(3);
		assert.ok(v3);
		assert.equal(v3[0], null);
	});
});
