import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { BibleCanvasService, type VerseCanvasExportParams } from "./BibleCanvasService";

describe("BibleCanvasService", () => {
	const mockService = new BibleCanvasService(
		{} as any,
		() => ({ dataFolder: "OpenBible", canvasExportFolder: "OpenBible/canvas" } as any),
	);

	test("buildJsonCanvas creates valid JSON Canvas 1.0 for single verse selection", () => {
		const params: VerseCanvasExportParams = {
			book: { id: 43, name: "João" } as any,
			chapter: 3,
			verses: [{ number: 16, text: "Porque Deus amou o mundo..." }],
			versionAbbr: "ARA",
		};

		const canvas = mockService.buildJsonCanvas(params);

		assert.ok(Array.isArray(canvas.nodes), "nodes must be an array");
		assert.ok(Array.isArray(canvas.edges), "edges must be an array");

		// Header + Verse + Analysis + Application + References = 5 nodes
		assert.equal(canvas.nodes.length, 5);
		assert.equal(canvas.edges.length, 4);

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

		for (const edge of canvas.edges) {
			assert.equal(typeof edge.id, "string");
			assert.equal(edge.id.length, 16);
			assert.equal(edge.toEnd, "arrow");
		}

		const headerNode = canvas.nodes.find((n) => n.text?.includes("João 3:16"));
		assert.ok(headerNode, "Header node must contain reference");

		const verseNode = canvas.nodes.find((n) => n.text?.includes("Porque Deus amou"));
		assert.ok(verseNode, "Verse node must contain scripture text");
	});

	test("buildJsonCanvas creates multi-verse branching layout for 2 to 6 verses", () => {
		const params: VerseCanvasExportParams = {
			book: { id: 45, name: "Romanos" } as any,
			chapter: 10,
			verses: [
				{ number: 2, text: "Porque lhes dou testemunho..." },
				{ number: 3, text: "Porquanto, desconhecendo a justiça..." },
			],
			versionAbbr: "ARA",
		};

		const canvas = mockService.buildJsonCanvas(params);

		// Header + 2 verse nodes + 2 notes nodes = 5 nodes
		assert.equal(canvas.nodes.length, 5);
		// 2 edges from header to verses + 2 edges from verses to notes = 4 edges
		assert.equal(canvas.edges.length, 4);

		const v2Node = canvas.nodes.find((n) => n.text?.includes("Versículo 2"));
		const v3Node = canvas.nodes.find((n) => n.text?.includes("Versículo 3"));
		assert.ok(v2Node, "Verse 2 card must exist");
		assert.ok(v3Node, "Verse 3 card must exist");

		// Header connects to both verses
		const headerNode = canvas.nodes.find((n) => n.text?.includes("Romanos 10:2-3"));
		assert.ok(headerNode, "Header node must contain reference range");

		const headerEdges = canvas.edges.filter((e) => e.fromNode === headerNode?.id);
		assert.equal(headerEdges.length, 2);
	});

	test("buildJsonCanvas formats highlighted snippet selection with focus card", () => {
		const params: VerseCanvasExportParams = {
			book: { id: 45, name: "Romanos" } as any,
			chapter: 10,
			verses: [{ number: 2, text: "Porque lhes dou testemunho de que eles têm zelo por Deus, porém não com entendimento." }],
			versionAbbr: "ARA",
			selectedSnippet: "zelo por Deus, porém não com entendimento",
		};

		const canvas = mockService.buildJsonCanvas(params);

		const snippetNode = canvas.nodes.find((n) => n.text?.includes("Trecho em Foco"));
		assert.ok(snippetNode, "Snippet node must exist");
		assert.ok(snippetNode?.text?.includes("zelo por Deus, porém não com entendimento"));

		const contextNode = canvas.nodes.find((n) => n.text?.includes("Contexto do Versículo"));
		assert.ok(contextNode, "Context node must exist");
	});

	test("buildJsonCanvas consolidates large passages (> 6 verses) into passage card", () => {
		const verses = Array.from({ length: 8 }, (_, i) => ({
			number: i + 1,
			text: `Versículo número ${i + 1} com conteúdo explicativo longo.`,
		}));

		const params: VerseCanvasExportParams = {
			book: { id: 19, name: "Salmos" } as any,
			chapter: 119,
			verses,
			versionAbbr: "NVI",
		};

		const canvas = mockService.buildJsonCanvas(params);

		const passageNode = canvas.nodes.find((n) => n.text?.includes("### Texto Bíblico"));
		assert.ok(passageNode, "Consolidated passage node must exist");
		assert.ok(passageNode?.text?.includes("**1.** Versículo número 1"));
		assert.ok(passageNode?.text?.includes("**8.** Versículo número 8"));
	});

	test("exportToExcalidrawFile returns false gracefully when Excalidraw plugin is absent", async () => {
		const params: VerseCanvasExportParams = {
			book: { id: 43, name: "João" } as any,
			chapter: 14,
			verses: [{ number: 6, text: "Eu sou o caminho, a verdade e a vida." }],
		};

		const result = await mockService.exportToExcalidrawFile(params);
		assert.equal(result, false, "Must return false when ExcalidrawAutomate is not available");
	});
});
