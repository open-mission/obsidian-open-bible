import type { App, TFile } from "obsidian";
import { getCanonBook } from "../bibleCanon";
import type { BibleVerse } from "../models/bible";
import type {
	CanvasEdge,
	CanvasNode,
	JsonCanvasData,
	PassageComparisonData,
	VerseComparisonRow,
	VersionComparisonItem,
} from "../models/comparison";
import type { OpenBibleSettings } from "../settings";
import { formatReference, formatVerseRange, toSuperscript } from "./verseFormat";
import type { BibleTextService } from "./bibleTextService";
import type { BibleVersionService } from "./bibleVersionService";

function normalizeFilePath(path: string): string {
	return path.replace(/\\/g, "/").replace(/\/+/g, "/").replace(/^\/+/, "");
}

/**
 * Generates a 16-character lowercase hexadecimal ID for JSON Canvas 1.0 compliance.
 */
export function generateCanvasId(): string {
	const chars = "0123456789abcdef";
	let id = "";
	for (let i = 0; i < 16; i++) {
		id += chars[Math.floor(Math.random() * chars.length)];
	}
	return id;
}

export class BibleComparisonService {
	constructor(
		private readonly app: App,
		private readonly bibleText: BibleTextService,
		private readonly versionService: BibleVersionService,
		private readonly getSettings: () => OpenBibleSettings,
	) {}

	/**
	 * Queries and compiles verses across multiple installed Bible versions.
	 */
	async comparePassage(
		bookId: number,
		chapter: number,
		verseNumbers: number[],
		versionPaths: string[],
	): Promise<PassageComparisonData> {
		const canonBook = getCanonBook(bookId);
		const bookName = canonBook?.namePt || canonBook?.nameEn || `Livro ${bookId}`;

		// If no versions specified, fallback to default or first installed
		let targetVersionPaths = versionPaths.filter(Boolean);
		if (targetVersionPaths.length === 0) {
			const installed = await this.versionService.listVersions();
			const defaultPath = this.getSettings().defaultVersionPath;
			if (defaultPath && installed.some((v) => v.filePath === defaultPath)) {
				targetVersionPaths = [defaultPath];
			} else if (installed.length > 0) {
				targetVersionPaths = installed.slice(0, 2).map((v) => v.filePath);
			}
		}

		const versionItems: VersionComparisonItem[] = [];

		for (const vPath of targetVersionPaths) {
			try {
				const info = this.versionService.resolveVersionInfo(vPath);
				const allChapterVerses = await this.bibleText.readChapter(vPath, bookId, chapter);

				let filteredVerses: BibleVerse[];
				if (verseNumbers && verseNumbers.length > 0) {
					const numSet = new Set(verseNumbers);
					filteredVerses = allChapterVerses.filter((v) => numSet.has(v.number));
				} else {
					filteredVerses = allChapterVerses;
				}

				const fullText = filteredVerses
					.map((v) => `${toSuperscript(v.number)} ${v.text}`)
					.join(" ");

				versionItems.push({
					versionId: vPath,
					versionName: info.name,
					versionAbbr: info.abbreviation,
					verses: filteredVerses,
					fullText,
				});
			} catch (err) {
				console.warn(`OpenBible: failed to read passage for version ${vPath}:`, err);
			}
		}

		// Determine the canonical list of verse numbers
		let effectiveVerseNumbers = verseNumbers;
		if (!effectiveVerseNumbers || effectiveVerseNumbers.length === 0) {
			const allNums = new Set<number>();
			for (const vi of versionItems) {
				for (const v of vi.verses) {
					allNums.add(v.number);
				}
			}
			effectiveVerseNumbers = Array.from(allNums).sort((a, b) => a - b);
		} else {
			effectiveVerseNumbers = [...new Set(effectiveVerseNumbers)].sort((a, b) => a - b);
		}

		// Assemble verse-by-verse comparison rows
		const rows: VerseComparisonRow[] = effectiveVerseNumbers.map((vNum) => {
			const versionRows = versionItems.map((vi) => {
				const found = vi.verses.find((v) => v.number === vNum);
				return {
					versionId: vi.versionId,
					versionAbbr: vi.versionAbbr,
					versionName: vi.versionName,
					text: found ? found.text : "",
				};
			});
			return {
				verseNumber: vNum,
				versions: versionRows,
			};
		});

		const reference = formatReference(bookName, chapter, effectiveVerseNumbers);

		return {
			bookId,
			bookName,
			chapter,
			verseNumbers: effectiveVerseNumbers,
			reference,
			versions: versionItems,
			rows,
		};
	}

	/**
	 * Formats the comparison as a Markdown document suitable for copying or inserting into notes.
	 */
	formatMarkdownComparison(data: PassageComparisonData, layout: "columns" | "verses" = "columns"): string {
		const lines: string[] = [];
		lines.push(`## ${data.reference} — Comparação de Versões\n`);

		if (layout === "verses") {
			for (const row of data.rows) {
				lines.push(`### Versículo ${row.verseNumber}`);
				for (const v of row.versions) {
					lines.push(`- **${v.versionAbbr}** (${v.versionName}): ${v.text}`);
				}
				lines.push("");
			}
		} else {
			for (const v of data.versions) {
				lines.push(`### ${v.versionAbbr} — ${v.versionName}`);
				const versesText = v.verses
					.map((item) => `> ${toSuperscript(item.number)} ${item.text}`)
					.join("\n>\n");
				lines.push(versesText);
				lines.push("");
			}
		}

		return lines.join("\n").trim();
	}

	/**
	 * Generates a JSON Canvas 1.0 compliant structure for the compared passage.
	 * Specs: https://jsoncanvas.org/spec/1.0/
	 */
	buildJsonCanvas(data: PassageComparisonData): JsonCanvasData {
		const nodes: CanvasNode[] = [];
		const edges: CanvasEdge[] = [];

		const numVersions = data.versions.length;
		const cardWidth = 380;
		const cardGap = 40;
		const totalWidth = Math.max(460, numVersions * cardWidth + (numVersions - 1) * cardGap);

		// 1. Central Header Node
		const headerId = generateCanvasId();
		const headerWidth = Math.min(totalWidth, 540);
		const headerX = Math.round((totalWidth - headerWidth) / 2);
		const headerY = 0;
		const headerHeight = 150;

		const versionTags = data.versions.map((v) => `\`${v.versionAbbr}\``).join("  ");
		const headerText = `# ${data.reference}\n\n**Comparação de Traduções**\n\n${versionTags}`;

		nodes.push({
			id: headerId,
			type: "text",
			x: headerX,
			y: headerY,
			width: headerWidth,
			height: headerHeight,
			color: "4", // Green preset
			text: headerText,
		});

		// 2. Translation Nodes (placed side-by-side beneath the header)
		const cardsY = headerHeight + 80;
		const colorPresets = ["1", "2", "3", "5", "6"]; // Red, Orange, Yellow, Cyan, Purple

		data.versions.forEach((ver, index) => {
			const nodeId = generateCanvasId();
			const cardX = index * (cardWidth + cardGap);
			const estimatedHeight = Math.max(260, 100 + data.verseNumbers.length * 60);

			let content = `### ${ver.versionAbbr} — ${ver.versionName}\n\n`;
			for (const v of ver.verses) {
				content += `**${v.number}.** ${v.text}\n\n`;
			}

			nodes.push({
				id: nodeId,
				type: "text",
				x: cardX,
				y: cardsY,
				width: cardWidth,
				height: estimatedHeight,
				color: colorPresets[index % colorPresets.length],
				text: content.trim(),
			});

			// Connect Header to Version card
			edges.push({
				id: generateCanvasId(),
				fromNode: headerId,
				fromSide: "bottom",
				toNode: nodeId,
				toSide: "top",
				toEnd: "arrow",
			});
		});

		return { nodes, edges };
	}

	/**
	 * Creates a .canvas file inside the vault and opens it in a new workspace tab.
	 */
	async exportToJsonCanvasFile(data: PassageComparisonData): Promise<TFile> {
		const configured = this.getSettings().compareExportFolder?.trim();
		const folder = normalizeFilePath(configured || `${this.getSettings().dataFolder || "OpenBible"}/comparisons`);

		if (!(await this.app.vault.adapter.exists(folder))) {
			await this.app.vault.adapter.mkdir(folder);
		}

		const rangeStr = formatVerseRange(data.verseNumbers).replace(/[, ]+/g, "_");
		const baseName = `${data.bookName} ${data.chapter}_${rangeStr} - Comparacao`;
		let targetPath = normalizeFilePath(`${folder}/${baseName}.canvas`);

		// Avoid collisions if file already exists
		let counter = 1;
		while (await this.app.vault.adapter.exists(targetPath)) {
			targetPath = normalizeFilePath(`${folder}/${baseName} (${counter}).canvas`);
			counter++;
		}

		const canvasData = this.buildJsonCanvas(data);
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
	async exportToExcalidraw(data: PassageComparisonData): Promise<boolean> {
		// Access ExcalidrawAutomate
		const win = window as unknown as { ExcalidrawAutomate?: any };
		const pluginEa = (this.app as any).plugins?.getPlugin("obsidian-excalidraw-plugin")?.ea;
		const ea = win.ExcalidrawAutomate || pluginEa;

		if (!ea) {
			return false;
		}

		try {
			ea.reset();
			ea.style.roughness = 0;
			ea.style.strokeWidth = 1.5;
			ea.style.roundness = { type: 3 };
			ea.style.fontFamily = 2; // Clean system/sans-serif font

			const cardWidth = 380;
			const cardGap = 40;
			const numVersions = data.versions.length;
			const totalWidth = Math.max(460, numVersions * cardWidth + (numVersions - 1) * cardGap);

			// 1. Header Box with centered wrapped text
			const headerWidth = Math.min(totalWidth, 540);
			const headerX = Math.round((totalWidth - headerWidth) / 2);
			const headerY = 0;

			ea.style.strokeColor = "#2563eb";
			ea.style.backgroundColor = "#eff6ff";
			ea.style.fillStyle = "solid";
			ea.style.fontSize = 18;

			const headerText = `${data.reference}\nComparação de Versões\n(${data.versions.map((v) => v.versionAbbr).join(", ")})`;
			const headerId = ea.addText(headerX, headerY, headerText, {
				box: "box",
				width: headerWidth,
				textAlign: "center",
			});

			// 2. Version Cards with bound text inside
			const cardsY = 160;
			const bgColors = ["#f8fafc", "#f0fdf4", "#fffbeb", "#fef2f2", "#faf5ff", "#f0f9ff"];
			const borderColors = ["#64748b", "#16a34a", "#d97706", "#dc2626", "#9333ea", "#0284c7"];

			data.versions.forEach((ver, index) => {
				const cardX = index * (cardWidth + cardGap);

				let textContent = `${ver.versionAbbr} — ${ver.versionName}\n\n`;
				for (const v of ver.verses) {
					textContent += `${v.number}. ${v.text}\n\n`;
				}

				ea.style.strokeColor = borderColors[index % borderColors.length];
				ea.style.backgroundColor = bgColors[index % bgColors.length];
				ea.style.fillStyle = "solid";
				ea.style.fontSize = 14;

				const cardId = ea.addText(cardX, cardsY, textContent.trim(), {
					box: "box",
					width: cardWidth,
					textAlign: "left",
				});

				// Connect header to version card with an arrow
				ea.style.strokeColor = borderColors[index % borderColors.length];
				ea.style.strokeWidth = 1.5;
				if (typeof ea.connectObjects === "function") {
					ea.connectObjects(headerId, "bottom", cardId, "top", { numberOfPoints: 2 });
				} else if (typeof ea.connectCreatedElToTarget === "function") {
					ea.connectCreatedElToTarget(headerId, cardId);
				}
			});

			const configured = this.getSettings().compareExportFolder?.trim();
			const folder = normalizeFilePath(configured || `${this.getSettings().dataFolder || "OpenBible"}/comparisons`);
			const rangeStr = formatVerseRange(data.verseNumbers).replace(/[, ]+/g, "_");
			const filename = `${data.bookName} ${data.chapter}_${rangeStr} - Comparacao`;

			await ea.create({
				filename,
				foldername: folder,
				onNewPane: true,
			});

			return true;
		} catch (error) {
			console.error("OpenBible: failed to export Excalidraw drawing:", error);
			return false;
		}
	}
}
