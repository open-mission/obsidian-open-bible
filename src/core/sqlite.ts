/** Accepted SQLite extensions for import. */
export const SQLITE_EXTENSIONS = /\.(sqlite|sqlite3|db)$/i;

const SQLITE_MAGIC = [
	0x53, 0x51, 0x4c, 0x69, 0x74, 0x65, 0x20, 0x66, 0x6f, 0x72, 0x6d, 0x61, 0x74, 0x20, 0x33, 0x00,
];

/** Validates via SQLite format 3 magic header. */
export function hasSqliteHeader(buffer: ArrayBuffer): boolean {
	if (buffer.byteLength < 16) return false;
	const bytes = new Uint8Array(buffer, 0, 16);
	return SQLITE_MAGIC.every((byte, i) => bytes[i] === byte);
}

/** Removes invalid characters from filenames. */
export function sanitizeFileStem(value: string): string {
	return value
		.replace(/[\\/:*?"<>|]/g, "-")
		.replace(/\s+/g, " ")
		.trim()
		.replace(/[.\s]+$/, "");
}

/** Human-readable name derived from filename ("ARA.sqlite" → "ARA"). Fallback until metadata is supported. */
export function displayNameFromFilename(filename: string): string {
	const stem = filename.replace(SQLITE_EXTENSIONS, "");
	const spaced = stem.replace(/[_-]+/g, " ").trim();
	return spaced || stem;
}

/** Abbreviation derived from filename ("NAA.sqlite" → "NAA"). Fallback until metadata is supported. */
export function abbreviationFromFilename(filename: string): string {
	const stem = filename.replace(SQLITE_EXTENSIONS, "");
	const parts = stem.split(/[_\-\s]+/).filter(Boolean);
	const candidate = parts[parts.length - 1] ?? stem;
	return candidate.replace(/[^a-z0-9]/gi, "").toUpperCase().slice(0, 8) || "BÍBLIA";
}
