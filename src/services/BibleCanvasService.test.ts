import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
	BibleCanvasService,
	DEFAULT_CANVAS_TEMPLATES,
	type CanvasStudyTemplate,
	type VerseCanvasExportParams,
} from "./BibleCanvasService";

describe("BibleCanvasService", () => {
	const mockService = new BibleCanvasService(
		{} as any,
		() => ({ dataFolder: "OpenBible", canvasExportFolder: "OpenBible/canvas", canvasTemplatesFolder: "Templates/Canvas" } as any),
	);

	test("buildJsonCanvas creates valid JSON Canvas 1.0 for single verse selection with unified block", () => {
		const params: VerseCanvasExportParams = {
			book: { id: 43, name: "João" } as any,
			chapter: 3,
			verses: [{ number: 16, text: "Porque Deus amou o mundo..." }],
			versionAbbr: "ARA",
		};

		const canvas = mockService.buildJsonCanvas(params);

		assert.ok(Array.isArray(canvas.nodes), "nodes must be an array");
		assert.ok(Array.isArray(canvas.edges), "edges must be an array");

		// Header (1) + Unified Scripture Node (1) + Default Template Sections (3) = 5 nodes
		assert.equal(canvas.nodes.length, 5);
		// Header -> Scripture (1) + Scripture -> 3 Sections (3) = 4 edges
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

		const scriptureNode = canvas.nodes.find((n) => n.text?.includes("Texto Bíblico"));
		assert.ok(scriptureNode, "Scripture node must contain scripture header");
		assert.ok(scriptureNode?.text?.includes("Porque Deus amou o mundo"));
	});

	test("buildJsonCanvas places multiple verses in ONE SINGLE UNIFIED scripture block (never split into separate verse cards)", () => {
		const params: VerseCanvasExportParams = {
			book: { id: 45, name: "Romanos" } as any,
			chapter: 10,
			verses: [
				{ number: 2, text: "Porque lhes dou testemunho de que eles têm zelo por Deus..." },
				{ number: 3, text: "Porquanto, desconhecendo a justiça de Deus..." },
			],
			versionAbbr: "ARA",
		};

		const canvas = mockService.buildJsonCanvas(params);

		// Header + 1 Unified Scripture Node + 3 Template Companion Sections = 5 nodes
		assert.equal(canvas.nodes.length, 5);

		// Verify there are NO separate verse cards
		const verse2IndividualCard = canvas.nodes.find((n) => n.text?.startsWith("### Versículo 2"));
		const verse3IndividualCard = canvas.nodes.find((n) => n.text?.startsWith("### Versículo 3"));
		assert.equal(verse2IndividualCard, undefined, "Must not create separate card for verse 2");
		assert.equal(verse3IndividualCard, undefined, "Must not create separate card for verse 3");

		// Locate the single unified scripture node
		const scriptureNode = canvas.nodes.find((n) => n.text?.includes("Texto Bíblico"));
		assert.ok(scriptureNode, "A single unified scripture card must exist");
		assert.ok(scriptureNode?.text?.includes("² Porque lhes dou testemunho"));
		assert.ok(scriptureNode?.text?.includes("³ Porquanto, desconhecendo a justiça"));

		// Header connects to the single unified scripture card
		const headerNode = canvas.nodes.find((n) => n.text?.includes("Romanos 10:2-3"));
		assert.ok(headerNode, "Header node must contain reference range");

		const edgeHeaderToScripture = canvas.edges.find(
			(e) => e.fromNode === headerNode?.id && e.toNode === scriptureNode?.id,
		);
		assert.ok(edgeHeaderToScripture, "Edge must connect Header to the single Scripture node");

		// Arrows fan out from the single unified scripture card to each template section
		const edgesFromScripture = canvas.edges.filter((e) => e.fromNode === scriptureNode?.id);
		assert.equal(edgesFromScripture.length, 3, "Scripture card connects to 3 template sections");
	});

	test("buildJsonCanvas formats highlighted snippet selection inside the single scripture card", () => {
		const params: VerseCanvasExportParams = {
			book: { id: 45, name: "Romanos" } as any,
			chapter: 10,
			verses: [{ number: 2, text: "Porque lhes dou testemunho de que eles têm zelo por Deus, porém não com entendimento." }],
			versionAbbr: "ARA",
			selectedSnippet: "zelo por Deus, porém não com entendimento",
		};

		const canvas = mockService.buildJsonCanvas(params);

		const scriptureNode = canvas.nodes.find((n) => n.text?.includes("Texto Bíblico"));
		assert.ok(scriptureNode, "Scripture node must exist");
		assert.ok(scriptureNode?.text?.includes('> "zelo por Deus, porém não com entendimento"'));
		assert.ok(scriptureNode?.text?.includes("² Porque lhes dou testemunho"));
	});

	test("buildJsonCanvas applies selected study template structure", () => {
		const devotionalTemplate: CanvasStudyTemplate = {
			id: "custom_devotional",
			title: "Devocional Personalizado",
			description: "Modelo focado em oração e aplicação pessoal.",
			icon: "heart",
			color: "4",
			sections: [
				{
					title: "O que Deus me ensina",
					placeholder: "• Lição espiritual:",
					color: "4",
					bgHex: "#f0fdf4",
					borderHex: "#16a34a",
				},
				{
					title: "Oração",
					placeholder: "• Senhor...",
					color: "3",
					bgHex: "#fefce8",
					borderHex: "#ca8a04",
				},
			],
		};

		const params: VerseCanvasExportParams = {
			book: { id: 23, name: "Isaías" } as any,
			chapter: 40,
			verses: [{ number: 31, text: "Mas os que esperam no SENHOR renovam as suas forças..." }],
			versionAbbr: "ARA",
		};

		const canvas = mockService.buildJsonCanvas(params, devotionalTemplate);

		// Header (1) + Scripture (1) + 2 custom sections = 4 nodes
		assert.equal(canvas.nodes.length, 4);
		assert.equal(canvas.edges.length, 3);

		const headerNode = canvas.nodes.find((n) => n.text?.includes("Devocional Personalizado"));
		assert.ok(headerNode, "Header node must reference the custom template title");

		const lessonSection = canvas.nodes.find((n) => n.text?.includes("O que Deus me ensina"));
		const prayerSection = canvas.nodes.find((n) => n.text?.includes("Oração"));
		assert.ok(lessonSection, "Lesson section must exist");
		assert.ok(prayerSection, "Prayer section must exist");
	});

	test("parseMarkdownTemplate parses user-defined markdown template file", () => {
		const mdContent = `# Meu Modelo Hermenêutico
Análise aprofundada de passagens narrativas e epistolares.

### Palavras no Original
• Léxico grego/hebraico:
• Nuances etimológicas:

### Contexto Histórico
• Autor e destinatários:
• Situação cultural:
`;

		const parsed = mockService.parseMarkdownTemplate("Templates/Canvas/Hermenêutica.md", mdContent);

		assert.ok(parsed, "Should parse markdown into template");
		assert.equal(parsed?.title, "Meu Modelo Hermenêutico");
		assert.equal(parsed?.description, "Análise aprofundada de passagens narrativas e epistolares.");
		assert.equal(parsed?.sections.length, 2);
		assert.equal(parsed?.sections[0].title, "Palavras no Original");
		assert.ok(parsed?.sections[0].placeholder.includes("Léxico grego/hebraico"));
		assert.equal(parsed?.sections[1].title, "Contexto Histórico");
	});

	test("DEFAULT_CANVAS_TEMPLATES includes rich built-in templates", () => {
		assert.ok(DEFAULT_CANVAS_TEMPLATES.length >= 5);
		const ids = DEFAULT_CANVAS_TEMPLATES.map((t) => t.id);
		assert.ok(ids.includes("text_analysis"));
		assert.ok(ids.includes("devotional"));
		assert.ok(ids.includes("mind_map"));
		assert.ok(ids.includes("inductive"));
		assert.ok(ids.includes("sermon_outline"));
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
