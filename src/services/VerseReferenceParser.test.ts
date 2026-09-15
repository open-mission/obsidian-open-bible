import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
	findAllReferencesInText,
	findReferenceAtPosition,
	parseSingleReference,
} from "./VerseReferenceParser";

describe("parseSingleReference", () => {
	it("parses Portuguese book, colon verse, and version", () => {
		const ref = parseSingleReference("João 3:16 NVI");
		assert.ok(ref);
		assert.equal(ref.canonicalBookId, 43);
		assert.equal(ref.chapter, 3);
		assert.equal(ref.verseStart, 16);
		assert.equal(ref.verseEnd, undefined);
		assert.equal(ref.versionAbbr, "NVI");
	});

	it("parses numbered books and dotted verses", () => {
		const ref = parseSingleReference("1 João 3.16");
		assert.ok(ref);
		assert.equal(ref.canonicalBookId, 62);
		assert.equal(ref.chapter, 3);
		assert.equal(ref.verseStart, 16);
	});

	it("parses a range and English abbreviation", () => {
		const ref = parseSingleReference("Gen 1:1-3 ESV");
		assert.ok(ref);
		assert.equal(ref.canonicalBookId, 1);
		assert.equal(ref.verseStart, 1);
		assert.equal(ref.verseEnd, 3);
		assert.equal(ref.versionAbbr, "ESV");
	});

	it("parses chapter-only isolated strings as verse 1", () => {
		const ref = parseSingleReference("Sl 23");
		assert.ok(ref);
		assert.equal(ref.canonicalBookId, 19);
		assert.equal(ref.chapter, 23);
		assert.equal(ref.verseStart, 1);
	});

	it("rejects unknown books and out-of-range chapters", () => {
		assert.equal(parseSingleReference("Foo 1:1"), null);
		assert.equal(parseSingleReference("Gênesis 99:1"), null);
		assert.equal(parseSingleReference(""), null);
	});

	it("parses accented Portuguese book names", () => {
		const exodo = parseSingleReference("Êxodo 1:1");
		assert.ok(exodo, "Êxodo 1:1 should be recognized");
		assert.equal(exodo.canonicalBookId, 2);

		const numeros = parseSingleReference("Números 14:23");
		assert.ok(numeros, "Números 14:23 should be recognized");
		assert.equal(numeros.canonicalBookId, 4);

		const isaias = parseSingleReference("Isaías 6:1");
		assert.ok(isaias, "Isaías 6:1 should be recognized");
		assert.equal(isaias.canonicalBookId, 23);

		const joao = parseSingleReference("João 3:16");
		assert.ok(joao, "João 3:16 should be recognized");
		assert.equal(joao.canonicalBookId, 43);

		const corintios = parseSingleReference("1 Coríntios 13:4");
		assert.ok(corintios, "1 Coríntios 13:4 should be recognized");
		assert.equal(corintios.canonicalBookId, 46);
	});
});

describe("findAllReferencesInText", () => {
	it("finds chapter-only references like Mateus 10 and Sl 23", () => {
		const refs = findAllReferencesInText("Veja Mateus 10 e depois Sl 23 para edificar.");
		assert.equal(refs.length, 2);
		assert.equal(refs[0].canonicalBookId, 40);
		assert.equal(refs[0].chapter, 10);
		assert.equal(refs[0].verseStart, 1);
		assert.equal(refs[0].isChapterOnly, true);
		assert.equal(refs[0].raw, "Mateus 10");

		assert.equal(refs[1].canonicalBookId, 19);
		assert.equal(refs[1].chapter, 23);
		assert.equal(refs[1].verseStart, 1);
		assert.equal(refs[1].isChapterOnly, true);
		assert.equal(refs[1].raw, "Sl 23");
	});

	it("finds mixed chapter-only and verse references in running text", () => {
		const refs = findAllReferencesInText("See João 3:16 and Mt 5:1-12 NVT, also Sl 23 here.");
		assert.equal(refs.length, 3);
		assert.equal(refs[0].canonicalBookId, 43);
		assert.equal(refs[0].verseStart, 16);
		assert.equal(refs[0].isChapterOnly, false);

		assert.equal(refs[1].canonicalBookId, 40);
		assert.equal(refs[1].verseStart, 1);
		assert.equal(refs[1].verseEnd, 12);
		assert.equal(refs[1].versionAbbr, "NVT");
		assert.equal(refs[1].isChapterOnly, false);

		assert.equal(refs[2].canonicalBookId, 19);
		assert.equal(refs[2].chapter, 23);
		assert.equal(refs[2].isChapterOnly, true);
		assert.equal(refs[2].raw, "Sl 23");
	});

	it("finds chapter reference with version suffix", () => {
		const refs = findAllReferencesInText("Leia Mateus 10 ARA com atenção.");
		assert.equal(refs.length, 1);
		assert.equal(refs[0].canonicalBookId, 40);
		assert.equal(refs[0].chapter, 10);
		assert.equal(refs[0].versionAbbr, "ARA");
		assert.equal(refs[0].raw, "Mateus 10 ARA");
		assert.equal(refs[0].isChapterOnly, true);
	});

	it("does not consume an unknown trailing word as version and correctly rewinds", () => {
		const refs = findAllReferencesInText("Jo 3:16 Hello and Mateus 10 Jo 3:16");
		assert.equal(refs.length, 3);
		assert.equal(refs[0].raw, "Jo 3:16");
		assert.equal(refs[0].versionAbbr, undefined);

		assert.equal(refs[1].raw, "Mateus 10");
		assert.equal(refs[1].chapter, 10);
		assert.equal(refs[1].isChapterOnly, true);

		assert.equal(refs[2].raw, "Jo 3:16");
		assert.equal(refs[2].verseStart, 16);
	});

	it("finds references with accented book names in running text", () => {
		const refs = findAllReferencesInText("Leia Êxodo 20 e Números 6:24-26, também Isaías 6.");
		assert.equal(refs.length, 3, "Should find Êxodo 20, Números 6:24-26, and Isaías 6");
		assert.equal(refs[0].canonicalBookId, 2);
		assert.equal(refs[0].chapter, 20);
		assert.equal(refs[0].isChapterOnly, true);

		assert.equal(refs[1].canonicalBookId, 4);
		assert.equal(refs[1].chapter, 6);
		assert.equal(refs[1].verseStart, 24);
		assert.equal(refs[1].verseEnd, 26);
		assert.equal(refs[1].isChapterOnly, false);

		assert.equal(refs[2].canonicalBookId, 23);
		assert.equal(refs[2].chapter, 6);
		assert.equal(refs[2].isChapterOnly, true);
	});

	it("does not match chapters beyond book bounds", () => {
		const refs = findAllReferencesInText("Veja Mateus 50 e Judas 5");
		assert.equal(refs.length, 0);
	});

	it("does not match across newlines", () => {
		const refs = findAllReferencesInText("João\n3:16");
		assert.equal(refs.length, 0);
	});
});

describe("findReferenceAtPosition", () => {
	it("returns the reference covering the caret", () => {
		const text = "Prefix Jo 3:16 suffix";
		const ref = findReferenceAtPosition(text, text.indexOf("3"));
		assert.ok(ref);
		assert.equal(ref.raw, "Jo 3:16");
		assert.equal(findReferenceAtPosition(text, 0), null);
	});
});
