import { normalizePath, TFile, type App } from "obsidian";
import type { BibleBook, BibleVerse } from "../models/bible";
import type { BibleNoteFrontmatter, BibleNoteItem } from "../models/note";
import type { OpenBibleSettings } from "../settings";
import { getCanonBook } from "../bibleCanon";
import { normalizeText } from "../constants";
import { formatReference, formatVerseRange, formatVersesText } from "./verseFormat";
import { getNotesFolder } from "../core/paths";

export function parseVerseRangeString(versesStr: unknown): number[] {
	if (typeof versesStr === "number") return [versesStr];
	if (Array.isArray(versesStr)) return versesStr.map(Number).filter((n) => !isNaN(n));
	if (typeof versesStr !== "string") return [];

	const result = new Set<number>();
	const parts = versesStr.split(/[,;\s]+/);
	for (const part of parts) {
		const trimmed = part.trim();
		if (!trimmed) continue;
		if (trimmed.includes("-") || trimmed.includes("–")) {
			const [startStr, endStr] = trimmed.split(/[-–]/);
			const start = parseInt(startStr, 10);
			const end = parseInt(endStr, 10);
			if (!isNaN(start) && !isNaN(end)) {
				for (let i = Math.min(start, end); i <= Math.max(start, end); i++) {
					result.add(i);
				}
			}
		} else {
			const num = parseInt(trimmed, 10);
			if (!isNaN(num)) {
				result.add(num);
			}
		}
	}
	return Array.from(result).sort((a, b) => a - b);
}

export function detectBibleNote(
	file: TFile,
	app: App,
	notesFolder?: string
): BibleNoteItem | null {
	const cache = app.metadataCache.getFileCache(file);
	const fm = cache?.frontmatter as BibleNoteFrontmatter | undefined;

	if (!fm) return null;

	// Check if explicitly typed as note, or if inside notesFolder with book and chapter
	const isNoteType = fm.type === "note";
	const cleanFolder = notesFolder?.trim();
	const isStrictNotesFolder = Boolean(
		cleanFolder && cleanFolder !== "/" && file.path.startsWith(normalizePath(cleanFolder) + "/")
	);

	if (!isNoteType && !isStrictNotesFolder) {
		return null;
	}

	let detectedBook: string | null = null;
	let detectedChapter: number | null = null;
	let detectedVerses: number[] = [];

	if (fm.book && fm.chapter !== undefined && fm.chapter !== null) {
		const rawBook = String(fm.book).replace(/^\[\[/, "").replace(/\]\]$/, "").trim();
		const canon = getCanonBook(rawBook);
		detectedBook = canon ? canon.namePt : rawBook;
		const ch = Number(fm.chapter);
		if (!isNaN(ch)) {
			detectedChapter = ch;
		}
		if (fm.verses !== undefined && fm.verses !== null) {
			detectedVerses = parseVerseRangeString(fm.verses);
		}
	}

	if (!detectedBook || detectedChapter === null || isNaN(detectedChapter)) {
		return null;
	}

	const color = fm.color ? String(fm.color).trim() : "yellow";
	const highlightLabel = fm.highlight_label ? String(fm.highlight_label).trim() : undefined;
	const reference =
		fm.reference ? String(fm.reference).trim() : formatReference(detectedBook, detectedChapter, detectedVerses);
	const versesStr = fm.verses ? String(fm.verses) : formatVerseRange(detectedVerses);

	return {
		path: file.path,
		type: "note",
		title: fm.title ? String(fm.title).trim() : file.basename,
		book: detectedBook,
		chapter: detectedChapter,
		verses: detectedVerses,
		versesStr,
		version: fm.bible_version ? String(fm.bible_version).trim() : undefined,
		color,
		highlightLabel,
		reference,
		created: fm.created ? String(fm.created) : undefined,
		charStart: typeof fm.char_start === "number" ? fm.char_start : undefined,
		charEnd: typeof fm.char_end === "number" ? fm.char_end : undefined,
		selectedText: fm.selected_text ? String(fm.selected_text) : undefined,
		mtime: file.stat.mtime,
	};
}

export function findNotesForPassage(
	app: App,
	bookName: string,
	chapter: number,
	notesFolder?: string
): BibleNoteItem[] {
	const canonTarget = getCanonBook(bookName);
	const targetNorm = normalizeText(canonTarget ? canonTarget.namePt : bookName);
	const files = app.vault.getMarkdownFiles();
	const results: BibleNoteItem[] = [];

	for (const file of files) {
		const note = detectBibleNote(file, app, notesFolder);
		if (!note) continue;

		const noteCanon = getCanonBook(note.book);
		const noteNorm = normalizeText(noteCanon ? noteCanon.namePt : note.book);

		if (noteNorm === targetNorm && note.chapter === chapter) {
			results.push(note);
		}
	}

	return results.sort((a, b) => (b.mtime ?? 0) - (a.mtime ?? 0));
}

function getNowFormatted(): string {
	const now = new Date();
	const y = now.getFullYear();
	const m = String(now.getMonth() + 1).padStart(2, "0");
	const d = String(now.getDate()).padStart(2, "0");
	const hh = String(now.getHours()).padStart(2, "0");
	const mm = String(now.getMinutes()).padStart(2, "0");
	return `${y}-${m}-${d} ${hh}:${mm}`;
}

export async function createNoteFromSelection(
	app: App,
	settings: OpenBibleSettings,
	data: {
		book: BibleBook;
		chapter: number;
		verses: BibleVerse[];
		versionAbbr: string;
		color?: string;
		label?: string;
		selectedText?: string;
		charStart?: number;
		charEnd?: number;
	}
): Promise<TFile> {
	const folder = getNotesFolder(settings.dataFolder, settings.notesFolder);

	if (!(await app.vault.adapter.exists(folder))) {
		await app.vault.adapter.mkdir(folder);
	}

	const verseNumbers = data.verses.map((v) => v.number);
	const range = formatVerseRange(verseNumbers);
	const canonicalRef = formatReference(data.book.name, data.chapter, verseNumbers);
	const safeBase = `${data.book.name} ${data.chapter}.${range}`.replace(/[\\/:*?"<>|]/g, "-");

	let candidatePath = normalizePath(`${folder}/${safeBase}.md`);
	let counter = 1;
	while (await app.vault.adapter.exists(candidatePath)) {
		candidatePath = normalizePath(`${folder}/${safeBase} (${counter}).md`);
		counter++;
	}

	const now = getNowFormatted();
	const noteConfigs = settings.configuredNotes && settings.configuredNotes.length > 0
		? settings.configuredNotes
		: (settings.configuredHighlights || []);
	const color = data.color || (noteConfigs[0]?.color || "yellow");
	const configuredNote = noteConfigs.find(
		(h) => h.id === color || h.color === color
	);
	const highlightLabel = data.label || configuredNote?.label;

	const frontmatterLines: string[] = [
		"---",
		`type: note`,
		`title: "${canonicalRef}"`,
		`book: "${data.book.name}"`,
		`chapter: ${data.chapter}`,
		`verses: "${range}"`,
		`bible_version: "${data.versionAbbr}"`,
		`color: "${color}"`,
	];

	if (highlightLabel) {
		frontmatterLines.push(`highlight_label: "${highlightLabel}"`);
	}

	frontmatterLines.push(`reference: "${canonicalRef}"`);
	frontmatterLines.push(`created: "${now}"`);

	if (data.charStart !== undefined && data.charEnd !== undefined) {
		frontmatterLines.push(`char_start: ${data.charStart}`);
		frontmatterLines.push(`char_end: ${data.charEnd}`);
	}
	if (data.selectedText) {
		const escapedText = data.selectedText.replace(/"/g, '\\"');
		frontmatterLines.push(`selected_text: "${escapedText}"`);
	}
	frontmatterLines.push("tags:");
	frontmatterLines.push("  - bible-note");
	frontmatterLines.push("---\n");

	const quoteText = data.selectedText || formatVersesText(data.verses, data.book.name, data.chapter, data.versionAbbr);
	const body = `${quoteText}\n\n## Reflexões\n\n`;

	const content = `${frontmatterLines.join("\n")}${body}`;
	const createdFile = await app.vault.create(candidatePath, content);

	const leaf = app.workspace.getLeaf("tab");
	await leaf.openFile(createdFile);

	return createdFile;
}

export function stripFrontmatter(content: string, app?: App, file?: TFile): string {
	if (app && file) {
		const cache = app.metadataCache.getFileCache(file);
		if (cache?.frontmatterPosition) {
			const endLine = cache.frontmatterPosition.end.line;
			const lines = content.split("\n");
			return lines.slice(endLine + 1).join("\n").trim();
		}
	}
	return content.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "").trim();
}
