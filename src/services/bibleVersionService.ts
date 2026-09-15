import { normalizePath, type App, TFile } from "obsidian";
import defaultVersionsData from "../data/version.json";
import { getVersionsFolder } from "../core/paths";
import { t } from "../i18n";
import {
	DATABASE_EXTENSION,
	DEFAULT_DATA_FOLDER,
	DEFAULT_DATABASE_FOLDER,
	PLUGIN_FOLDER,
	LEGACY_PLUGIN_FOLDER,
	abbreviationFromFilename,
	hasSqliteHeader,
	sanitizeDatabaseName,
} from "../constants";
import type { BibleVersion } from "../models/bibleVersion";
import type { OpenBibleSettings } from "../settings";
import {
	parseVersionMarkdown,
	formatVersionMarkdown,
	readMarkdownFile,
	writeMarkdownFile,
	deleteMarkdownFile,
	getVersionMarkdownPath,
} from "./versionMetadata";

export interface BibleVersionEntry {
	name: string;
	abbreviation: string;
	file?: string;
	aliases?: string[];
}

export interface ResolvedVersionInfo {
	name: string;
	abbreviation: string;
	language?: string;
}

/**
 * Access point for SQLite files in the vault.
 * Scans directories, resolves translation names/abbreviations via registry,
 * Markdown properties files (.md in versions/), and SQLite metadata.
 */
export class BibleVersionService {
	private versionRegistry: BibleVersionEntry[] = [];
	private metadataCache = new Map<string, ResolvedVersionInfo>();
	private mdPathToSqlitePath = new Map<string, string>();
	private sqlitePathToMdPath = new Map<string, string>();

	constructor(
		private readonly app: App,
		private readonly getSettings: () => OpenBibleSettings,
		private readonly onSaveSettings?: () => Promise<void>,
	) {
		this.loadVersionRegistry();
	}

	getVersionsFolder(): string {
		return getVersionsFolder(this.getSettings().dataFolder);
	}

	async ensureVersionsFolder(): Promise<void> {
		const folder = this.getVersionsFolder();
		if (!(await this.app.vault.adapter.exists(folder))) {
			await this.app.vault.adapter.mkdir(folder);
		}
	}

	loadVersionRegistry(): void {
		this.versionRegistry = [...(defaultVersionsData as BibleVersionEntry[])];
	}

	/**
	 * Allows BibleTextService or caller to inject verified metadata from the SQLite DB.
	 */
	setCachedMetadata(pathOrFilename: string, info: ResolvedVersionInfo): void {
		const filename = pathOrFilename.includes("/")
			? pathOrFilename.slice(pathOrFilename.lastIndexOf("/") + 1)
			: pathOrFilename;
		this.metadataCache.set(pathOrFilename, info);
		this.metadataCache.set(filename, info);
	}

	/**
	 * Returns the path to the .md metadata note for a SQLite database if known.
	 */
	getMetadataFilePath(sqlitePathOrFilename: string): string | undefined {
		const filename = sqlitePathOrFilename.includes("/")
			? sqlitePathOrFilename.slice(sqlitePathOrFilename.lastIndexOf("/") + 1)
			: sqlitePathOrFilename;
		return this.sqlitePathToMdPath.get(sqlitePathOrFilename) ?? this.sqlitePathToMdPath.get(filename);
	}

	/**
	 * Synchronously resolves version name, abbreviation, and language.
	 * Checks in-memory cache, synchronous Obsidian metadata cache for .md files,
	 * settings, registry, and filename heuristics.
	 */
	resolveVersionInfo(filenameOrPath: string): ResolvedVersionInfo {
		const filename = filenameOrPath.includes("/")
			? filenameOrPath.slice(filenameOrPath.lastIndexOf("/") + 1)
			: filenameOrPath;
		const base = filename.replace(DATABASE_EXTENSION, "").trim();
		const candidateAbbr = abbreviationFromFilename(filename);

		// 1. Check in-memory metadata cache (populated from .md files)
		const cached = this.metadataCache.get(filenameOrPath) ?? this.metadataCache.get(filename);
		if (cached) {
			return cached;
		}

		// 2. Check Obsidian metadata cache if an associated .md file is known
		const mdPath = this.sqlitePathToMdPath.get(filenameOrPath) ?? this.sqlitePathToMdPath.get(filename);
		if (mdPath) {
			const abstract = this.app.vault.getAbstractFileByPath(mdPath);
			if (abstract instanceof TFile) {
				const fileCache = this.app.metadataCache.getFileCache(abstract);
				const fm = fileCache?.frontmatter;
				if (fm && (fm.name || fm.abbreviation)) {
					const info: ResolvedVersionInfo = {
						name: String(fm.name || base),
						abbreviation: String(fm.abbreviation || candidateAbbr),
						language: fm.language ? String(fm.language) : undefined,
					};
					this.setCachedMetadata(filenameOrPath, info);
					return info;
				}
			}
		}

		// 3. Check custom user-defined metadata in settings (for fallback/backwards compatibility)
		const settings = this.getSettings();
		const custom =
			settings.customVersionMetadata?.[filenameOrPath] ??
			(filename !== filenameOrPath ? settings.customVersionMetadata?.[filename] : undefined);
		if (custom && (custom.name || custom.abbreviation || custom.language)) {
			return {
				name: custom.name || base,
				abbreviation: custom.abbreviation || candidateAbbr,
				language: custom.language,
			};
		}

		// 4. Check registry
		const lowerFilename = filename.toLowerCase();
		const lowerBase = base.toLowerCase();
		const upperAbbr = candidateAbbr.toUpperCase();

		for (const entry of this.versionRegistry) {
			const entryFile = (entry.file ?? "").toLowerCase();
			const entryBase = entryFile.replace(DATABASE_EXTENSION, "");
			const entryAbbr = (entry.abbreviation ?? "").toUpperCase();
			const entryName = (entry.name ?? "").toLowerCase();

			if (entryFile && (entryFile === lowerFilename || entryBase === lowerBase)) {
				return { name: entry.name, abbreviation: entry.abbreviation };
			}
			if (entryAbbr && entryAbbr === upperAbbr) {
				return { name: entry.name, abbreviation: entry.abbreviation };
			}
			if (entryAbbr && lowerBase === entryAbbr.toLowerCase()) {
				return { name: entry.name, abbreviation: entry.abbreviation };
			}
			if (
				entryAbbr &&
				(lowerBase.endsWith(`_${entryAbbr.toLowerCase()}`) ||
					lowerBase.endsWith(`-${entryAbbr.toLowerCase()}`))
			) {
				return { name: entry.name, abbreviation: entry.abbreviation };
			}
			if (entryName && entryName === lowerBase) {
				return { name: entry.name, abbreviation: entry.abbreviation };
			}
			if (entry.aliases && Array.isArray(entry.aliases)) {
				for (const alias of entry.aliases) {
					const lowerAlias = String(alias).toLowerCase();
					if (
						lowerAlias === lowerFilename ||
						lowerAlias === lowerBase ||
						lowerAlias === upperAbbr.toLowerCase()
					) {
						return { name: entry.name, abbreviation: entry.abbreviation };
					}
				}
			}
		}

		const cleanStem = base.replace(/^bibles?[-_]/i, "").replace(/[_-]+/g, " ").trim();
		return {
			name: cleanStem || base,
			abbreviation: candidateAbbr,
		};
	}

	/**
	 * Scans .md files in the given folder and registers their frontmatter properties.
	 */
	async syncMetadataInFolder(folder: string): Promise<void> {
		try {
			if (!(await this.app.vault.adapter.exists(folder))) return;
			const listing = await this.app.vault.adapter.list(folder);

			for (const mdPath of listing.files) {
				if (!mdPath.endsWith(".md")) continue;
				const content = await readMarkdownFile(this.app, mdPath);
				if (!content) continue;

				const fm = parseVersionMarkdown(content);
				if (!fm) continue;

				// Determine referenced SQLite file
				let sqliteFileName = fm.file ? String(fm.file).trim() : "";
				if (!sqliteFileName) {
					// Fallback: match by stem
					const mdStem = mdPath.slice(mdPath.lastIndexOf("/") + 1).replace(/\.md$/, "");
					sqliteFileName = `${mdStem}.sqlite`;
				}

				const sqlitePath = sqliteFileName.includes("/")
					? normalizePath(sqliteFileName)
					: normalizePath(`${folder}/${sqliteFileName}`);

				const name = fm.name ? String(fm.name).trim() : "";
				const abbreviation = fm.abbreviation ? String(fm.abbreviation).trim() : "";
				const language = fm.language ? String(fm.language).trim() : undefined;

				if (name || abbreviation) {
					const info: ResolvedVersionInfo = {
						name: name || abbreviation,
						abbreviation: abbreviation || name,
						language,
					};
					this.setCachedMetadata(sqlitePath, info);
					this.sqlitePathToMdPath.set(sqlitePath, mdPath);
					this.sqlitePathToMdPath.set(sqliteFileName, mdPath);
					this.mdPathToSqlitePath.set(mdPath, sqlitePath);
				}

				// If frontmatter defines this as default and settings has none, synchronize
				if (fm.default === true && !this.getSettings().defaultVersionPath) {
					this.getSettings().defaultVersionPath = sqlitePath;
					void this.onSaveSettings?.();
				}
			}
		} catch (error) {
			console.warn("OpenBible: error scanning metadata folder:", folder, error);
		}
	}

	/**
	 * Ensures a corresponding .md metadata file exists for an installed SQLite database.
	 */
	async ensureMetadataFileForSqlite(folder: string, sqlitePath: string): Promise<string> {
		const filename = sqlitePath.slice(sqlitePath.lastIndexOf("/") + 1);
		const existingMd = this.sqlitePathToMdPath.get(sqlitePath) ?? this.sqlitePathToMdPath.get(filename);
		if (existingMd && (await this.app.vault.adapter.exists(existingMd))) {
			return existingMd;
		}

		const info = this.resolveVersionInfo(sqlitePath);
		const defaultPath = this.getSettings().defaultVersionPath;
		const isDefault = Boolean(
			defaultPath &&
			(defaultPath === sqlitePath || defaultPath === filename || defaultPath.endsWith(`/${filename}`))
		);

		let candidatePath = getVersionMarkdownPath(folder, info.abbreviation, filename);
		if (await this.app.vault.adapter.exists(candidatePath)) {
			// Check if candidate points to another file
			const content = await readMarkdownFile(this.app, candidatePath);
			const fm = content ? parseVersionMarkdown(content) : null;
			if (fm?.file && fm.file !== filename) {
				const stem = filename.replace(DATABASE_EXTENSION, "");
				candidatePath = normalizePath(`${folder}/${stem}.md`);
			}
		}

		const mdContent = formatVersionMarkdown({
			name: info.name,
			abbreviation: info.abbreviation,
			file: filename,
			language: info.language,
			default: isDefault,
		});

		await writeMarkdownFile(this.app, candidatePath, mdContent);

		this.sqlitePathToMdPath.set(sqlitePath, candidatePath);
		this.sqlitePathToMdPath.set(filename, candidatePath);
		this.mdPathToSqlitePath.set(candidatePath, sqlitePath);

		return candidatePath;
	}

	async listVersions(): Promise<BibleVersion[]> {
		await this.ensureVersionsFolder();
		const primaryFolder = this.getVersionsFolder();
		const pluginDir = normalizePath(`${PLUGIN_FOLDER}/bibles`);
		const legacyDir = normalizePath(`${LEGACY_PLUGIN_FOLDER}/bibles`);
		const defaultFolder = normalizePath(`${DEFAULT_DATA_FOLDER}/${DEFAULT_DATABASE_FOLDER}`);

		// 1. Sync metadata from .md files in the primary folder
		await this.syncMetadataInFolder(primaryFolder);

		const results: BibleVersion[] = [];
		const seenNames = new Set<string>();

		const collectFrom = async (dir: string, isPrimary: boolean): Promise<void> => {
			try {
				if (!(await this.app.vault.adapter.exists(dir))) return;
				const listing = await this.app.vault.adapter.list(dir);
				for (const path of listing.files) {
					if (!DATABASE_EXTENSION.test(path)) continue;
					const name = path.slice(path.lastIndexOf("/") + 1);
					if (seenNames.has(name)) continue;
					seenNames.add(name);

					let mdPath = this.sqlitePathToMdPath.get(path) ?? this.sqlitePathToMdPath.get(name);
					// Auto-generate .md file in primary folder if missing
					if (isPrimary && !mdPath) {
						mdPath = await this.ensureMetadataFileForSqlite(primaryFolder, path);
					}

					const info = this.resolveVersionInfo(path);
					const defaultPath = this.getSettings().defaultVersionPath;
					const isDefault = Boolean(
						defaultPath &&
						(defaultPath === path || defaultPath === name || defaultPath.endsWith(`/${name}`))
					);
					results.push({
						id: path,
						name: info.name,
						abbreviation: info.abbreviation,
						filePath: path,
						language: info.language,
						isDefault,
						mdPath,
					});
				}
			} catch (error) {
				console.warn("OpenBible: error listing version folder:", dir, error);
			}
		};

		await collectFrom(primaryFolder, true);
		if (primaryFolder !== defaultFolder) {
			await collectFrom(defaultFolder, false);
		}
		if (primaryFolder !== pluginDir && defaultFolder !== pluginDir) {
			await collectFrom(pluginDir, false);
		}
		if (primaryFolder !== legacyDir && defaultFolder !== legacyDir && pluginDir !== legacyDir) {
			await collectFrom(legacyDir, false);
		}

		return results.sort((a, b) => a.name.localeCompare(b.name));
	}

	async importVersion(file: File): Promise<BibleVersion> {
		const contents = await file.arrayBuffer();
		if (!DATABASE_EXTENSION.test(file.name) && !hasSqliteHeader(contents)) {
			throw new Error(t("errors.invalidDatabaseFile"));
		}
		await this.ensureVersionsFolder();
		const filename = await this.uniqueFilename(file.name);
		const folder = this.getVersionsFolder();
		const filePath = normalizePath(`${folder}/${filename}`);
		await this.app.vault.adapter.writeBinary(filePath, contents);

		const info = this.resolveVersionInfo(filePath);
		const currentDefault = this.getSettings().defaultVersionPath;
		const isDefault = !currentDefault;

		if (isDefault) {
			this.getSettings().defaultVersionPath = filePath;
			this.getSettings().previewDefaultVersion = info.abbreviation;
			await this.onSaveSettings?.();
		}

		// Create corresponding .md properties file (e.g. ACF.md)
		let mdPath = getVersionMarkdownPath(folder, info.abbreviation, filename);
		if (await this.app.vault.adapter.exists(mdPath)) {
			const stem = filename.replace(DATABASE_EXTENSION, "");
			mdPath = normalizePath(`${folder}/${stem}.md`);
		}

		const mdContent = formatVersionMarkdown({
			name: info.name,
			abbreviation: info.abbreviation,
			file: filename,
			language: info.language,
			default: isDefault,
		});
		await writeMarkdownFile(this.app, mdPath, mdContent);

		this.sqlitePathToMdPath.set(filePath, mdPath);
		this.sqlitePathToMdPath.set(filename, mdPath);
		this.mdPathToSqlitePath.set(mdPath, filePath);
		this.setCachedMetadata(filePath, info);

		return {
			id: filePath,
			name: info.name,
			abbreviation: info.abbreviation,
			filePath,
			language: info.language,
			isDefault,
			mdPath,
		};
	}

	async removeVersion(filePath: string): Promise<void> {
		const normalized = normalizePath(filePath);
		if (!DATABASE_EXTENSION.test(normalized)) {
			throw new Error(t("errors.invalidDatabasePath"));
		}

		// 1. Remove binary SQLite file
		if (await this.app.vault.adapter.exists(normalized)) {
			await this.app.vault.adapter.remove(normalized);
		}

		// 2. Remove associated .md file
		const filename = normalized.slice(normalized.lastIndexOf("/") + 1);
		const mdPath = this.sqlitePathToMdPath.get(normalized) ?? this.sqlitePathToMdPath.get(filename);
		if (mdPath) {
			await deleteMarkdownFile(this.app, mdPath);
			this.mdPathToSqlitePath.delete(mdPath);
			this.sqlitePathToMdPath.delete(normalized);
			this.sqlitePathToMdPath.delete(filename);
		} else {
			const folder = this.getVersionsFolder();
			const info = this.resolveVersionInfo(normalized);
			const candidateMd = getVersionMarkdownPath(folder, info.abbreviation, filename);
			if (await this.app.vault.adapter.exists(candidateMd)) {
				await deleteMarkdownFile(this.app, candidateMd);
			}
		}

		// 3. Clear cache and settings
		this.metadataCache.delete(normalized);
		this.metadataCache.delete(filename);

		const settings = this.getSettings();
		if (settings.customVersionMetadata) {
			delete settings.customVersionMetadata[normalized];
			delete settings.customVersionMetadata[filename];
		}
		if (settings.defaultVersionPath === normalized || settings.defaultVersionPath === filename) {
			settings.defaultVersionPath = "";
		}
		await this.onSaveSettings?.();
	}

	async updateVersionMetadata(
		filePath: string,
		metadata: { name?: string; abbreviation?: string; language?: string; isDefault?: boolean }
	): Promise<void> {
		const folder = this.getVersionsFolder();
		const filename = filePath.slice(filePath.lastIndexOf("/") + 1);

		let mdPath = this.sqlitePathToMdPath.get(filePath) ?? this.sqlitePathToMdPath.get(filename);
		if (!mdPath) {
			mdPath = await this.ensureMetadataFileForSqlite(folder, filePath);
		}

		const existingContent = mdPath ? (await readMarkdownFile(this.app, mdPath)) ?? "" : "";
		const currentInfo = this.resolveVersionInfo(filePath);

		const newName = metadata.name !== undefined ? metadata.name : currentInfo.name;
		const newAbbr = metadata.abbreviation !== undefined ? metadata.abbreviation : currentInfo.abbreviation;
		const newLang = metadata.language !== undefined ? metadata.language : currentInfo.language;
		const isDefault = metadata.isDefault !== undefined
			? metadata.isDefault
			: Boolean(this.getSettings().defaultVersionPath === filePath);

		const updatedContent = formatVersionMarkdown(
			{
				name: newName,
				abbreviation: newAbbr,
				file: filename,
				language: newLang,
				default: isDefault,
			},
			existingContent
		);

		// If abbreviation changed, attempt to rename .md file to match
		let targetMdPath = mdPath;
		if (newAbbr && newAbbr !== currentInfo.abbreviation) {
			const candidateNewPath = getVersionMarkdownPath(folder, newAbbr, filename);
			if (candidateNewPath !== mdPath && !(await this.app.vault.adapter.exists(candidateNewPath))) {
				targetMdPath = candidateNewPath;
				try {
					const abstract = this.app.vault.getAbstractFileByPath(mdPath);
					if (abstract instanceof TFile) {
						await this.app.fileManager.renameFile(abstract, targetMdPath);
					} else {
						await this.app.vault.adapter.rename(mdPath, targetMdPath);
					}
					this.mdPathToSqlitePath.delete(mdPath);
				} catch (e) {
					console.warn("OpenBible: error renaming metadata file to match new abbreviation:", e);
					targetMdPath = mdPath;
				}
			}
		}

		await writeMarkdownFile(this.app, targetMdPath, updatedContent);

		this.sqlitePathToMdPath.set(filePath, targetMdPath);
		this.sqlitePathToMdPath.set(filename, targetMdPath);
		this.mdPathToSqlitePath.set(targetMdPath, filePath);

		this.setCachedMetadata(filePath, {
			name: newName,
			abbreviation: newAbbr,
			language: newLang,
		});

		if (metadata.isDefault !== undefined) {
			if (metadata.isDefault) {
				await this.setDefaultVersion(filePath);
			} else if (this.getSettings().defaultVersionPath === filePath) {
				await this.setDefaultVersion("");
			}
		}

		// Also update settings.customVersionMetadata for compatibility
		const settings = this.getSettings();
		if (!settings.customVersionMetadata) {
			settings.customVersionMetadata = {};
		}
		settings.customVersionMetadata[filePath] = {
			name: newName,
			abbreviation: newAbbr,
			language: newLang,
		};

		await this.onSaveSettings?.();
	}

	async setDefaultVersion(filePath: string): Promise<void> {
		const settings = this.getSettings();
		settings.defaultVersionPath = filePath;
		if (filePath) {
			const info = this.resolveVersionInfo(filePath);
			settings.previewDefaultVersion = info.abbreviation;
		}
		await this.onSaveSettings?.();

		// Update default property across all .md files in the versions directory
		const folder = this.getVersionsFolder();
		try {
			if (await this.app.vault.adapter.exists(folder)) {
				const listing = await this.app.vault.adapter.list(folder);
				for (const path of listing.files) {
					if (!path.endsWith(".md")) continue;
					const content = await readMarkdownFile(this.app, path);
					if (!content) continue;
					const fm = parseVersionMarkdown(content);
					if (!fm || !fm.file) continue;

					const matches = Boolean(
						filePath && (
							filePath === fm.file ||
							filePath.endsWith("/" + fm.file) ||
							path === this.sqlitePathToMdPath.get(filePath)
						)
					);

					if (Boolean(fm.default) !== matches) {
						const updated = formatVersionMarkdown({ default: matches }, content);
						await writeMarkdownFile(this.app, path, updated);
					}
				}
			}
		} catch (e) {
			console.warn("OpenBible: error updating default flag in metadata files:", e);
		}
	}

	/**
	 * Handles changes to .md files inside the versions folder when edited by user in Obsidian.
	 */
	async handleVaultFileChange(file: TFile): Promise<void> {
		if (file.extension !== "md") return;
		const versionsFolder = this.getVersionsFolder();
		if (!file.path.startsWith(versionsFolder)) return;

		const content = await readMarkdownFile(this.app, file.path);
		if (!content) return;
		const fm = parseVersionMarkdown(content);
		if (!fm) return;

		let sqliteFileName = fm.file ? String(fm.file).trim() : "";
		if (!sqliteFileName) {
			sqliteFileName = `${file.basename}.sqlite`;
		}

		const sqlitePath = sqliteFileName.includes("/")
			? normalizePath(sqliteFileName)
			: normalizePath(`${versionsFolder}/${sqliteFileName}`);

		const name = fm.name ? String(fm.name).trim() : "";
		const abbreviation = fm.abbreviation ? String(fm.abbreviation).trim() : "";
		const language = fm.language ? String(fm.language).trim() : undefined;

		if (name || abbreviation) {
			this.setCachedMetadata(sqlitePath, {
				name: name || abbreviation,
				abbreviation: abbreviation || name,
				language,
			});
			this.sqlitePathToMdPath.set(sqlitePath, file.path);
			this.sqlitePathToMdPath.set(sqliteFileName, file.path);
			this.mdPathToSqlitePath.set(file.path, sqlitePath);
		}

		if (fm.default === true && this.getSettings().defaultVersionPath !== sqlitePath) {
			this.getSettings().defaultVersionPath = sqlitePath;
			void this.onSaveSettings?.();
		}
	}

	handleVaultFileDelete(file: TFile): void {
		if (file.extension !== "md") return;
		const versionsFolder = this.getVersionsFolder();
		if (!file.path.startsWith(versionsFolder)) return;

		const sqlitePath = this.mdPathToSqlitePath.get(file.path);
		if (sqlitePath) {
			this.mdPathToSqlitePath.delete(file.path);
			const filename = sqlitePath.slice(sqlitePath.lastIndexOf("/") + 1);
			this.sqlitePathToMdPath.delete(sqlitePath);
			this.sqlitePathToMdPath.delete(filename);
			this.metadataCache.delete(sqlitePath);
			this.metadataCache.delete(filename);
		}
	}

	toBibleVersion(filePath: string): BibleVersion {
		const filename = filePath.slice(filePath.lastIndexOf("/") + 1);
		const info = this.resolveVersionInfo(filePath);
		const defaultPath = this.getSettings().defaultVersionPath;
		const isDefault = Boolean(
			defaultPath &&
			(defaultPath === filePath || defaultPath === filename || defaultPath.endsWith(`/${filename}`))
		);
		const mdPath = this.sqlitePathToMdPath.get(filePath) ?? this.sqlitePathToMdPath.get(filename);
		return {
			id: filePath,
			name: info.name,
			abbreviation: info.abbreviation,
			filePath,
			language: info.language,
			isDefault,
			mdPath,
		};
	}

	private async uniqueFilename(originalName: string): Promise<string> {
		const leaf = originalName.split(/[\\/]/).pop() ?? originalName;
		const extension = leaf.match(DATABASE_EXTENSION)?.[0].toLowerCase() ?? ".sqlite";
		const stem = sanitizeDatabaseName(leaf.replace(DATABASE_EXTENSION, "")) || "versao-biblia";
		const folder = this.getVersionsFolder();
		let candidate = `${stem}${extension}`;
		let counter = 2;
		while (await this.app.vault.adapter.exists(normalizePath(`${folder}/${candidate}`))) {
			candidate = `${stem} (${counter})${extension}`;
			counter += 1;
		}
		return candidate;
	}
}
