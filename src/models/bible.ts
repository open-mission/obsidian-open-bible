/** A single verse of a chapter. */
export interface BibleVerse {
	number: number;
	text: string;
}

/** A book available in an installed version. Chapters come from the SQLite file itself. */
export interface BibleBook {
	id: number;
	name: string;
	chapters: number[];
	/** 1 = Old Testament, 2 = New Testament. */
	testament: 1 | 2;
}

/** Inspected content of an installed version (name, abbreviation and available books). */
export interface BibleDatabaseInfo {
	path: string;
	name: string;
	abbreviation: string;
	books: BibleBook[];
}