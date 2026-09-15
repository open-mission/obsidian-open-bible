import { normalizePath, type App } from "obsidian";
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
 * Scans directories, resolves translation names/abbreviations via registry, custom metadata, and SQLite metadata.
 */
export class BibleVersionService {
	private versionRegistry: BibleVersionEntry[] = [];
	private metadataCache = new Map<string, ResolvedVersionInfo>();

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

	resolveVersionInfo(filenameOrPath: string): ResolvedVersionInfo {
		const filename = filenameOrPath.includes("/")
			? filenameOrPath.slice(filenameOrPath.lastIndexOf("/") + 1)
			: filenameOrPath;
		const base = filename.replace(DATABASE_EXTENSION, "").trim();
		const candidateAbbr = abbreviationFromFilename(filename);

		// 1. Check custom user-defined metadata in settings first
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

		// 2. Check metadata cache
		const cached = this.metadataCache.get(filenameOrPath) ?? this.metadataCache.get(filename);
		if (cached) {
			return cached;
		}

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

	async listVersions(): Promise<BibleVersion[]> {
		await this.ensureVersionsFolder();
		const primaryFolder = this.getVersionsFolder();
		const pluginDir = normalizePath(`${PLUGIN_FOLDER}/bibles`);
		const legacyDir = normalizePath(`${LEGACY_PLUGIN_FOLDER}/bibles`);
		const defaultFolder = normalizePath(`${DEFAULT_DATA_FOLDER}/${DEFAULT_DATABASE_FOLDER}`);

		const results: BibleVersion[] = [];
		const seenNames = new Set<string>();

		const collectFrom = async (dir: string): Promise<void> => {
			try {
				if (!(await this.app.vault.adapter.exists(dir))) return;
				const listing = await this.app.vault.adapter.list(dir);
				for (const path of listing.files) {
					if (!DATABASE_EXTENSION.test(path)) continue;
					const name = path.slice(path.lastIndexOf("/") + 1);
					if (seenNames.has(name)) continue;
					seenNames.add(name);

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
					});
				}
			} catch (error) {
				console.warn("OpenBible: error listing version folder:", dir, error);
			}
		};

		await collectFrom(primaryFolder);
		if (primaryFolder !== defaultFolder) {
			await collectFrom(defaultFolder);
		}
		if (primaryFolder !== pluginDir && defaultFolder !== pluginDir) {
			await collectFrom(pluginDir);
		}
		if (primaryFolder !== legacyDir && defaultFolder !== legacyDir && pluginDir !== legacyDir) {
			await collectFrom(legacyDir);
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
		const filePath = normalizePath(`${this.getVersionsFolder()}/${filename}`);
		await this.app.vault.adapter.writeBinary(filePath, contents);
		const info = this.resolveVersionInfo(filePath);
		return {
			id: filePath,
			name: info.name,
			abbreviation: info.abbreviation,
			filePath,
			language: info.language,
		};
	}

	async removeVersion(filePath: string): Promise<void> {
		const normalized = normalizePath(filePath);
		if (!DATABASE_EXTENSION.test(normalized)) {
			throw new Error(t("errors.invalidDatabasePath"));
		}
		if (await this.app.vault.adapter.exists(normalized)) {
			await this.app.vault.adapter.remove(normalized);
		}

		const settings = this.getSettings();
		const filename = normalized.slice(normalized.lastIndexOf("/") + 1);
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
		metadata: { name?: string; abbreviation?: string; language?: string }
	): Promise<void> {
		const settings = this.getSettings();
		if (!settings.customVersionMetadata) {
			settings.customVersionMetadata = {};
		}
		const filename = filePath.slice(filePath.lastIndexOf("/") + 1);
		const current = settings.customVersionMetadata[filePath] ?? settings.customVersionMetadata[filename] ?? {};
		const updated = {
			...current,
			...metadata,
		};
		settings.customVersionMetadata[filePath] = updated;

		this.setCachedMetadata(filePath, {
			name: updated.name || this.resolveVersionInfo(filePath).name,
			abbreviation: updated.abbreviation || this.resolveVersionInfo(filePath).abbreviation,
			language: updated.language,
		});

		await this.onSaveSettings?.();
	}

	async setDefaultVersion(filePath: string): Promise<void> {
		const settings = this.getSettings();
		settings.defaultVersionPath = filePath;
		const info = this.resolveVersionInfo(filePath);
		settings.previewDefaultVersion = info.abbreviation;
		await this.onSaveSettings?.();
	}

	toBibleVersion(filePath: string): BibleVersion {
		const filename = filePath.slice(filePath.lastIndexOf("/") + 1);
		const info = this.resolveVersionInfo(filePath);
		const defaultPath = this.getSettings().defaultVersionPath;
		const isDefault = Boolean(
			defaultPath &&
			(defaultPath === filePath || defaultPath === filename || defaultPath.endsWith(`/${filename}`))
		);
		return {
			id: filePath,
			name: info.name,
			abbreviation: info.abbreviation,
			filePath,
			language: info.language,
			isDefault,
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
