export type SupportedLocale = "en" | "pt";

/** Locale stored in settings: "auto" follows the Obsidian UI language. */
export type LocalePreference = "auto" | SupportedLocale;

export interface TranslationStrings {
	commands: {
		openReader: string;
		openBibleText: string;
		openReaderRightSidebar: string;
		openReaderLeftSidebar: string;
		toggleTwoColumns: string;
	};
	ribbon: {
		openReader: string;
	};
	view: {
		title: string;
		subtitle: string;
		errorOpening: string;
		referencePlaceholder: string;
		referenceAria: string;
		searchHint: string;
		searchResult: string;
	};
	settings: {
		pageReaderAppearance: string;
		pageReaderAppearanceDesc: string;
		pageResources: string;
		pageResourcesDesc: string;
		generalHeading: string;
		generalDesc: string;
		dataFolderName: string;
		dataFolderPathDesc: string;
		databasesHeading: string;
		databasesDesc: string;
		importName: string;
		importDesc: string;
		importSuccessNotice: string;
		importErrorNotice: string;
		importedVersionsHeading: string;
		noVersionsYet: string;
		removeButton: string;
		removedNotice: string;
		removeErrorNotice: string;
		folderUpdatedNotice: string;
		languageSettingName: string;
		languageSettingDesc: string;
		languageAuto: string;
		languagePt: string;
		languageEn: string;
		groupConfiguration: string;
		pageAbout: string;
		pageAboutDesc: string;
		readerSectionPlaceholder: string;
		readerSectionPlaceholderDesc: string;
		studySectionPlaceholder: string;
		studySectionPlaceholderDesc: string;
		versionsListErrorNotice: string;
		removeVersionTitle: string;
		removeVersionConfirm: string;
		defaultReferenceName: string;
		defaultReferenceDesc: string;
		readerTwoColumnsName: string;
		readerTwoColumnsDesc: string;
		readerContainerWidthName: string;
		readerContainerWidthDesc: string;
		readerVerseSpacingName: string;
		readerVerseSpacingDesc: string;
		readerLineSpacingName: string;
		readerLineSpacingDesc: string;
		thompsonCrossRefsName: string;
		thompsonCrossRefsDesc: string;
		thompsonCrossRefsPositionName: string;
		thompsonCrossRefsPositionDesc: string;
		thompsonPositionMargin: string;
		thompsonPositionCenter: string;
		creditsHeading: string;
		creditsDesc: string;
		creditsOpenBibleDesc: string;
		creditsOpenMissionDesc: string;
	};
	errors: {
		invalidFolderPath: string;
		invalidDatabaseFile: string;
		invalidDatabasePath: string;
		fallbackBookName: string;
	};
	common: {
		save: string;
		saving: string;
		saved: string;
		saveError: string;
		cancel: string;
		confirm: string;
		loading: string;
		backToSettings: string;
		search: string;
		recent: string;
		importing: string;
	};
	about: {
		tagline: string;
		organizationHeading: string;
		linksHeading: string;
		sourceCodeName: string;
		sourceCodeDesc: string;
		reportIssueName: string;
		reportIssueDesc: string;
		sponsorName: string;
		sponsorDesc: string;
		creditsCrossRefs: string;
		creditsTech: string;
	};
	toolbar: {
		prevChapter: string;
		nextChapter: string;
		chooseBook: string;
		selectBook: string;
		chooseChapter: string;
		chooseVersion: string;
		versionLabel: string;
		defaultVersion: string;
	};
	reader: {
		loading: string;
		emptyTitle: string;
		emptyDesc: string;
		openSettings: string;
		noBooksError: string;
		openVersionFailedPrefix: string;
		readChapterFailedPrefix: string;
		twoColumns: string;
		singleColumn: string;
		loadingVerses: string;
		noVersesFound: string;
		retry: string;
	};
	readerMenu: {
		containerWidthHeader: string;
		containerWidthDefault: string;
		containerWidthLarge: string;
		containerWidthWide: string;
		verseSpacingHeader: string;
		lineSpacingHeader: string;
		spacingCompact: string;
		spacingNormal: string;
		spacingSpacious: string;
		twoColumnsToggle: string;
		thompsonCrossRefs: string;
		thompsonPositionMargin: string;
		thompsonPositionCenter: string;
	};
	resources: {
		crossReferences: string;
		crossRefsEmpty: string;
		countSingle: string;
		countPlural: string;
		verseMissing: string;
		previous: string;
		next: string;
	};
	popover: {
		copyText: string;
		close: string;
	};
	notices: {
		textCopied: string;
	};
	bookPicker: {
		title: string;
		searchPlaceholder: string;
		tabAll: string;
		tabOt: string;
		tabNt: string;
		noBooksFound: string;
		sectionOt: string;
		sectionNt: string;
		chapterCountSingle: string;
		chapterCountPlural: string;
		bookAriaSingle: string;
		bookAriaPlural: string;
		close: string;
	};
	chapterPicker: {
		noChaptersDesc: string;
		chapterAria: string;
		close: string;
	};
	versionPicker: {
		title: string;
		installedCountSingle: string;
		installedCountPlural: string;
		close: string;
		selectVersionAria: string;
	};
}
