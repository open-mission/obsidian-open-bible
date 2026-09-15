import type OpenBiblePlugin from "../main";
import type { BibleVerse } from "../models/bible";
import type { ParsedVerseReference } from "./VerseReferenceParser";

export interface ResolvedVersePreview {
	reference: string;
	bookName: string;
	chapter: number;
	verseStart: number;
	verseEnd?: number;
	versionAbbr: string;
	versionName: string;
	databasePath: string;
	verses: BibleVerse[];
}

export class VersePreviewService {
	constructor(private plugin: OpenBiblePlugin) {}

	async resolveDatabase(requestedVersion?: string): Promise<{ path: string; abbreviation: string; name: string } | null> {
		const versions = await this.plugin.bibleVersions.listVersions();
		if (versions.length === 0) return null;

		// 1. If explicit version requested
		if (requestedVersion) {
			const reqUpper = requestedVersion.toUpperCase().trim();
			const match = versions.find(
				(v) => v.abbreviation.toUpperCase() === reqUpper || v.name.toUpperCase().includes(reqUpper)
			);
			if (match) {
				return { path: match.filePath, abbreviation: match.abbreviation, name: match.name };
			}
		}

		// 2. If default version configured in plugin settings
		if (this.plugin.settings.defaultVersionPath) {
			const targetPath = this.plugin.settings.defaultVersionPath;
			const match = versions.find(
				(v) => v.filePath === targetPath || v.filePath.endsWith(`/${targetPath}`)
			);
			if (match) {
				return { path: match.filePath, abbreviation: match.abbreviation, name: match.name };
			}
		}

		// 3. If default preview version abbreviation configured
		const defaultSetting = this.plugin.settings.previewDefaultVersion?.toUpperCase().trim();
		if (defaultSetting) {
			const match = versions.find(
				(v) => v.abbreviation.toUpperCase() === defaultSetting || v.name.toUpperCase().includes(defaultSetting)
			);
			if (match) {
				return { path: match.filePath, abbreviation: match.abbreviation, name: match.name };
			}
		}

		// 3. Fallback to last read version
		if (this.plugin.settings.lastReadVersionPath) {
			const activeMatch = versions.find((v) => v.filePath === this.plugin.settings.lastReadVersionPath);
			if (activeMatch) {
				return { path: activeMatch.filePath, abbreviation: activeMatch.abbreviation, name: activeMatch.name };
			}
		}

		// 4. Fallback to first available version
		const first = versions[0];
		return { path: first.filePath, abbreviation: first.abbreviation, name: first.name };
	}

	async getVersePreview(ref: ParsedVerseReference): Promise<ResolvedVersePreview | null> {
		const dbInfo = await this.resolveDatabase(ref.versionAbbr);
		if (!dbInfo) return null;

		try {
			const allChapterVerses = await this.plugin.bibleText.readChapter(dbInfo.path, ref.canonicalBookId, ref.chapter);
			const start = ref.verseStart;
			const end = ref.verseEnd ?? ref.verseStart;

			const filtered = allChapterVerses.filter((v) => v.number >= start && v.number <= end);
			if (filtered.length === 0) return null;

			const rangeStr = start === end ? `${start}` : `${start}-${end}`;
			const reference = `${ref.bookName} ${ref.chapter}:${rangeStr}`;

			return {
				reference,
				bookName: ref.bookName,
				chapter: ref.chapter,
				verseStart: start,
				verseEnd: ref.verseEnd,
				versionAbbr: dbInfo.abbreviation,
				versionName: dbInfo.name,
				databasePath: dbInfo.path,
				verses: filtered,
			};
		} catch (error) {
			console.error("OpenBible: error loading verse preview", error);
			return null;
		}
	}
}
