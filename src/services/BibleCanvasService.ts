import type { App, TFile } from "obsidian";
import type { BibleBook, BibleVerse } from "../models/bible";
import type { CanvasEdge, CanvasNode, JsonCanvasData } from "../models/comparison";
import type { OpenBibleSettings } from "../settings";
import { formatReference, formatVerseRange, toSuperscript } from "./verseFormat";
import { generateCanvasId } from "./BibleComparisonService";

export interface VerseCanvasExportParams {
	book: BibleBook;
	chapter: number;
	verses: BibleVerse[];
	versionAbbr?: string;
	versionName?: string;
	selectedSnippet?: string;
}

function normalizeFilePath(path: string): string {
	return path.replace(/\\/g, "/").replace(/\/+/g, "/").replace(/^\/+/, "");
}

export class BibleCanvasService {
	constructor(
		private readonly app: App,
		private readonly getSettings: () => OpenBibleSettings,
	) {}

	/**
	 * Builds a structured JSON Canvas 1.0 document for the given verse selection.
	 * Designed for mind mapping, analysis, theological study, and reflection.
	 */
	buildJsonCanvas(params: VerseCanvasExportParams): JsonCanvasData {
		const nodes: CanvasNode[] = [];
		const edges: CanvasEdge[] = [];

		const sortedVerses = [...params.verses].sort((a, b) => a.number - b.number);
		const verseNumbers = sortedVerses.map((v) => v.number);
		const reference = formatReference(params.book.name, params.chapter, verseNumbers, params.versionAbbr);

		const headerId = generateCanvasId();
		const colorPresets = ["1", "2", "3", "5", "6"]; // Red, Orange, Yellow, Cyan, Purple

		if (params.selectedSnippet) {
			// Layout with focused text snippet
			const headerWidth = 480;
			const headerHeight = 120;
			nodes.push({
				id: headerId,
				type: "text",
				x: 0,
				y: 0,
				width: headerWidth,
				height: headerHeight,
				color: "4", // Green
				text: `# ${reference}\n\n*Estudo & Mapeamento de Trecho*`,
			});

			const snippetId = generateCanvasId();
			nodes.push({
				id: snippetId,
				type: "text",
				x: 0,
				y: 180,
				width: 440,
				height: 160,
				color: "3", // Yellow
				text: `### Trecho em Foco\n\n> "${params.selectedSnippet}"\n\n— *${reference}*`,
			});

			const contextId = generateCanvasId();
			const versesText = sortedVerses.map((v) => `${toSuperscript(v.number)} ${v.text}`).join("\n\n");
			nodes.push({
				id: contextId,
				type: "text",
				x: 480,
				y: 180,
				width: 460,
				height: 200,
				color: "5", // Cyan
				text: `### Contexto do Versículo\n\n${versesText}`,
			});

			const analysisId = generateCanvasId();
			nodes.push({
				id: analysisId,
				type: "text",
				x: 0,
				y: 400,
				width: 440,
				height: 220,
				color: "6", // Purple
				text: `### Análise & Observações\n\n- **Significado central:**\n- **Palavras-chave no original:**\n- **Contexto da passagem:**\n- **Aplicação prática:**`,
			});

			const notesId = generateCanvasId();
			nodes.push({
				id: notesId,
				type: "text",
				x: 480,
				y: 400,
				width: 460,
				height: 220,
				color: "2", // Orange
				text: `### Conexões & Referências Cruzadas\n\n- [[ ]]\n- `,
			});

			edges.push(
				{ id: generateCanvasId(), fromNode: headerId, fromSide: "bottom", toNode: snippetId, toSide: "top", toEnd: "arrow" },
				{ id: generateCanvasId(), fromNode: snippetId, fromSide: "right", toNode: contextId, toSide: "left", toEnd: "arrow" },
				{ id: generateCanvasId(), fromNode: snippetId, fromSide: "bottom", toNode: analysisId, toSide: "top", toEnd: "arrow" },
				{ id: generateCanvasId(), fromNode: contextId, fromSide: "bottom", toNode: notesId, toSide: "top", toEnd: "arrow" },
			);
		} else if (sortedVerses.length <= 1) {
			// Single verse layout: Central header + Verse card + Analysis + Application + Cross-references
			const headerWidth = 480;
			const headerHeight = 120;
			nodes.push({
				id: headerId,
				type: "text",
				x: 0,
				y: 0,
				width: headerWidth,
				height: headerHeight,
				color: "4", // Green
				text: `# ${reference}\n\n*Estudo & Mapa Visual*`,
			});

			const verseId = generateCanvasId();
			const verse = sortedVerses[0] || { number: 1, text: "" };
			nodes.push({
				id: verseId,
				type: "text",
				x: 0,
				y: 180,
				width: 440,
				height: 180,
				color: "5", // Cyan
				text: `### Texto Bíblico\n\n${toSuperscript(verse.number)} ${verse.text}`,
			});

			const analysisId = generateCanvasId();
			nodes.push({
				id: analysisId,
				type: "text",
				x: 480,
				y: 180,
				width: 440,
				height: 200,
				color: "6", // Purple
				text: `### Análise & Observações\n\n- **Tema central:**\n- **Palavras-chave:**\n- **Contexto histórico/cultural:**`,
			});

			const appId = generateCanvasId();
			nodes.push({
				id: appId,
				type: "text",
				x: 0,
				y: 420,
				width: 440,
				height: 190,
				color: "3", // Yellow
				text: `### Aplicação Prática\n\n- **Como viver este princípio?**\n- **Ações e compromissos:**\n- **Motivos de oração:**`,
			});

			const refsId = generateCanvasId();
			nodes.push({
				id: refsId,
				type: "text",
				x: 480,
				y: 420,
				width: 440,
				height: 190,
				color: "2", // Orange
				text: `### Conexões & Referências Cruzadas\n\n- [[ ]]\n- `,
			});

			edges.push(
				{ id: generateCanvasId(), fromNode: headerId, fromSide: "bottom", toNode: verseId, toSide: "top", toEnd: "arrow" },
				{ id: generateCanvasId(), fromNode: verseId, fromSide: "right", toNode: analysisId, toSide: "left", toEnd: "arrow" },
				{ id: generateCanvasId(), fromNode: verseId, fromSide: "bottom", toNode: appId, toSide: "top", toEnd: "arrow" },
				{ id: generateCanvasId(), fromNode: analysisId, fromSide: "bottom", toNode: refsId, toSide: "top", toEnd: "arrow" },
			);
		} else if (sortedVerses.length <= 6) {
			// Multi-verse branch layout (2 to 6 verses):
			// Each verse gets a top branch card, with an analysis note block directly underneath it!
			const cardWidth = 360;
			const cardGap = 40;
			const totalWidth = sortedVerses.length * (cardWidth + cardGap) - cardGap;
			const headerWidth = Math.min(totalWidth, 520);
			const headerX = Math.round((totalWidth - headerWidth) / 2);

			nodes.push({
				id: headerId,
				type: "text",
				x: headerX,
				y: 0,
				width: headerWidth,
				height: 120,
				color: "4", // Green
				text: `# ${reference}\n\n*Estudo & Mapa de Versículos*`,
			});

			sortedVerses.forEach((v, index) => {
				const cardX = index * (cardWidth + cardGap);
				const verseCardId = generateCanvasId();
				const estimatedHeight = Math.max(160, 90 + Math.ceil(v.text.length / 32) * 22);

				nodes.push({
					id: verseCardId,
					type: "text",
					x: cardX,
					y: 180,
					width: cardWidth,
					height: estimatedHeight,
					color: colorPresets[index % colorPresets.length],
					text: `### Versículo ${v.number}\n\n${toSuperscript(v.number)} ${v.text}`,
				});

				edges.push({
					id: generateCanvasId(),
					fromNode: headerId,
					fromSide: "bottom",
					toNode: verseCardId,
					toSide: "top",
					toEnd: "arrow",
				});

				const notesCardId = generateCanvasId();
				nodes.push({
					id: notesCardId,
					type: "text",
					x: cardX,
					y: 180 + estimatedHeight + 40,
					width: cardWidth,
					height: 180,
					color: "3", // Yellow
					text: `#### Anotações — v. ${v.number}\n\n- **Ideia-chave:**\n- **Conexões & Aplicação:**`,
				});

				edges.push({
					id: generateCanvasId(),
					fromNode: verseCardId,
					fromSide: "bottom",
					toNode: notesCardId,
					toSide: "top",
					toEnd: "arrow",
				});
			});
		} else {
			// Large passage layout (> 6 verses):
			// Consolidated passage card + dedicated study cards
			nodes.push({
				id: headerId,
				type: "text",
				x: 0,
				y: 0,
				width: 520,
				height: 120,
				color: "4", // Green
				text: `# ${reference}\n\n*Estudo & Panorama de Passagem*`,
			});

			const passageId = generateCanvasId();
			const passageBody = sortedVerses.map((v) => `**${v.number}.** ${v.text}`).join("\n\n");
			nodes.push({
				id: passageId,
				type: "text",
				x: 0,
				y: 180,
				width: 520,
				height: Math.min(600, Math.max(260, 80 + sortedVerses.length * 40)),
				color: "5", // Cyan
				text: `### Texto Bíblico\n\n${passageBody}`,
			});

			const themesId = generateCanvasId();
			nodes.push({
				id: themesId,
				type: "text",
				x: 560,
				y: 180,
				width: 440,
				height: 220,
				color: "6", // Purple
				text: `### Temas & Estrutura\n\n- **Estrutura da passagem:**\n- **Temas principais:**\n- **Personagens / Locais:**`,
			});

			const notesId = generateCanvasId();
			nodes.push({
				id: notesId,
				type: "text",
				x: 560,
				y: 440,
				width: 440,
				height: 240,
				color: "3", // Yellow
				text: `### Reflexão & Aplicação\n\n- **O que aprendemos sobre Deus?**\n- **O que aprendemos sobre a humanidade?**\n- **Como responder:**`,
			});

			edges.push(
				{ id: generateCanvasId(), fromNode: headerId, fromSide: "bottom", toNode: passageId, toSide: "top", toEnd: "arrow" },
				{ id: generateCanvasId(), fromNode: passageId, fromSide: "right", toNode: themesId, toSide: "left", toEnd: "arrow" },
				{ id: generateCanvasId(), fromNode: themesId, fromSide: "bottom", toNode: notesId, toSide: "top", toEnd: "arrow" },
			);
		}

		return { nodes, edges };
	}

	/**
	 * Creates a .canvas file inside the vault and opens it in a new workspace tab.
	 */
	async exportToCanvasFile(params: VerseCanvasExportParams): Promise<TFile> {
		const configured =
			this.getSettings().canvasExportFolder?.trim() ||
			this.getSettings().compareExportFolder?.trim();
		const folder = normalizeFilePath(configured || `${this.getSettings().dataFolder || "OpenBible"}/canvas`);

		if (!(await this.app.vault.adapter.exists(folder))) {
			await this.app.vault.adapter.mkdir(folder);
		}

		const sortedVerses = [...params.verses].sort((a, b) => a.number - b.number);
		const rangeStr = formatVerseRange(sortedVerses.map((v) => v.number)).replace(/[, ]+/g, "_");
		const baseName = `${params.book.name} ${params.chapter}_${rangeStr} - Mapa`;
		let targetPath = normalizeFilePath(`${folder}/${baseName}.canvas`);

		// Avoid collisions if file already exists
		let counter = 1;
		while (await this.app.vault.adapter.exists(targetPath)) {
			targetPath = normalizeFilePath(`${folder}/${baseName} (${counter}).canvas`);
			counter++;
		}

		const canvasData = this.buildJsonCanvas(params);
		const content = JSON.stringify(canvasData, null, 2);

		const createdFile = await this.app.vault.create(targetPath, content);
		if (createdFile) {
			await this.app.workspace.getLeaf("tab").openFile(createdFile);
		}

		return createdFile;
	}

	/**
	 * Generates an Excalidraw visual drawing using ExcalidrawAutomate if obsidian-excalidraw-plugin is active.
	 * Returns true if successful, false if the plugin is unavailable.
	 */
	async exportToExcalidrawFile(params: VerseCanvasExportParams): Promise<boolean> {
		const win = typeof window !== "undefined" ? (window as unknown as { ExcalidrawAutomate?: any }) : {};
		const pluginEa = (this.app as any)?.plugins?.getPlugin?.("obsidian-excalidraw-plugin")?.ea;
		const ea = win.ExcalidrawAutomate || pluginEa;

		if (!ea) {
			return false;
		}

		try {
			ea.reset();
			ea.style.roughness = 0;
			ea.style.strokeWidth = 1.5;
			ea.style.roundness = { type: 3 };
			ea.style.fontFamily = 2; // Clean sans-serif font

			const sortedVerses = [...params.verses].sort((a, b) => a.number - b.number);
			const verseNumbers = sortedVerses.map((v) => v.number);
			const reference = formatReference(params.book.name, params.chapter, verseNumbers, params.versionAbbr);

			const cardWidth = 360;
			const cardGap = 40;
			const count = sortedVerses.length;

			const totalWidth = Math.max(480, (count <= 6 ? count : 2) * (cardWidth + cardGap) - cardGap);
			const headerWidth = Math.min(totalWidth, 520);
			const headerX = Math.round((totalWidth - headerWidth) / 2);

			// 1. Header Box
			ea.style.strokeColor = "#2563eb";
			ea.style.backgroundColor = "#eff6ff";
			ea.style.fillStyle = "solid";
			ea.style.fontSize = 18;

			const headerTitle = params.selectedSnippet
				? `${reference}\nEstudo de Trecho Bíblico`
				: `${reference}\nMapa de Análise Bíblica`;
			const headerId = ea.addText(headerX, 0, headerTitle, {
				box: "box",
				width: headerWidth,
				textAlign: "center",
			});

			ea.style.fontSize = 14;
			const bgColors = ["#f8fafc", "#f0fdf4", "#fffbeb", "#fef2f2", "#faf5ff", "#f0f9ff"];
			const borderColors = ["#64748b", "#16a34a", "#d97706", "#dc2626", "#9333ea", "#0284c7"];

			if (params.selectedSnippet) {
				// Snippet card + Context card + Analysis card
				ea.style.strokeColor = "#d97706";
				ea.style.backgroundColor = "#fffbeb";
				const snippetText = `Trecho em Foco\n\n"${params.selectedSnippet}"\n\n— ${reference}`;
				const snippetCardId = ea.addText(0, 160, snippetText, {
					box: "box",
					width: cardWidth,
					textAlign: "left",
				});

				ea.style.strokeColor = "#0284c7";
				ea.style.backgroundColor = "#f0f9ff";
				const versesText = `Contexto\n\n${sortedVerses.map((v) => `${toSuperscript(v.number)} ${v.text}`).join("\n\n")}`;
				const contextCardId = ea.addText(cardWidth + cardGap, 160, versesText, {
					box: "box",
					width: cardWidth,
					textAlign: "left",
				});

				ea.style.strokeColor = "#9333ea";
				ea.style.backgroundColor = "#faf5ff";
				const analysisText = `Análise & Observações\n\n• Significado central:\n• Palavras-chave:\n• Aplicação prática:`;
				const analysisCardId = ea.addText(0, 360, analysisText, {
					box: "box",
					width: cardWidth,
					textAlign: "left",
				});

				ea.style.strokeColor = "#2563eb";
				ea.style.strokeWidth = 1.5;
				if (typeof ea.connectObjects === "function") {
					ea.connectObjects(headerId, "bottom", snippetCardId, "top", { numberOfPoints: 2 });
					ea.connectObjects(snippetCardId, "right", contextCardId, "left", { numberOfPoints: 2 });
					ea.connectObjects(snippetCardId, "bottom", analysisCardId, "top", { numberOfPoints: 2 });
				}
			} else if (count <= 1) {
				// Single verse: Verse card + Analysis card + Application card
				ea.style.strokeColor = "#0284c7";
				ea.style.backgroundColor = "#f0f9ff";
				const v = sortedVerses[0] || { number: 1, text: "" };
				const verseText = `Texto Bíblico\n\n${toSuperscript(v.number)} ${v.text}`;
				const verseCardId = ea.addText(0, 160, verseText, {
					box: "box",
					width: cardWidth,
					textAlign: "left",
				});

				ea.style.strokeColor = "#9333ea";
				ea.style.backgroundColor = "#faf5ff";
				const analysisText = `Análise & Observações\n\n• Palavras-chave:\n• Contexto histórico:\n• Ideia central:`;
				const analysisCardId = ea.addText(cardWidth + cardGap, 160, analysisText, {
					box: "box",
					width: cardWidth,
					textAlign: "left",
				});

				ea.style.strokeColor = "#ca8a04";
				ea.style.backgroundColor = "#fefce8";
				const appText = `Aplicação Prática\n\n• Como aplicar hoje?\n• Ações e compromissos:`;
				const appCardId = ea.addText(0, 360, appText, {
					box: "box",
					width: cardWidth,
					textAlign: "left",
				});

				ea.style.strokeColor = "#2563eb";
				ea.style.strokeWidth = 1.5;
				if (typeof ea.connectObjects === "function") {
					ea.connectObjects(headerId, "bottom", verseCardId, "top", { numberOfPoints: 2 });
					ea.connectObjects(verseCardId, "right", analysisCardId, "left", { numberOfPoints: 2 });
					ea.connectObjects(verseCardId, "bottom", appCardId, "top", { numberOfPoints: 2 });
				}
			} else if (count <= 6) {
				// 2 to 6 verses: Branch per verse with notes card underneath
				sortedVerses.forEach((v, index) => {
					const cardX = index * (cardWidth + cardGap);
					ea.style.strokeColor = borderColors[index % borderColors.length];
					ea.style.backgroundColor = bgColors[index % bgColors.length];

					const verseCardText = `Versículo ${v.number}\n\n${toSuperscript(v.number)} ${v.text}`;
					const verseCardId = ea.addText(cardX, 160, verseCardText, {
						box: "box",
						width: cardWidth,
						textAlign: "left",
					});

					ea.style.strokeColor = "#ca8a04";
					ea.style.backgroundColor = "#fefce8";
					const notesCardText = `Notas — v. ${v.number}\n\n• Ideia-chave:\n• Reflexão:`;
					const notesCardId = ea.addText(cardX, 360, notesCardText, {
						box: "box",
						width: cardWidth,
						textAlign: "left",
					});

					ea.style.strokeColor = borderColors[index % borderColors.length];
					ea.style.strokeWidth = 1.5;
					if (typeof ea.connectObjects === "function") {
						ea.connectObjects(headerId, "bottom", verseCardId, "top", { numberOfPoints: 2 });
						ea.connectObjects(verseCardId, "bottom", notesCardId, "top", { numberOfPoints: 2 });
					}
				});
			} else {
				// Large passage: Passage card + Analysis card
				ea.style.strokeColor = "#0284c7";
				ea.style.backgroundColor = "#f0f9ff";
				const passageText = `Passagem Bíblica\n\n${sortedVerses.map((v) => `${toSuperscript(v.number)} ${v.text}`).join("\n\n")}`;
				const passageCardId = ea.addText(0, 160, passageText, {
					box: "box",
					width: 440,
					textAlign: "left",
				});

				ea.style.strokeColor = "#9333ea";
				ea.style.backgroundColor = "#faf5ff";
				const analysisText = `Análise & Estrutura\n\n• Temas principais:\n• Divisões do texto:\n• Aplicação prática:`;
				const analysisCardId = ea.addText(480, 160, analysisText, {
					box: "box",
					width: 400,
					textAlign: "left",
				});

				ea.style.strokeColor = "#2563eb";
				ea.style.strokeWidth = 1.5;
				if (typeof ea.connectObjects === "function") {
					ea.connectObjects(headerId, "bottom", passageCardId, "top", { numberOfPoints: 2 });
					ea.connectObjects(passageCardId, "right", analysisCardId, "left", { numberOfPoints: 2 });
				}
			}

			const configured =
				this.getSettings().canvasExportFolder?.trim() ||
				this.getSettings().compareExportFolder?.trim();
			const folder = normalizeFilePath(configured || `${this.getSettings().dataFolder || "OpenBible"}/canvas`);
			const rangeStr = formatVerseRange(verseNumbers).replace(/[, ]+/g, "_");
			const filename = `${params.book.name} ${params.chapter}_${rangeStr} - Mapa`;

			await ea.create({
				filename,
				foldername: folder,
				onNewPane: true,
			});

			return true;
		} catch (error) {
			console.error("OpenBible: failed to export verses to Excalidraw drawing:", error);
			return false;
		}
	}
}
