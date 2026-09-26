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

export type VerseInsertPosition = "below" | "above";

export interface HighlightConfig {
	id: string;
	label: string;
	color: string;
}

/** Complementary resource type (person, place, etc.) linked from verses. */
export interface ResourceTypeConfig {
	id: string;
	label: string;
	folder: string;
	icon: string;
	color: string;
}

/** Modifier key required to preview a linked resource on hover. */
export type ResourceHoverModifier = "shift" | "ctrlCmd" | "alt" | "none";

/** How verse↔resource links are rendered in the reader. */
export type ResourceDisplayStyle = "icon" | "underline" | "both";

/** Where a linked resource opens when clicked in the Bible reader. */
export type ResourceOpenMode = "reader" | "workspace" | "modal";

/** Workspace split location when opening a resource in workspace mode. */
export type ResourceWorkspaceSplit = "right" | "split" | "tab";

export const DEFAULT_RESOURCE_TYPES: ResourceTypeConfig[] = [
	{ id: "person", label: "Pessoas", folder: "OpenBible/resources/people", icon: "user", color: "#3b82f6" },
	{ id: "places", label: "Lugares", folder: "OpenBible/resources/places", icon: "map-pin", color: "#22c55e" },
];

export const DEFAULT_HIGHLIGHT_CONFIGS: HighlightConfig[] = [
	{ id: "yellow", label: "Amarelo", color: "yellow" },
	{ id: "green", label: "Verde", color: "green" },
	{ id: "blue", label: "Azul", color: "blue" },
	{ id: "purple", label: "Roxo", color: "purple" },
	{ id: "pink", label: "Rosa", color: "pink" },
	{ id: "orange", label: "Laranja", color: "orange" },
];

export const DEFAULT_NOTE_CONFIGS: HighlightConfig[] = [
	{ id: "note_yellow", label: "Geral", color: "yellow" },
	{ id: "note_green", label: "Devocional", color: "green" },
	{ id: "note_blue", label: "Estudo", color: "blue" },
	{ id: "note_purple", label: "Teologia", color: "purple" },
	{ id: "note_pink", label: "Aplicação", color: "pink" },
	{ id: "note_orange", label: "Contexto", color: "orange" },
];

export interface OpenBibleSettings {
	dataFolder: string;
	notesFolder?: string;
	highlightsFolder?: string;
	configuredHighlights?: HighlightConfig[];
	configuredNotes?: HighlightConfig[];
	configuredResources?: ResourceTypeConfig[];
	resourceHoverModifier?: ResourceHoverModifier;
	resourceDisplayStyle?: ResourceDisplayStyle;
	resourceColorize?: boolean;
	/** Where resources open when clicked: "reader" (secondary panel inside reader), "workspace" (workspace tab/leaf), or "modal" (popup). */
	resourceOpenMode?: ResourceOpenMode;
	/** Where the workspace leaf opens when resourceOpenMode is "workspace": "right" (sidebar), "split" (split pane), or "tab" (new tab). */
	resourceWorkspaceSplit?: ResourceWorkspaceSplit;
	/** Width in pixels for the reader secondary panel. */
	readerSecondaryPanelWidth?: number;
	confirmHighlightDeletion?: boolean;
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
	/** Placement when inserting scripture quotes from context menu into note ("below" | "above"). */
	verseInsertPosition: VerseInsertPosition;
	/** Cross-references bottom panel in reader. */
	showCrossRefsBottomPanel?: boolean;
	crossRefsBottomPanelFixed?: boolean;
	crossRefsBottomPanelColumns?: 1 | 2;
	crossRefsBottomPanelCollapsed?: boolean;
	crossRefsBottomPanelHeight?: number;
	/** Selected Bible versions for comparison modal. */
	compareSelectedVersions?: string[];
	/** Folder where generated Canvas (.canvas) and Excalidraw comparison files are saved. */
	compareExportFolder?: string;
	/** Folder where generated Canvas (.canvas) and Excalidraw study map files are saved from verse selection. */
	canvasExportFolder?: string;
	/** Preferred layout for comparison modal ("columns" or "verses"). */
	comparePreferredLayout?: "columns" | "verses";
	/** Format when copying verses from selection toolbar ("singleBlock" for clean Excalidraw-ready block, or "quoteMarkdown" for '>' blockquote). */
	copyVerseFormat?: "singleBlock" | "quoteMarkdown";
}

export const DEFAULT_SETTINGS: OpenBibleSettings = {
	dataFolder: DEFAULT_DATA_FOLDER,
	notesFolder: "OpenBible/notes",
	highlightsFolder: "OpenBible/highlights",
	canvasExportFolder: "OpenBible/canvas",
	configuredHighlights: DEFAULT_HIGHLIGHT_CONFIGS,
	configuredNotes: DEFAULT_NOTE_CONFIGS,
	configuredResources: DEFAULT_RESOURCE_TYPES,
	resourceHoverModifier: "shift",
	resourceDisplayStyle: "icon",
	resourceColorize: true,
	resourceOpenMode: "reader",
	resourceWorkspaceSplit: "right",
	readerSecondaryPanelWidth: 380,
	confirmHighlightDeletion: false,
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
	verseInsertPosition: "below",
	showCrossRefsBottomPanel: true,
	crossRefsBottomPanelFixed: false,
	crossRefsBottomPanelColumns: 2,
	crossRefsBottomPanelCollapsed: false,
	crossRefsBottomPanelHeight: 220,
	compareSelectedVersions: [],
	compareExportFolder: "OpenBible/Comparisons",
	comparePreferredLayout: "columns",
	copyVerseFormat: "singleBlock",
};
