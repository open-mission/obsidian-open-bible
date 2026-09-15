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

export interface CustomVersionMetadata {
	name?: string;
	abbreviation?: string;
	language?: string;
}

export type VerseHoverModifier = "shift" | "ctrlCmd" | "alt" | "none";

export interface OpenBibleSettings {
	dataFolder: string;
	defaultReference: string;
	/** Primary/default Bible version file path for reader, preview, and citations. */
	defaultVersionPath?: string;
	/** Custom metadata overrides per SQLite file path. */
	customVersionMetadata?: Record<string, CustomVersionMetadata>;
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
	/** Thompson cross references in reader. */
	thompsonCrossRefsEnabled?: boolean;
	thompsonCrossRefsPosition?: "margin" | "center";
	previewDefaultVersion?: string;
	/** Whether verse reference previews in notes are enabled globally. */
	enableVersePreviews: boolean;
	/** Whether hovering over a verse reference displays the preview tooltip. */
	enableVerseHoverPreview: boolean;
	/** Modifier key required to show hover preview ("shift" | "ctrlCmd" | "alt" | "none"). */
	verseHoverModifier: VerseHoverModifier;
	/** Deprecated: use verseHoverModifier instead. Kept for backwards compatibility. */
	verseHoverRequireShift?: boolean;
	/** Whether clicking on a verse reference opens the preview modal / drawer. */
	enableVerseClickPreview: boolean;
	/** Cross-references bottom panel in reader. */
	showCrossRefsBottomPanel?: boolean;
	crossRefsBottomPanelFixed?: boolean;
	crossRefsBottomPanelColumns?: 1 | 2;
	crossRefsBottomPanelCollapsed?: boolean;
	crossRefsBottomPanelHeight?: number;
}

export const DEFAULT_SETTINGS: OpenBibleSettings = {
	dataFolder: DEFAULT_DATA_FOLDER,
	defaultReference: "João 3:16",
	defaultVersionPath: "",
	customVersionMetadata: {},
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
	thompsonCrossRefsEnabled: false,
	thompsonCrossRefsPosition: "margin",
	previewDefaultVersion: "",
	enableVersePreviews: true,
	enableVerseHoverPreview: true,
	verseHoverModifier: "shift",
	verseHoverRequireShift: true,
	enableVerseClickPreview: true,
	showCrossRefsBottomPanel: true,
	crossRefsBottomPanelFixed: false,
	crossRefsBottomPanelColumns: 2,
	crossRefsBottomPanelCollapsed: false,
	crossRefsBottomPanelHeight: 220,
};
