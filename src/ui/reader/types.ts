import type { ReaderContainerWidth, ReaderSpacing } from "../../settings";

export type NavigationDirection = "next" | "prev" | "jump";

export interface BibleReaderViewState {
	bookId?: number;
	chapter?: number;
	verseNumber?: number;
	versionPath?: string;
	twoColumns?: boolean;
	containerWidth?: ReaderContainerWidth;
	verseSpacing?: ReaderSpacing;
	lineSpacing?: ReaderSpacing;
	thompsonCrossRefsEnabled?: boolean;
	thompsonCrossRefsPosition?: "margin" | "center";
	showCrossRefsBottomPanel?: boolean;
	crossRefsBottomPanelFixed?: boolean;
	crossRefsBottomPanelColumns?: 1 | 2;
	crossRefsBottomPanelCollapsed?: boolean;
}

export interface BibleReaderController {
	navigateToPassage: (
		bookIdOrName: number | string,
		chapter: number,
		verseNumber?: number,
		versionAbbr?: string,
	) => Promise<boolean>;
	openHistory: () => void;
	openBookPicker: () => void;
	openVersionPicker: () => void;
	openAppearancePicker: () => void;
	openHighlights?: () => void;
	openResources?: () => void;
	toggleSelectionMode?: () => boolean;
	isSelectionMode?: () => boolean;
	refreshSettings: () => void;
	getViewState?: () => BibleReaderViewState;
	toggleTwoColumns?: () => void;
	toggleThompson?: () => void;
	toggleBottomPanel?: () => void;
	toggleBottomPanelFixed?: () => void;
}
