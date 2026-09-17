/** Complementary study resources linked from verses (people, places, ...). */

export interface ResourcePassageRef {
	book: string;
	chapter: number;
	verses: string;
	bibleVersion?: string;
	charStart?: number;
	charEnd?: number;
	selectedText?: string;
	reference?: string;
	created?: string;
}

export interface BibleResourceFrontmatter {
	type: "resource" | "resource-link";
	resource_type?: string;
	resource_path?: string;
	resource_name?: string;
	title?: string;
	image?: string;
	cover?: string;
	banner?: string;
	thumbnail?: string;
	book?: string;
	chapter?: number;
	verses?: string | number;
	bible_version?: string;
	color?: string;
	reference?: string;
	created?: string;
	char_start?: number;
	char_end?: number;
	selected_text?: string;
	match_all_occurrences?: boolean;
	tags?: string[];
	[key: string]: unknown;
}

/** A `.md` file describing the resource itself (e.g. people/Moisés.md). */
export interface BibleResourceItem {
	path: string;
	name: string;
	resourceType: string;
	title: string;
	image?: string;
	mtime?: number;
}

/** A link file binding a verse range to a resource (mirrors highlight storage). */
export interface BibleResourceLink {
	path: string;
	resourceType: string;
	resourcePath: string;
	resourceName: string;
	book: string;
	chapter: number;
	verses: number[];
	versesStr: string;
	version?: string;
	color: string;
	reference: string;
	created?: string;
	charStart?: number;
	charEnd?: number;
	selectedText?: string;
	matchAllOccurrences?: boolean;
	mtime?: number;
}
