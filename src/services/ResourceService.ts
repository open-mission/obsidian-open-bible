import { normalizePath, TFile, type App, type EventRef } from "obsidian";
import type { BibleBook, BibleVerse } from "../models/bible";
import type { BibleResourceFrontmatter, BibleResourceItem, BibleResourceLink } from "../models/resource";
import { DEFAULT_RESOURCE_TYPES, type OpenBibleSettings, type ResourceTypeConfig } from "../settings";
import { getCanonBook } from "../bibleCanon";
import { normalizeText } from "../constants";
import { formatReference, formatVerseRange, formatVersesText } from "./verseFormat";
import { parseVerseRangeString } from "./NoteService";
import { getResourceTypeFolder } from "../core/paths";

function getResourceTypes(settings: OpenBibleSettings): ResourceTypeConfig[] {
	if (settings.configuredResources && settings.configuredResources.length > 0) {
		return settings.configuredResources;
	}
	return DEFAULT_RESOURCE_TYPES;
}

function sanitizeBaseName(name: string): string {
	const clean = name.trim().replace(/\.md$/i, "");
	return clean.replace(/[\\/:*?"<>|]/g, "-").slice(0, 120) || "Recurso";
}

/**
 * Manages complementary resources (people, places, ...) and the verse links
 * pointing to them. Link files mirror the highlight storage model:
 * one `.md` per verse binding with `type: resource-link`.
 */
export class ResourceService {
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
				console.error("OpenBible: error in resource listener", err);
			}
		}
	}

	getResourceTypes(): ResourceTypeConfig[] {
		return getResourceTypes(this.getSettings());
	}

	getResourceType(typeId: string): ResourceTypeConfig | undefined {
		return this.getResourceTypes().find((t) => t.id === typeId);
	}

	resolveTypeFolder(type: ResourceTypeConfig): string {
		const settings = this.getSettings();
		return getResourceTypeFolder(settings.dataFolder, type.id, type.folder);
	}

	// -- Resource files (the target notes) ---------------------------------

	detectResource(file: TFile): BibleResourceItem | null {
		const cache = this.app.metadataCache.getFileCache(file);
		const fm = cache?.frontmatter as BibleResourceFrontmatter | undefined;
		if (!fm) return null;
		if (fm.type !== "resource") return null;
		const resourceType = fm.resource_type ? String(fm.resource_type).trim() : "";
		if (!resourceType) return null;
		const rawImage = fm.image || fm.cover || fm.banner || fm.thumbnail;
		const image = rawImage ? String(rawImage).trim() : undefined;
		return {
			path: file.path,
			name: fm.resource_name ? String(fm.resource_name).trim() : file.basename,
			resourceType,
			title: fm.title ? String(fm.title).trim() : file.basename,
			image,
			mtime: file.stat.mtime,
		};
	}

	getResourcesByType(typeId: string): BibleResourceItem[] {
		const type = this.getResourceType(typeId);
		const folder = type ? this.resolveTypeFolder(type) : null;
		const files = this.app.vault.getMarkdownFiles();
		const results: BibleResourceItem[] = [];
		for (const file of files) {
			if (folder && file.path !== folder && !file.path.startsWith(folder + "/")) {
				// Still accept explicit `type: resource` outside the folder.
				const detected = this.detectResource(file);
				if (detected && detected.resourceType === typeId) {
					results.push(detected);
				}
				continue;
			}
			const detected = this.detectResource(file);
			if (detected && (!typeId || detected.resourceType === typeId)) {
				results.push(detected);
				continue;
			}
			// Fallback: any .md inside the type folder counts as a resource,
			// even before frontmatter is indexed.
			if (folder && (file.path === folder || file.path.startsWith(folder + "/")) && typeId) {
				results.push({
					path: file.path,
					name: file.basename,
					resourceType: typeId,
					title: file.basename,
					mtime: file.stat.mtime,
				});
			}
		}
		return results.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
	}

	getAllResources(): BibleResourceItem[] {
		const files = this.app.vault.getMarkdownFiles();
		const results: BibleResourceItem[] = [];
		const seen = new Set<string>();
		for (const file of files) {
			const detected = this.detectResource(file);
			if (detected && !seen.has(detected.path)) {
				seen.add(detected.path);
				results.push(detected);
			}
		}
		// Include folder-based resources not yet carrying frontmatter.
		for (const type of this.getResourceTypes()) {
			for (const item of this.getResourcesByType(type.id)) {
				if (!seen.has(item.path)) {
					seen.add(item.path);
					results.push(item);
				}
			}
		}
		return results.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
	}

	async ensureResource(typeId: string, name: string): Promise<BibleResourceItem> {
		const type = this.getResourceType(typeId);
		if (!type) throw new Error(`Unknown resource type: ${typeId}`);
		const folder = this.resolveTypeFolder(type);
		if (!(await this.app.vault.adapter.exists(folder))) {
			await this.app.vault.adapter.mkdir(folder);
		}
		const base = sanitizeBaseName(name);
		const existing = this.getResourcesByType(typeId).find(
			(r) => r.name.toLowerCase() === base.toLowerCase(),
		);
		if (existing) return existing;

		let candidatePath = normalizePath(`${folder}/${base}.md`);
		let counter = 1;
		while (await this.app.vault.adapter.exists(candidatePath)) {
			candidatePath = normalizePath(`${folder}/${base} (${counter}).md`);
			counter++;
		}

		const now = new Date().toISOString().slice(0, 16).replace("T", " ");
		const content = [
			"---",
			`type: resource`,
			`resource_type: ${typeId}`,
			`resource_name: "${base.replace(/"/g, '\\"')}"`,
			`title: "${base.replace(/"/g, '\\"')}"`,
			`created: "${now}"`,
			"tags:",
			"  - bible-resource",
			`  - bible-resource-${typeId}`,
			"---",
			"",
			`# ${base}`,
			"",
		].join("\n");
		const createdFile = await this.app.vault.create(candidatePath, content);
		this.notifyChange();
		return {
			path: createdFile.path,
			name: base,
			resourceType: typeId,
			title: base,
			mtime: createdFile.stat.mtime,
		};
	}

	// -- Link files (verse -> resource) ------------------------------------

	detectLink(file: TFile): BibleResourceLink | null {
		const cache = this.app.metadataCache.getFileCache(file);
		const fm = cache?.frontmatter as BibleResourceFrontmatter | undefined;
		if (!fm || fm.type !== "resource-link") return null;
		const resourceType = fm.resource_type ? String(fm.resource_type).trim() : "";
		const resourcePath = fm.resource_path ? String(fm.resource_path).trim() : "";
		if (!resourceType || !resourcePath) return null;
		if (!fm.book || fm.chapter === undefined || fm.chapter === null) return null;

		const rawBook = String(fm.book).replace(/^\[\[/, "").replace(/\]\]$/, "").trim();
		const canon = getCanonBook(rawBook);
		const book = canon ? canon.namePt : rawBook;
		const chapter = Number(fm.chapter);
		if (isNaN(chapter)) return null;
		const verses = parseVerseRangeString(fm.verses);
		const versesStr = fm.verses ? String(fm.verses) : formatVerseRange(verses);
		const resourceName = fm.resource_name
			? String(fm.resource_name).trim()
			: resourcePath.split("/").pop()?.replace(/\.md$/i, "") || resourcePath;
		return {
			path: file.path,
			resourceType,
			resourcePath,
			resourceName,
			book,
			chapter,
			verses,
			versesStr,
			version: fm.bible_version ? String(fm.bible_version).trim() : undefined,
			color: fm.color ? String(fm.color).trim() : "blue",
			reference: fm.reference ? String(fm.reference).trim() : formatReference(book, chapter, verses),
			created: fm.created ? String(fm.created) : undefined,
			charStart: typeof fm.char_start === "number" ? fm.char_start : undefined,
			charEnd: typeof fm.char_end === "number" ? fm.char_end : undefined,
			selectedText: fm.selected_text ? String(fm.selected_text) : undefined,
			matchAllOccurrences: fm.match_all_occurrences === true || fm.match_all === true,
			mtime: file.stat.mtime,
		};
	}

	getAllLinks(typeId?: string): BibleResourceLink[] {
		const files = this.app.vault.getMarkdownFiles();
		const results: BibleResourceLink[] = [];
		for (const file of files) {
			const link = this.detectLink(file);
			if (!link) continue;
			if (typeId && link.resourceType !== typeId) continue;
			results.push(link);
		}
		return results.sort((a, b) => (b.mtime ?? 0) - (a.mtime ?? 0));
	}

	getLinksForChapter(bookName: string, chapter: number, typeId?: string): BibleResourceLink[] {
		const canonTarget = getCanonBook(bookName);
		const targetNorm = normalizeText(canonTarget ? canonTarget.namePt : bookName);
		return this.getAllLinks(typeId).filter((link) => {
			const linkCanon = getCanonBook(link.book);
			const linkNorm = normalizeText(linkCanon ? linkCanon.namePt : link.book);
			return linkNorm === targetNorm && link.chapter === chapter;
		});
	}

	async addOrUpdateLink(data: {
		typeId: string;
		resourcePath: string;
		resourceName: string;
		book: BibleBook;
		chapter: number;
		verses: BibleVerse[];
		versionAbbr: string;
		selectedText?: string;
		charStart?: number;
		charEnd?: number;
		matchAllOccurrences?: boolean;
	}): Promise<BibleResourceLink> {
		const settings = this.getSettings();
		const type = this.getResourceType(data.typeId);
		const folder = type
			? this.resolveTypeFolder(type)
			: getResourceTypeFolder(settings.dataFolder, data.typeId, undefined);
		const linksFolder = normalizePath(`${folder}/links`);
		if (!(await this.app.vault.adapter.exists(linksFolder))) {
			await this.app.vault.adapter.mkdir(linksFolder);
		}

		const verseNumbers = data.verses.map((v) => v.number);
		const range = formatVerseRange(verseNumbers);
		const canonicalRef = formatReference(data.book.name, data.chapter, verseNumbers);

		const existing = this.getLinksForChapter(data.book.name, data.chapter, data.typeId).find((l) => {
			const sameResource = normalizePath(l.resourcePath) === normalizePath(data.resourcePath);
			const sameVerses =
				l.verses.length === verseNumbers.length && l.verses.every((v, i) => v === verseNumbers[i]);
			const sameRange =
				(l.charStart === data.charStart && l.charEnd === data.charEnd) ||
				(l.charStart === undefined && data.charStart === undefined);
			return sameResource && sameVerses && sameRange;
		});
		if (existing) {
			if (data.matchAllOccurrences !== undefined && existing.matchAllOccurrences !== data.matchAllOccurrences) {
				const file = this.app.vault.getAbstractFileByPath(existing.path);
				if (file instanceof TFile) {
					await this.app.fileManager.processFrontMatter(file, (fm) => {
						if (data.matchAllOccurrences) {
							fm.match_all_occurrences = true;
						} else {
							delete fm.match_all_occurrences;
						}
					});
					existing.matchAllOccurrences = data.matchAllOccurrences;
					this.notifyChange();
				}
			}
			return existing;
		}

		let fileStem = `${data.book.name} ${data.chapter}.${range} - ${data.resourceName}`;
		if (data.selectedText) {
			const snippet = data.selectedText.replace(/[^a-zA-Z0-9À-ÿ ]/g, "").slice(0, 20).trim();
			if (snippet) fileStem += ` - ${snippet}`;
		}
		const safeBase = sanitizeBaseName(fileStem);
		let candidatePath = normalizePath(`${linksFolder}/${safeBase}.md`);
		let counter = 1;
		while (await this.app.vault.adapter.exists(candidatePath)) {
			candidatePath = normalizePath(`${linksFolder}/${safeBase} (${counter}).md`);
			counter++;
		}

		const now = new Date().toISOString().slice(0, 16).replace("T", " ");
		const lines: string[] = [
			"---",
			`type: resource-link`,
			`resource_type: ${data.typeId}`,
			`resource_path: "${data.resourcePath.replace(/"/g, '\\"')}"`,
			`resource_name: "${data.resourceName.replace(/"/g, '\\"')}"`,
			`book: "${data.book.name}"`,
			`chapter: ${data.chapter}`,
			`verses: "${range}"`,
			`bible_version: "${data.versionAbbr}"`,
			`color: "${type?.color || "blue"}"`,
			`reference: "${canonicalRef}"`,
			`created: "${now}"`,
		];
		if (data.charStart !== undefined && data.charEnd !== undefined) {
			lines.push(`char_start: ${data.charStart}`);
			lines.push(`char_end: ${data.charEnd}`);
		}
		if (data.selectedText) {
			lines.push(`selected_text: "${data.selectedText.replace(/"/g, '\\"')}"`);
		}
		if (data.matchAllOccurrences) {
			lines.push(`match_all_occurrences: true`);
		}
		lines.push("tags:");
		lines.push("  - bible-resource-link");
		lines.push(`  - bible-resource-${data.typeId}`);
		lines.push("---\n");

		const quoteText =
			data.selectedText || formatVersesText(data.verses, data.book.name, data.chapter, data.versionAbbr);
		const linkTarget = `[[${data.resourcePath}|${data.resourceName}]]`;
		const content = `${lines.join("\n")}${quoteText}\n\n## Recurso\n\n${linkTarget}\n`;
		const createdFile = await this.app.vault.create(candidatePath, content);
		this.notifyChange();
		return {
			path: createdFile.path,
			resourceType: data.typeId,
			resourcePath: data.resourcePath,
			resourceName: data.resourceName,
			book: data.book.name,
			chapter: data.chapter,
			verses: verseNumbers,
			versesStr: range,
			version: data.versionAbbr,
			color: type?.color || "blue",
			reference: canonicalRef,
			created: now,
			charStart: data.charStart,
			charEnd: data.charEnd,
			selectedText: data.selectedText,
			matchAllOccurrences: Boolean(data.matchAllOccurrences),
			mtime: createdFile.stat.mtime,
		};
	}

	async removeLink(path: string): Promise<boolean> {
		const file = this.app.vault.getAbstractFileByPath(path);
		if (file instanceof TFile) {
			await this.app.fileManager.trashFile(file);
			this.notifyChange();
			return true;
		}
		return false;
	}
}
