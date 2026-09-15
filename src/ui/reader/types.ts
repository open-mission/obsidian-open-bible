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
	refreshSettings: () => void;
}
