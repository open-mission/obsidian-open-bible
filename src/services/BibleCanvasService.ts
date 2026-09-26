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

export interface CanvasTemplateSection {
	title: string;
	placeholder: string;
	color?: string; // Canvas color preset "1" to "6"
	bgHex?: string; // Excalidraw fill
	borderHex?: string; // Excalidraw border
}

export interface CanvasStudyTemplate {
	id: string;
	title: string;
	description: string;
	icon: string;
	color: string;
	sections: CanvasTemplateSection[];
}

export const DEFAULT_CANVAS_TEMPLATES: CanvasStudyTemplate[] = [
	{
		id: "text_analysis",
		title: "Análise do Texto",
		description: "Estudo analítico e exegético com palavras-chave, contexto histórico e teologia.",
		icon: "file-search",
		color: "6",
		sections: [
			{
				title: "Palavras-chave & Original",
				placeholder: "• Termos importantes no hebraico/grego:\n• Definições e nuances:\n• Repetições intencionais:",
				color: "5",
				bgHex: "#f0f9ff",
				borderHex: "#0284c7",
			},
			{
				title: "Contexto Histórico & Literário",
				placeholder: "• Autor e audiência original:\n• Gênero literário:\n• Situação histórica / cultural:",
				color: "2",
				bgHex: "#fffbeb",
				borderHex: "#d97706",
			},
			{
				title: "Teologia & Mensagem Central",
				placeholder: "• O que o texto revela sobre Deus?\n• Tema teológico principal:\n• Conexão com o Evangelho:",
				color: "6",
				bgHex: "#faf5ff",
				borderHex: "#9333ea",
			},
		],
	},
	{
		id: "devotional",
		title: "Devocional",
		description: "Meditação pessoal focada em comunhão com Deus, escuta e aplicação no dia a dia.",
		icon: "heart",
		color: "3",
		sections: [
			{
				title: "O que Deus está me dizendo?",
				placeholder: "• Frase ou verdade que mais tocou meu coração:\n• O que aprendo sobre o Senhor:\n• Promessa ou advertência presente:",
				color: "5",
				bgHex: "#f0f9ff",
				borderHex: "#0284c7",
			},
			{
				title: "Aplicação Prática",
				placeholder: "• Como posso viver essa verdade hoje?\n• Uma atitude ou mudança concreta a tomar:\n• Pessoas que posso abençoar com isso:",
				color: "3",
				bgHex: "#fefce8",
				borderHex: "#ca8a04",
			},
			{
				title: "Oração & Gratidão",
				placeholder: "• Agradeço por:\n• Peço perdão por:\n• Minha súplica hoje:",
				color: "2",
				bgHex: "#fff7ed",
				borderHex: "#ea580c",
			},
		],
	},
	{
		id: "mind_map",
		title: "Mapa de Ideias",
		description: "Mapeamento visual de conceitos, conexões lógicas, ramificações e referências cruzadas.",
		icon: "git-branch",
		color: "5",
		sections: [
			{
				title: "Ideia Central & Argumento",
				placeholder: "• Tese principal do autor:\n• Linha de raciocínio:\n• Causa e efeito no texto:",
				color: "5",
				bgHex: "#f0f9ff",
				borderHex: "#0284c7",
			},
			{
				title: "Ramificações & Conexões",
				placeholder: "• Ponto 1:\n• Ponto 2:\n• Ponto 3:",
				color: "6",
				bgHex: "#faf5ff",
				borderHex: "#9333ea",
			},
			{
				title: "Referências Cruzadas",
				placeholder: "• [[ ]]\n• ",
				color: "2",
				bgHex: "#fffbeb",
				borderHex: "#d97706",
			},
		],
	},
	{
		id: "inductive",
		title: "Estudo Indutivo (OIA)",
		description: "Método clássico de estudo bíblico: Observação, Interpretação e Aplicação.",
		icon: "compass",
		color: "2",
		sections: [
			{
				title: "1. Observação (O que o texto diz?)",
				placeholder: "• Quem, o quê, onde, quando e por quê?\n• Conectivos e verbos-chave:\n• Contrastes e comparações:",
				color: "5",
				bgHex: "#f0f9ff",
				borderHex: "#0284c7",
			},
			{
				title: "2. Interpretação (O que o texto significa?)",
				placeholder: "• Qual era o sentido para os leitores originais?\n• Princípio atemporal imutável:\n• Iluminação por outras passagens:",
				color: "6",
				bgHex: "#faf5ff",
				borderHex: "#9333ea",
			},
			{
				title: "3. Aplicação (O que o texto exige de mim?)",
				placeholder: "• Pecado a confessar?\n• Promessa a crer?\n• Exemplo a seguir?\n• Mandamento a obedecer?",
				color: "3",
				bgHex: "#fefce8",
				borderHex: "#ca8a04",
			},
		],
	},
	{
		id: "sermon_outline",
		title: "Esboço de Ensino & Pregação",
		description: "Estruturação didática com introdução, tópicos expositivos e conclusão.",
		icon: "layout-list",
		color: "1",
		sections: [
			{
				title: "Título & Proposição",
				placeholder: "• Título da mensagem:\n• Proposição central:\n• Pergunta norteadora:",
				color: "1",
				bgHex: "#fef2f2",
				borderHex: "#dc2626",
			},
			{
				title: "Divisões do Texto",
				placeholder: "• I. Primeiro princípio:\n• II. Segundo princípio:\n• III. Terceiro princípio:",
				color: "5",
				bgHex: "#f0f9ff",
				borderHex: "#0284c7",
			},
			{
				title: "Conclusão & Apelo",
				placeholder: "• Resumo prático:\n• Apelo ou desafio final:",
				color: "3",
				bgHex: "#fefce8",
				borderHex: "#ca8a04",
			},
		],
	},
];

function normalizeFilePath(path: string): string {
	return path.replace(/\\/g, "/").replace(/\/+/g, "/").replace(/^\/+/, "");
}

export class BibleCanvasService {
	constructor(
		private readonly app: App,
		private readonly getSettings: () => OpenBibleSettings,
	) {}

	/**
	 * Returns available study templates, combining built-in templates with any custom
	 * templates found in the user-configured templates folder (e.g. Templates/Canvas).
	 */
	async getTemplates(): Promise<CanvasStudyTemplate[]> {
		const templates: CanvasStudyTemplate[] = [...DEFAULT_CANVAS_TEMPLATES];

		const configured = this.getSettings().canvasTemplatesFolder?.trim();
		const folder = normalizeFilePath(configured || "Templates/Canvas");

		try {
			if (this.app?.vault?.adapter && (await this.app.vault.adapter.exists(folder))) {
				const listing = await this.app.vault.adapter.list(folder);
				for (const filePath of listing.files) {
					if (filePath.endsWith(".json")) {
						try {
							const content = await this.app.vault.adapter.read(filePath);
							const parsed = JSON.parse(content);
							if (parsed.id && parsed.title && Array.isArray(parsed.sections)) {
								const existingIndex = templates.findIndex((t) => t.id === parsed.id);
								if (existingIndex >= 0) {
									templates[existingIndex] = parsed;
								} else {
									templates.push(parsed);
								}
							}
						} catch (e) {
							console.warn("OpenBible: failed to parse canvas template JSON:", filePath, e);
						}
					} else if (filePath.endsWith(".md")) {
						try {
							const content = await this.app.vault.adapter.read(filePath);
							const template = this.parseMarkdownTemplate(filePath, content);
							if (template) {
								const existingIndex = templates.findIndex((t) => t.id === template.id);
								if (existingIndex >= 0) {
									templates[existingIndex] = template;
								} else {
									templates.push(template);
								}
							}
						} catch (e) {
							console.warn("OpenBible: failed to parse canvas template MD:", filePath, e);
						}
					}
				}
			}
		} catch (err) {
			console.warn("OpenBible: error listing canvas templates folder:", err);
		}

		return templates;
	}

	/**
	 * Parses a user markdown template file containing '### Section' headings.
	 */
	parseMarkdownTemplate(filePath: string, content: string): CanvasStudyTemplate | null {
		const lines = content.split("\n");
		let title = "";
		let description = "";
		const sections: CanvasTemplateSection[] = [];

		let currentSection: CanvasTemplateSection | null = null;
		let placeholderLines: string[] = [];

		for (const line of lines) {
			if (line.startsWith("# ") && !title) {
				title = line.replace(/^#\s+/, "").trim();
			} else if (line.startsWith("### ")) {
				if (currentSection) {
					currentSection.placeholder = placeholderLines.join("\n").trim();
					sections.push(currentSection);
					placeholderLines = [];
				}
				const secTitle = line.replace(/^###\s+/, "").trim();
				currentSection = {
					title: secTitle,
					placeholder: "",
					color: "6",
					bgHex: "#faf5ff",
					borderHex: "#9333ea",
				};
			} else if (currentSection) {
				placeholderLines.push(line);
			} else if (title && !currentSection && line.trim() && !description) {
				description = line.trim();
			} else if (!title && !currentSection && line.trim() && !description) {
				description = line.trim();
			}
		}

		if (currentSection) {
			currentSection.placeholder = placeholderLines.join("\n").trim();
			sections.push(currentSection);
		}

		if (!title) {
			const baseName = filePath.split("/").pop()?.replace(/\.(md|json)$/, "") || "Modelo";
			title = baseName;
		}

		if (sections.length === 0) return null;

		const id = title.toLowerCase().replace(/[^a-z0-9]+/g, "_");
		return {
			id,
			title,
			description: description || `Modelo de estudo bíblico personalizado.`,
			icon: "layout-dashboard",
			color: "6",
			sections,
		};
	}

	/**
	 * Seeds default templates as markdown files in the configured templates folder
	 * so users can discover, edit, and create their own custom templates.
	 */
	async seedDefaultTemplates(): Promise<void> {
		const configured = this.getSettings().canvasTemplatesFolder?.trim();
		const folder = normalizeFilePath(configured || "Templates/Canvas");

		try {
			if (!this.app?.vault?.adapter) return;
			if (!(await this.app.vault.adapter.exists(folder))) {
				await this.app.vault.adapter.mkdir(folder);
			}

			for (const tpl of DEFAULT_CANVAS_TEMPLATES) {
				const path = normalizeFilePath(`${folder}/${tpl.title}.md`);
				if (!(await this.app.vault.adapter.exists(path))) {
					let md = `# ${tpl.title}\n${tpl.description}\n\n`;
					for (const sec of tpl.sections) {
						md += `### ${sec.title}\n${sec.placeholder}\n\n`;
					}
					await this.app.vault.adapter.write(path, md.trim());
				}
			}
		} catch (err) {
			console.warn("OpenBible: failed to seed default canvas templates:", err);
		}
	}

	/**
	 * Builds a structured JSON Canvas 1.0 document for the given verse selection.
	 * Formats all selected scripture verses into ONE SINGLE UNIFIED BLOCK,
	 * connected to companion study/analysis blocks defined by the selected template.
	 */
	buildJsonCanvas(params: VerseCanvasExportParams, template?: CanvasStudyTemplate): JsonCanvasData {
		const nodes: CanvasNode[] = [];
		const edges: CanvasEdge[] = [];

		const sortedVerses = [...params.verses].sort((a, b) => a.number - b.number);
		const verseNumbers = sortedVerses.map((v) => v.number);
		const reference = formatReference(params.book.name, params.chapter, verseNumbers, params.versionAbbr);

		const activeTemplate = template || DEFAULT_CANVAS_TEMPLATES[0];

		// 1. Header Node
		const headerId = generateCanvasId();
		const headerWidth = 500;
		const headerHeight = 120;
		const headerTitle = `# ${reference}\n\n*Tradução: ${params.versionAbbr || "Bíblia"}* — **${activeTemplate.title}**`;
		nodes.push({
			id: headerId,
			type: "text",
			x: 0,
			y: 0,
			width: headerWidth,
			height: headerHeight,
			color: "4", // Green preset
			text: headerTitle,
		});

		// 2. Unified Scripture Passage Node (ONE SINGLE BLOCK)
		const passageId = generateCanvasId();
		const versesText = sortedVerses
			.map((v) => `${toSuperscript(v.number)} ${v.text}`)
			.join("\n");

		let scriptureContent = `### Texto Bíblico (${reference})\n\n`;
		if (params.selectedSnippet) {
			scriptureContent += `> "${params.selectedSnippet}"\n\n`;
		}
		scriptureContent += versesText;

		const scriptureWidth = 480;
		const scriptureHeight = Math.max(200, 100 + Math.ceil(scriptureContent.length / 32) * 20);

		nodes.push({
			id: passageId,
			type: "text",
			x: 0,
			y: 160,
			width: scriptureWidth,
			height: scriptureHeight,
			color: "5", // Cyan preset
			text: scriptureContent,
		});

		// Connect Header -> Scripture Node
		edges.push({
			id: generateCanvasId(),
			fromNode: headerId,
			fromSide: "bottom",
			toNode: passageId,
			toSide: "top",
			toEnd: "arrow",
		});

		// 3. Template Companion Section Nodes
		const sections = activeTemplate.sections;
		const col2X = scriptureWidth + 40; // 520
		const sectionWidth = 460;
		let currentY = 160;

		sections.forEach((sec) => {
			const secNodeId = generateCanvasId();
			const secHeight = Math.max(180, 80 + Math.ceil(sec.placeholder.length / 28) * 18);

			nodes.push({
				id: secNodeId,
				type: "text",
				x: col2X,
				y: currentY,
				width: sectionWidth,
				height: secHeight,
				color: sec.color || "6",
				text: `### ${sec.title}\n\n${sec.placeholder}`,
			});

			// Connect Scripture -> Template Section
			edges.push({
				id: generateCanvasId(),
				fromNode: passageId,
				fromSide: "right",
				toNode: secNodeId,
				toSide: "left",
				toEnd: "arrow",
			});

			currentY += secHeight + 24;
		});

		return { nodes, edges };
	}

	/**
	 * Creates a .canvas file inside the vault and opens it in a new workspace tab.
	 */
	async exportToCanvasFile(params: VerseCanvasExportParams, template?: CanvasStudyTemplate): Promise<TFile> {
		const configured =
			this.getSettings().canvasExportFolder?.trim() ||
			this.getSettings().compareExportFolder?.trim();
		const folder = normalizeFilePath(configured || `${this.getSettings().dataFolder || "OpenBible"}/canvas`);

		if (!(await this.app.vault.adapter.exists(folder))) {
			await this.app.vault.adapter.mkdir(folder);
		}

		const sortedVerses = [...params.verses].sort((a, b) => a.number - b.number);
		const rangeStr = formatVerseRange(sortedVerses.map((v) => v.number)).replace(/[, ]+/g, "_");
		const activeTemplate = template || DEFAULT_CANVAS_TEMPLATES[0];
		const cleanTitle = activeTemplate.title.replace(/[\\/:*?"<>|]/g, "");
		const baseName = `${params.book.name} ${params.chapter}_${rangeStr} - ${cleanTitle}`;
		let targetPath = normalizeFilePath(`${folder}/${baseName}.canvas`);

		// Avoid collisions if file already exists
		let counter = 1;
		while (await this.app.vault.adapter.exists(targetPath)) {
			targetPath = normalizeFilePath(`${folder}/${baseName} (${counter}).canvas`);
			counter++;
		}

		const canvasData = this.buildJsonCanvas(params, activeTemplate);
		const content = JSON.stringify(canvasData, null, 2);

		const createdFile = await this.app.vault.create(targetPath, content);
		if (createdFile) {
			await this.app.workspace.getLeaf("tab").openFile(createdFile);
		}

		return createdFile;
	}

	/**
	 * Generates an Excalidraw visual drawing using ExcalidrawAutomate if obsidian-excalidraw-plugin is active.
	 * Puts all selected scripture verses into ONE SINGLE BOUND TEXT CONTAINER,
	 * connected to companion study blocks based on the selected template.
	 */
	async exportToExcalidrawFile(params: VerseCanvasExportParams, template?: CanvasStudyTemplate): Promise<boolean> {
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
			const activeTemplate = template || DEFAULT_CANVAS_TEMPLATES[0];

			// 1. Header Box
			ea.style.strokeColor = "#2563eb";
			ea.style.backgroundColor = "#eff6ff";
			ea.style.fillStyle = "solid";
			ea.style.fontSize = 18;

			const headerTitle = `${reference}\n${activeTemplate.title}${params.versionAbbr ? ` (${params.versionAbbr})` : ""}`;
			const headerId = ea.addText(0, 0, headerTitle, {
				box: "box",
				width: 480,
				textAlign: "center",
			});

			// 2. Unified Scripture Passage Box (ONE SINGLE BLOCK)
			ea.style.strokeColor = "#0284c7";
			ea.style.backgroundColor = "#f0f9ff";
			ea.style.fillStyle = "solid";
			ea.style.fontSize = 14;

			const versesText = sortedVerses
				.map((v) => `${toSuperscript(v.number)} ${v.text}`)
				.join("\n");

			let scriptureText = `Texto Bíblico (${reference})\n\n`;
			if (params.selectedSnippet) {
				scriptureText += `"${params.selectedSnippet}"\n\n`;
			}
			scriptureText += versesText;

			const scriptureCardId = ea.addText(0, 160, scriptureText, {
				box: "box",
				width: 460,
				textAlign: "left",
			});

			// Connect Header -> Scripture Box
			if (typeof ea.connectObjects === "function") {
				ea.connectObjects(headerId, "bottom", scriptureCardId, "top", { numberOfPoints: 2 });
			}

			// 3. Template Companion Section Boxes
			const col2X = 500;
			let currentY = 160;

			for (const sec of activeTemplate.sections) {
				ea.style.strokeColor = sec.borderHex || "#64748b";
				ea.style.backgroundColor = sec.bgHex || "#f8fafc";
				ea.style.fillStyle = "solid";
				ea.style.fontSize = 14;

				const secText = `${sec.title}\n\n${sec.placeholder}`;
				const secCardId = ea.addText(col2X, currentY, secText, {
					box: "box",
					width: 420,
					textAlign: "left",
				});

				// Connect Scripture -> Section Box
				if (typeof ea.connectObjects === "function") {
					ea.connectObjects(scriptureCardId, "right", secCardId, "left", { numberOfPoints: 2 });
				}

				currentY += 200;
			}

			const configured =
				this.getSettings().canvasExportFolder?.trim() ||
				this.getSettings().compareExportFolder?.trim();
			const folder = normalizeFilePath(configured || `${this.getSettings().dataFolder || "OpenBible"}/canvas`);
			const rangeStr = formatVerseRange(verseNumbers).replace(/[, ]+/g, "_");
			const cleanTitle = activeTemplate.title.replace(/[\\/:*?"<>|]/g, "");
			const filename = `${params.book.name} ${params.chapter}_${rangeStr} - ${cleanTitle}`;

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
