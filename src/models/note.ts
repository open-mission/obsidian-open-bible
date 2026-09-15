export interface BibleReference {
	book: string;
	chapter: number;
	verses: string;
	version?: string;
}

export interface BibleNoteFrontmatter {
	type: "note" | "highlight";
	book: string;
	chapter: number;
	verses: string | number;
	bible_version?: string;
	color?: string;
	highlight_label?: string;
	title?: string;
	reference?: string;
	created?: string;
	char_start?: number;
	char_end?: number;
	selected_text?: string;
	tags?: string[];
	[key: string]: unknown;
}

export interface BibleNoteItem {
	path: string;
	type: "note" | "highlight";
	title: string;
	book: string;
	chapter: number;
	verses: number[];
	versesStr: string;
	version?: string;
	color: string;
	highlightLabel?: string;
	reference: string;
	created?: string;
	charStart?: number;
	charEnd?: number;
	selectedText?: string;
	content?: string;
	mtime?: number;
}
