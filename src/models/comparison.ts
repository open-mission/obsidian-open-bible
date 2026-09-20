import type { BibleVerse } from "./bible";

export interface VersionComparisonItem {
	versionId: string;
	versionName: string;
	versionAbbr: string;
	verses: BibleVerse[];
	fullText: string;
}

export interface VerseComparisonRow {
	verseNumber: number;
	versions: {
		versionId: string;
		versionAbbr: string;
		versionName: string;
		text: string;
	}[];
}

export interface PassageComparisonData {
	bookId: number;
	bookName: string;
	chapter: number;
	verseNumbers: number[];
	reference: string;
	versions: VersionComparisonItem[];
	rows: VerseComparisonRow[];
}

/**
 * JSON Canvas 1.0 Specification interfaces (https://jsoncanvas.org/spec/1.0/)
 */
export interface CanvasNode {
	id: string;
	type: "text" | "file" | "link" | "group";
	x: number;
	y: number;
	width: number;
	height: number;
	color?: string;
	text?: string;
	file?: string;
	url?: string;
	label?: string;
}

export interface CanvasEdge {
	id: string;
	fromNode: string;
	fromSide?: "top" | "right" | "bottom" | "left";
	fromEnd?: "none" | "arrow";
	toNode: string;
	toSide?: "top" | "right" | "bottom" | "left";
	toEnd?: "none" | "arrow";
	color?: string;
	label?: string;
}

export interface JsonCanvasData {
	nodes: CanvasNode[];
	edges: CanvasEdge[];
}
