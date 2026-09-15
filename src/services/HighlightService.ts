import { normalizePath, TFile, type App, type EventRef } from "obsidian";
import type { BibleBook, BibleVerse } from "../models/bible";
import type { BibleNoteFrontmatter, BibleNoteItem } from "../models/note";
import type { OpenBibleSettings } from "../settings";
import { getCanonBook } from "../bibleCanon";
import { normalizeText } from "../constants";
import { formatReference, formatVerseRange, formatVersesText } from "./verseFormat";
import { parseVerseRangeString } from "./NoteService";
import { getHighlightsFolder } from "../core/paths";

export class HighlightService {
	private app: App;
	private getSettings: () => OpenBibleSettings;
	private listeners: Set<() => void> = new Set();
	private eventRefs: EventRef[] = [];

	constructor(app: App, getSettings: () => OpenBibleSettings) {
		this.app = app;
		this.getSettings = getSettings;
		this.registerVaultEvents();
	}

	private registerVaultEvents(): void {
		const notify = () => this.notifyChange();
		this.eventRefs.push(this.app.vault.on("create", notify));
		this.eventRefs.push(this.app.vault.on("delete", notify));
		this.eventRefs.push(this.app.vault.on("rename", notify));
		this.eventRefs.push(this.app.metadataCache.on("changed", notify));
	}

	destroy(): void {
		for (const ref of this.eventRefs) {
			this.app.vault.offref(ref);
		}
		this.eventRefs = [];
		this.listeners.clear();
	}

	subscribe(listener: () => void): () => void {
		this.listeners.add(listener);
		return () => {
			this.listeners.delete(listener);
		};
	}

	private notifyChange(): void {
		for (const listener of this.listeners) {
			try {
				listener();
			} catch (err) {
				console.error("OpenBible: error in highlight listener", err);
			}
		}
	}

	detectHighlight(file: TFile): BibleNoteItem | null {
		const cache = this.app.metadataCache.getFileCache(file);
		const fm = cache?.frontmatter as BibleNoteFrontmatter | undefined;

		if (!fm) return null;

		const settings = this.getSettings();
		const cleanFolder = settings.highlightsFolder?.trim();
		const isStrictFolder = Boolean(
			cleanFolder && cleanFolder !== "/" && file.path.startsWith(normalizePath(cleanFolder) + "/")
		);
		const isHighlightType = fm.type === "highlight";

		if (!isHighlightType && !isStrictFolder) {
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
		const configuredHl = (settings.configuredHighlights || []).find(
			(h) => h.id === color || h.color === color
		);
		const highlightLabel = fm.highlight_label
			? String(fm.highlight_label).trim()
			: configuredHl?.label;
		const reference =
			fm.reference ? String(fm.reference).trim() : formatReference(detectedBook, detectedChapter, detectedVerses);
		const versesStr = fm.verses ? String(fm.verses) : formatVerseRange(detectedVerses);

		return {
			path: file.path,
			type: "highlight",
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

	getHighlightsForChapter(bookName: string, chapter: number): BibleNoteItem[] {
		const canonTarget = getCanonBook(bookName);
		const targetNorm = normalizeText(canonTarget ? canonTarget.namePt : bookName);
		const files = this.app.vault.getMarkdownFiles();
		const results: BibleNoteItem[] = [];

		for (const file of files) {
			const hl = this.detectHighlight(file);
			if (!hl) continue;

			const hlCanon = getCanonBook(hl.book);
			const hlNorm = normalizeText(hlCanon ? hlCanon.namePt : hl.book);

			if (hlNorm === targetNorm && hl.chapter === chapter) {
				results.push(hl);
			}
		}

		return results.sort((a, b) => (b.mtime ?? 0) - (a.mtime ?? 0));
	}

	getAllHighlights(): BibleNoteItem[] {
		const files = this.app.vault.getMarkdownFiles();
		const results: BibleNoteItem[] = [];

		for (const file of files) {
			const hl = this.detectHighlight(file);
			if (hl) {
				results.push(hl);
			}
		}

		return results.sort((a, b) => (b.mtime ?? 0) - (a.mtime ?? 0));
	}

	async addOrUpdateHighlight(data: {
		book: BibleBook;
		chapter: number;
		verses: BibleVerse[];
		versionAbbr: string;
		color: string;
		label?: string;
		selectedText?: string;
		charStart?: number;
		charEnd?: number;
	}): Promise<BibleNoteItem> {
		const settings = this.getSettings();
		const folder = getHighlightsFolder(settings.dataFolder, settings.highlightsFolder);

		if (!(await this.app.vault.adapter.exists(folder))) {
			await this.app.vault.adapter.mkdir(folder);
		}

		const configuredHl = (settings.configuredHighlights || []).find(
			(h) => h.id === data.color || h.color === data.color
		);
		const highlightLabel = data.label || configuredHl?.label || data.color;

		const verseNumbers = data.verses.map((v) => v.number);
		const range = formatVerseRange(verseNumbers);
		const canonicalRef = formatReference(data.book.name, data.chapter, verseNumbers);

		// Check if exact highlight already exists for these verses & range
		const chapterHighlights = this.getHighlightsForChapter(data.book.name, data.chapter);
		const existing = chapterHighlights.find((h) => {
			const sameVerses =
				h.verses.length === verseNumbers.length &&
				h.verses.every((v, i) => v === verseNumbers[i]);
			const sameRange =
				(h.charStart === data.charStart && h.charEnd === data.charEnd) ||
				(h.charStart === undefined && data.charStart === undefined);
			return sameVerses && sameRange;
		});

		if (existing) {
			const file = this.app.vault.getAbstractFileByPath(existing.path);
			if (file instanceof TFile) {
				await this.app.fileManager.processFrontMatter(file, (fm) => {
					fm.color = data.color;
					fm.highlight_label = highlightLabel;
					fm.bible_version = data.versionAbbr;
				});
				existing.color = data.color;
				existing.highlightLabel = highlightLabel;
				this.notifyChange();
				return existing;
			}
		}

		let fileStem = `${data.book.name} ${data.chapter}.${range} - ${data.color}`;
		if (data.selectedText) {
			const cleanSnippet = data.selectedText.replace(/[^a-zA-Z0-9À-ÿ ]/g, "").slice(0, 20).trim();
			if (cleanSnippet) {
				fileStem += ` - ${cleanSnippet}`;
			}
		}
		const safeBase = fileStem.replace(/[\\/:*?"<>|]/g, "-");

		let candidatePath = normalizePath(`${folder}/${safeBase}.md`);
		let counter = 1;
		while (await this.app.vault.adapter.exists(candidatePath)) {
			candidatePath = normalizePath(`${folder}/${safeBase} (${counter}).md`);
			counter++;
		}

		const now = new Date().toISOString().slice(0, 16).replace("T", " ");

		const frontmatterLines: string[] = [
			"---",
			`type: highlight`,
			`book: "${data.book.name}"`,
			`chapter: ${data.chapter}`,
			`verses: "${range}"`,
			`bible_version: "${data.versionAbbr}"`,
			`color: "${data.color}"`,
			`highlight_label: "${highlightLabel}"`,
			`reference: "${canonicalRef}"`,
			`created: "${now}"`,
		];

		if (data.charStart !== undefined && data.charEnd !== undefined) {
			frontmatterLines.push(`char_start: ${data.charStart}`);
			frontmatterLines.push(`char_end: ${data.charEnd}`);
		}
		if (data.selectedText) {
			const escaped = data.selectedText.replace(/"/g, '\\"');
			frontmatterLines.push(`selected_text: "${escaped}"`);
		}
		frontmatterLines.push("tags:");
		frontmatterLines.push("  - bible-highlight");
		frontmatterLines.push("---\n");

		const quoteText = data.selectedText || formatVersesText(data.verses, data.book.name, data.chapter, data.versionAbbr);
		const content = `${frontmatterLines.join("\n")}${quoteText}\n`;

		const createdFile = await this.app.vault.create(candidatePath, content);
		this.notifyChange();

		return {
			path: createdFile.path,
			type: "highlight",
			title: canonicalRef,
			book: data.book.name,
			chapter: data.chapter,
			verses: verseNumbers,
			versesStr: range,
			version: data.versionAbbr,
			color: data.color,
			highlightLabel,
			reference: canonicalRef,
			created: now,
			charStart: data.charStart,
			charEnd: data.charEnd,
			selectedText: data.selectedText,
			mtime: createdFile.stat.mtime,
		};
	}

	async removeHighlight(path: string): Promise<boolean> {
		const file = this.app.vault.getAbstractFileByPath(path);
		if (file instanceof TFile) {
			await this.app.fileManager.trashFile(file);
			this.notifyChange();
			return true;
		}
		return false;
	}

	async removeHighlightForVerses(
		bookName: string,
		chapter: number,
		verses: number[]
	): Promise<boolean> {
		const chapterHighlights = this.getHighlightsForChapter(bookName, chapter);
		const targetSet = new Set(verses);

		let removed = false;
		for (const hl of chapterHighlights) {
			const hasOverlap = hl.verses.some((v) => targetSet.has(v));
			if (hasOverlap) {
				const file = this.app.vault.getAbstractFileByPath(hl.path);
				if (file instanceof TFile) {
					await this.app.fileManager.trashFile(file);
					removed = true;
				}
			}
		}

		if (removed) {
			this.notifyChange();
		}
		return removed;
	}
}
