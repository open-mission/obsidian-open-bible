import {
	normalizePath,
	parseYaml,
	stringifyYaml,
	type App,
	TFile,
} from "obsidian";
import { DATABASE_EXTENSION } from "../constants";

export interface BibleVersionFrontmatter {
	name?: string;
	abbreviation?: string;
	file?: string;
	language?: string;
	default?: boolean;
	[key: string]: unknown;
}

export interface VersionMetadataRecord {
	mdPath: string;
	sqliteFileName: string;
	name: string;
	abbreviation: string;
	language?: string;
	isDefault?: boolean;
	customProperties?: Record<string, unknown>;
}

/**
 * Extracts YAML frontmatter object from markdown content.
 */
export function parseVersionMarkdown(content: string): BibleVersionFrontmatter | null {
	const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
	if (!match) return null;
	try {
		const parsed = parseYaml(match[1]);
		return typeof parsed === "object" && parsed !== null ? (parsed as BibleVersionFrontmatter) : null;
	} catch (e) {
		console.warn("OpenBible: failed to parse YAML frontmatter:", e);
		return null;
	}
}

/**
 * Formats markdown content with updated YAML frontmatter properties.
 * If existing content is provided, preserves any additional frontmatter keys and body text.
 */
export function formatVersionMarkdown(
	updates: BibleVersionFrontmatter,
	existingContent?: string
): string {
	let existingData: Record<string, unknown> = {};
	let body = "";

	if (existingContent) {
		const match = existingContent.match(/^---\r?\n([\s\S]*?)\r?\n---(\r?\n[\s\S]*)?$/);
		if (match) {
			try {
				const parsed = parseYaml(match[1]);
				if (typeof parsed === "object" && parsed !== null) {
					existingData = parsed;
				}
			} catch {
				// Ignore parse error and proceed with merge
			}
			body = match[2] ?? "";
		} else {
			body = `\n\n${existingContent}`;
		}
	} else {
		const title = updates.name || updates.abbreviation || "Bible Version";
		const abbr = updates.abbreviation ? ` (${updates.abbreviation})` : "";
		body = `\n\n# ${title}${abbr}\n`;
	}

	const merged: Record<string, unknown> = {
		...existingData,
		name: updates.name ?? existingData.name ?? "",
		abbreviation: updates.abbreviation ?? existingData.abbreviation ?? "",
		file: updates.file ?? existingData.file ?? "",
		language: updates.language ?? existingData.language ?? "",
		default: updates.default !== undefined ? Boolean(updates.default) : Boolean(existingData.default),
	};

	// Copy other custom properties from updates
	for (const [key, val] of Object.entries(updates)) {
		if (val !== undefined) {
			merged[key] = val;
		}
	}

	const yaml = stringifyYaml(merged).trim();
	return `---\n${yaml}\n---${body}`;
}

/**
 * Reads a markdown file from the vault, utilizing vault cache or adapter as needed.
 */
export async function readMarkdownFile(app: App, path: string): Promise<string | null> {
	const normalized = normalizePath(path);
	try {
		const abstract = app.vault.getAbstractFileByPath(normalized);
		if (abstract instanceof TFile) {
			return await app.vault.read(abstract);
		}
		if (await app.vault.adapter.exists(normalized)) {
			return await app.vault.adapter.read(normalized);
		}
	} catch (e) {
		console.warn("OpenBible: error reading markdown file:", normalized, e);
	}
	return null;
}

/**
 * Writes or updates a markdown file in the vault.
 */
export async function writeMarkdownFile(app: App, path: string, content: string): Promise<void> {
	const normalized = normalizePath(path);
	const abstract = app.vault.getAbstractFileByPath(normalized);
	if (abstract instanceof TFile) {
		await app.vault.modify(abstract, content);
	} else if (await app.vault.adapter.exists(normalized)) {
		await app.vault.adapter.write(normalized, content);
	} else {
		try {
			await app.vault.create(normalized, content);
		} catch {
			await app.vault.adapter.write(normalized, content);
		}
	}
}

/**
 * Safely removes or trashes a markdown file from the vault.
 */
export async function deleteMarkdownFile(app: App, path: string): Promise<void> {
	const normalized = normalizePath(path);
	try {
		const abstract = app.vault.getAbstractFileByPath(normalized);
		if (abstract instanceof TFile) {
			await app.vault.trash(abstract, false);
		} else if (await app.vault.adapter.exists(normalized)) {
			await app.vault.adapter.remove(normalized);
		}
	} catch (e) {
		console.warn("OpenBible: error removing metadata file:", normalized, e);
	}
}

/**
 * Derives a clean, safe markdown file name for a version based on its abbreviation or file stem.
 */
export function getVersionMarkdownPath(folder: string, abbreviation: string, sqliteFilename: string): string {
	const cleanAbbr = abbreviation.trim().replace(/[/\\?%*:|"<>]/g, "");
	const stem = sqliteFilename.replace(DATABASE_EXTENSION, "").trim();
	const base = cleanAbbr || stem || "version";
	return normalizePath(`${folder}/${base}.md`);
}
