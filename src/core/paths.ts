import { normalizePath } from "obsidian";

export const DEFAULT_DATA_FOLDER = "OpenBible";

/** Normalizes the root data folder; returns null if the path is unsafe (contains ".."). */
export function normalizeDataFolder(value: string): string | null {
	const raw = value.trim();
	if (!raw) return DEFAULT_DATA_FOLDER;
	const normalized = normalizePath(raw).replace(/\/+$/, "");
	if (!normalized || normalized === "." || normalized.split("/").includes("..")) return null;
	return normalized;
}

/** Sole allowed derivation: ${dataFolder}/versions. */
export function getVersionsFolder(dataFolder: string): string {
	return normalizePath(`${dataFolder}/versions`);
}

export const DEFAULT_NOTES_FOLDER = "OpenBible/notes";
export const DEFAULT_HIGHLIGHTS_FOLDER = "OpenBible/highlights";

export function getNotesFolder(dataFolder: string, configuredFolder?: string): string {
	if (configuredFolder && configuredFolder.trim()) {
		return normalizePath(configuredFolder.trim());
	}
	return normalizePath(`${dataFolder}/notes`);
}

export function getHighlightsFolder(dataFolder: string, configuredFolder?: string): string {
	if (configuredFolder && configuredFolder.trim()) {
		return normalizePath(configuredFolder.trim());
	}
	return normalizePath(`${dataFolder}/highlights`);
}

export const DEFAULT_RESOURCES_BASE_FOLDER = "OpenBible/resources";

/** Resolves the vault folder for a resource type (falls back to base + type id). */
export function getResourceTypeFolder(
	dataFolder: string,
	typeId: string,
	configuredFolder?: string,
): string {
	if (configuredFolder && configuredFolder.trim()) {
		return normalizePath(configuredFolder.trim());
	}
	return normalizePath(`${dataFolder}/resources/${typeId}`);
}

export const DEFAULT_COMPARISONS_FOLDER = "OpenBible/comparisons";

export function getComparisonsFolder(dataFolder: string, configuredFolder?: string): string {
	if (configuredFolder && configuredFolder.trim()) {
		return normalizePath(configuredFolder.trim());
	}
	return normalizePath(`${dataFolder}/comparisons`);
}

