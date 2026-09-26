import test, { describe } from "node:test";
import assert from "node:assert/strict";
import { generateCanvasId, BibleComparisonService } from "./BibleComparisonService";
import type { PassageComparisonData } from "../models/comparison";

describe("BibleComparisonService", () => {
	test("generateCanvasId generates unique 16-character hex strings", () => {
		const id1 = generateCanvasId();
		const id2 = generateCanvasId();

		assert.equal(id1.length, 16);
		assert.equal(id2.length, 16);
		assert.match(id1, /^[0-9a-f]{16}$/);
		assert.match(id2, /^[0-9a-f]{16}$/);
		assert.notEqual(id1, id2);
	});

	test("buildJsonCanvas creates valid JSON Canvas 1.0 structure", () => {
		// Mock mockApp & services
		const mockService = new BibleComparisonService(
			{} as any,
			{} as any,
			{} as any,
			() => ({ dataFolder: "OpenBible" } as any),
		);

		const sampleData: PassageComparisonData = {
			bookId: 43,
			bookName: "João",
			chapter: 3,
			verseNumbers: [16],
			reference: "João 3:16",
			versions: [
				{
					versionId: "arc.sqlite",
					versionName: "Almeida Revista e Corrigida",
					versionAbbr: "ARC",
					verses: [{ number: 16, text: "Porque Deus amou o mundo..." }],
					fullText: "¹⁶ Porque Deus amou o mundo...",
				},
				{
					versionId: "nvi.sqlite",
					versionName: "Nova Versão Internacional",
					versionAbbr: "NVI",
					verses: [{ number: 16, text: "Porque Deus tanto amou o mundo..." }],
					fullText: "¹⁶ Porque Deus tanto amou o mundo...",
				},
			],
			rows: [
				{
					verseNumber: 16,
					versions: [
						{
							versionId: "arc.sqlite",
							versionAbbr: "ARC",
							versionName: "Almeida Revista e Corrigida",
							text: "Porque Deus amou o mundo...",
						},
						{
							versionId: "nvi.sqlite",
							versionAbbr: "NVI",
							versionName: "Nova Versão Internacional",
							text: "Porque Deus tanto amou o mundo...",
						},
					],
				},
			],
		};

		const canvas = mockService.buildJsonCanvas(sampleData);

		// Assert JSON Canvas 1.0 top-level arrays
		assert.ok(Array.isArray(canvas.nodes), "nodes must be an array");
		assert.ok(Array.isArray(canvas.edges), "edges must be an array");

		// Header + 2 version nodes = 3 nodes
		assert.equal(canvas.nodes.length, 3);
		// 2 edges connecting header to each version
		assert.equal(canvas.edges.length, 2);

		// Check node properties
		for (const node of canvas.nodes) {
			assert.equal(typeof node.id, "string");
			assert.equal(node.id.length, 16);
			assert.equal(node.type, "text");
			assert.equal(typeof node.x, "number");
			assert.equal(typeof node.y, "number");
			assert.equal(typeof node.width, "number");
			assert.equal(typeof node.height, "number");
			assert.ok(node.text && node.text.length > 0);
		}

		// Check edge connections
		const nodeIds = new Set(canvas.nodes.map((n) => n.id));
		for (const edge of canvas.edges) {
			assert.equal(typeof edge.id, "string");
			assert.equal(edge.id.length, 16);
			assert.ok(nodeIds.has(edge.fromNode), "fromNode must exist in nodes");
			assert.ok(nodeIds.has(edge.toNode), "toNode must exist in nodes");
			assert.equal(edge.toEnd, "arrow");
		}
	});

	test("formatMarkdownComparison formats columns and verses properly", () => {
		const mockService = new BibleComparisonService(
			{} as any,
			{} as any,
			{} as any,
			() => ({ dataFolder: "OpenBible" } as any),
		);

		const sampleData: PassageComparisonData = {
			bookId: 19,
			bookName: "Salmos",
			chapter: 23,
			verseNumbers: [1, 2],
			reference: "Salmos 23:1-2",
			versions: [
				{
					versionId: "arc.sqlite",
					versionName: "Almeida Revista e Corrigida",
					versionAbbr: "ARC",
					verses: [
						{ number: 1, text: "O Senhor é o meu pastor..." },
						{ number: 2, text: "Deitar-me faz em verdes pastos..." },
					],
					fullText: "¹ O Senhor... ² Deitar-me...",
				},
				{
					versionId: "nvi.sqlite",
					versionName: "Nova Versão Internacional",
					versionAbbr: "NVI",
					verses: [
						{ number: 1, text: "O Senhor é o meu pastor..." },
						{ number: 2, text: "Em verdes pastagens me faz repousar..." },
					],
					fullText: "¹ O Senhor... ² Em verdes...",
				},
			],
			rows: [
				{
					verseNumber: 1,
					versions: [
						{ versionId: "arc.sqlite", versionAbbr: "ARC", versionName: "ARC", text: "O Senhor é o meu pastor..." },
						{ versionId: "nvi.sqlite", versionAbbr: "NVI", versionName: "NVI", text: "O Senhor é o meu pastor..." },
					],
				},
				{
					verseNumber: 2,
					versions: [
						{ versionId: "arc.sqlite", versionAbbr: "ARC", versionName: "ARC", text: "Deitar-me faz em verdes pastos..." },
						{ versionId: "nvi.sqlite", versionAbbr: "NVI", versionName: "NVI", text: "Em verdes pastagens me faz repousar..." },
					],
				},
			],
		};

		// Columns format
		const markdownCols = mockService.formatMarkdownComparison(sampleData, "columns");
		assert.ok(markdownCols.includes("Salmos 23:1-2"));
		assert.ok(markdownCols.includes("### ARC — Almeida Revista e Corrigida"));
		assert.ok(markdownCols.includes("### NVI — Nova Versão Internacional"));

		// Verses format
		const markdownVerses = mockService.formatMarkdownComparison(sampleData, "verses");
		assert.ok(markdownVerses.includes("### Versículo 1"));
		assert.ok(markdownVerses.includes("### Versículo 2"));
		assert.ok(markdownVerses.includes("- **ARC** (ARC): Deitar-me faz em verdes pastos..."));
		assert.ok(markdownVerses.includes("- **NVI** (NVI): Em verdes pastagens me faz repousar..."));
	});

	test("formatVerseRowMarkdown formats a single verse comparison across versions", () => {
		const mockService = new BibleComparisonService(
			{} as any,
			{} as any,
			{} as any,
			() => ({ dataFolder: "OpenBible" } as any),
		);

		const sampleData: PassageComparisonData = {
			bookId: 43,
			bookName: "João",
			chapter: 3,
			verseNumbers: [16],
			reference: "João 3:16",
			versions: [],
			rows: [
				{
					verseNumber: 16,
					versions: [
						{ versionId: "arc.sqlite", versionAbbr: "ARC", versionName: "Almeida Revista e Corrigida", text: "Porque Deus amou o mundo..." },
						{ versionId: "nvi.sqlite", versionAbbr: "NVI", versionName: "Nova Versão Internacional", text: "Porque Deus tanto amou o mundo..." },
					],
				},
			],
		};

		const formatted = mockService.formatVerseRowMarkdown(sampleData, sampleData.rows[0]);
		assert.ok(formatted.includes("### João 3:16"));
		assert.ok(formatted.includes("- **ARC** (Almeida Revista e Corrigida): Porque Deus amou o mundo..."));
		assert.ok(formatted.includes("- **NVI** (Nova Versão Internacional): Porque Deus tanto amou o mundo..."));
	});

	test("formatSingleBlockComparison produces unified single-block text without '>' or blank lines for Excalidraw", () => {
		const mockService = new BibleComparisonService(
			{} as any,
			{} as any,
			{} as any,
			() => ({ dataFolder: "OpenBible" } as any),
		);

		const sampleData: PassageComparisonData = {
			bookId: 43,
			bookName: "João",
			chapter: 14,
			verseNumbers: [2, 3],
			reference: "João 14:2-3",
			versions: [
				{
					versionId: "acf.sqlite",
					versionName: "Almeida Corrigida Fiel",
					versionAbbr: "ACF",
					verses: [
						{ number: 2, text: "Na casa de meu Pai há muitas moradas..." },
						{ number: 3, text: "E quando eu for..." },
					],
					fullText: "² Na casa de meu Pai... ³ E quando eu for...",
				},
				{
					versionId: "ara.sqlite",
					versionName: "Almeida Revista e Atualizada",
					versionAbbr: "ARA",
					verses: [
						{ number: 2, text: "Na casa de meu Pai há muitas moradas." },
						{ number: 3, text: "E, quando eu for..." },
					],
					fullText: "² Na casa de meu Pai... ³ E, quando eu for...",
				},
			],
			rows: [],
		};

		const formatted = mockService.formatSingleBlockComparison(sampleData);
		// Must not contain markdown quote '>'
		assert.ok(!formatted.includes(">"));
		// Must not contain double newline paragraphs that break in Excalidraw
		assert.ok(!formatted.includes("\n\n"));
		// Verses 2 and 3 must be grouped per version with line breaks per verse
		assert.ok(formatted.includes("João 14:2-3 — Comparação de Versões"));
		assert.ok(formatted.includes("ACF:\n² Na casa de meu Pai há muitas moradas...\n³ E quando eu for..."));
		assert.ok(formatted.includes("ARA:\n² Na casa de meu Pai há muitas moradas.\n³ E, quando eu for..."));
	});

	test("formatVersionPassage formats single version as unified single block with verse line breaks without '>'", () => {
		const mockService = new BibleComparisonService(
			{} as any,
			{} as any,
			{} as any,
			() => ({ dataFolder: "OpenBible" } as any),
		);

		const sampleData: PassageComparisonData = {
			bookId: 43,
			bookName: "João",
			chapter: 14,
			verseNumbers: [2, 3],
			reference: "João 14:2-3",
			versions: [],
			rows: [],
		};

		const versionItem = {
			versionId: "acf.sqlite",
			versionName: "Almeida Corrigida Fiel",
			versionAbbr: "ACF",
			verses: [
				{ number: 2, text: "Na casa de meu Pai há muitas moradas; se não fosse assim, eu vo-lo teria dito." },
				{ number: 3, text: "E quando eu for, virei outra vez." },
			],
			fullText: "",
		};

		const formatted = mockService.formatVersionPassage(sampleData, versionItem);
		assert.ok(!formatted.includes(">"));
		assert.ok(!formatted.includes("\n\n"));
		assert.equal(
			formatted,
			"² Na casa de meu Pai há muitas moradas; se não fosse assim, eu vo-lo teria dito.\n³ E quando eu for, virei outra vez.\n— João 14:2-3 (ACF)"
		);
	});
});
