import { DEFAULT_DATA_FOLDER } from "./core/paths";
import type { LocalePreference } from "./i18n";

/** Reader text container width. */
export type ReaderContainerWidth = "default" | "large" | "wide";

/** Vertical rhythm option used for verse and line spacing. */
export type ReaderSpacing = "compact" | "normal" | "spacious";

export interface ReadingHistoryEntry {
	id: string;
	bookId: number;
	bookName: string;
	chapter: number;
	versionAbbr: string;
	versionPath?: string;
	timestamp: number;
}

export interface OpenBibleSettings {
	dataFolder: string;
	defaultReference: string;
	/** UI language preference: "auto" follows the Obsidian language. */
	language: LocalePreference;
	/** Reader layout: two columns. */
	readerTwoColumns: boolean;
	twoColumnLayout?: boolean;
	readerContainerWidth: ReaderContainerWidth;
	readerVerseSpacing: ReaderSpacing;
	readerLineSpacing: ReaderSpacing;
	/** Remember last read passage. */
	rememberLastReadPassage?: boolean;
	lastReadVersionPath: string;
	lastReadVersionAbbr?: string;
	lastReadBookId: number;
	lastReadChapter: number;
	readingHistory?: ReadingHistoryEntry[];
}

export const DEFAULT_SETTINGS: OpenBibleSettings = {
	dataFolder: DEFAULT_DATA_FOLDER,
	defaultReference: "João 3:16",
	language: "auto",
	readerTwoColumns: false,
	twoColumnLayout: false,
	readerContainerWidth: "default",
	readerVerseSpacing: "normal",
	readerLineSpacing: "normal",
	rememberLastReadPassage: true,
	lastReadVersionPath: "",
	lastReadVersionAbbr: "",
	lastReadBookId: 0,
	lastReadChapter: 0,
	readingHistory: [],
};
