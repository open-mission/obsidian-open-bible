import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
	formatReference,
	formatVerseRange,
	formatVersesText,
	toSuperscript,
} from "./verseFormat";

describe("verseFormat", () => {
	it("formats single verse and verse ranges", () => {
		assert.equal(formatVerseRange([1]), "1");
		assert.equal(formatVerseRange([1, 2, 3]), "1-3");
		assert.equal(formatVerseRange([1, 2, 5, 6]), "1-2, 5-6");
		assert.equal(formatVerseRange([3, 1, 2]), "1-3");
	});

	it("formats canonical references with and without version", () => {
		assert.equal(formatReference("Gálatas", 6, [1]), "Gálatas 6:1");
		assert.equal(formatReference("Gálatas", 6, [1, 2], "ARA"), "Gálatas 6:1-2 (ARA)");
	});

	it("converts numbers to superscript correctly", () => {
		assert.equal(toSuperscript(1), "¹");
		assert.equal(toSuperscript(16), "¹⁶");
		assert.equal(toSuperscript(123), "¹²³");
	});

	it("formats verses as markdown quotes", () => {
		const formatted = formatVersesText(
			[
				{ number: 1, text: "Irmãos, se alguém for surpreendido em algum pecado..." },
				{ number: 2, text: "Levem os fardos pesados uns dos outros..." },
			],
			"Gálatas",
			6,
			"ARA"
		);
		assert.ok(formatted.includes("> ¹ Irmãos"));
		assert.ok(formatted.includes("> ² Levem"));
		assert.ok(formatted.includes("— Gálatas 6:1-2 (ARA)"));
	});
});
