import {
	groupRefsIntoBlocks,
	type CrossReference,
	type CrossReferenceBlock,
} from "../data/crossRefModel";
import type { createSqlEngine } from "../data/sqlEngine";

type SqlJs = Awaited<ReturnType<typeof createSqlEngine>>;
type SqlDatabase = InstanceType<SqlJs["Database"]>;

const CHAPTER_QUERY = `
	SELECT from_book, from_chapter, from_verse, to_book, to_chapter, to_verse_start, to_verse_end, votes
	FROM xref
	WHERE from_book = ? AND from_chapter = ?
	ORDER BY from_verse ASC, votes DESC
`;

const VERSE_QUERY = `
	SELECT from_book, from_chapter, from_verse, to_book, to_chapter, to_verse_start, to_verse_end, votes
	FROM xref
	WHERE from_book = ? AND from_chapter = ? AND from_verse = ?
	ORDER BY votes DESC
`;

function rowToRef(row: (string | number | Uint8Array | null)[]): CrossReference {
	return {
		fromBook: Number(row[0]),
		fromChapter: Number(row[1]),
		fromVerse: Number(row[2]),
		toBook: Number(row[3]),
		toChapter: Number(row[4]),
		toVerseStart: Number(row[5]),
		toVerseEnd: Number(row[6]),
		votes: Number(row[7]),
	};
}

export class CrossReferenceService {
	private db: SqlDatabase | null = null;
	private ready = false;
	private loadPromise?: Promise<void>;

	constructor(private readonly getSql: () => Promise<SqlJs>) {}

	isReady(): boolean {
		return this.ready;
	}

	async load(): Promise<void> {
		if (this.ready) {
			return;
		}
		if (this.loadPromise) {
			return this.loadPromise;
		}

		this.loadPromise = (async () => {
			const { getEmbeddedCrossRefs } = await import("../data/crossRefsBytes");
			await this.loadFromBytes(getEmbeddedCrossRefs());
		})();
		try {
			await this.loadPromise;
		} catch (error) {
			this.loadPromise = undefined;
			throw error;
		}
	}

	async loadFromBytes(bytes: Uint8Array): Promise<void> {
		const sql = await this.getSql();
		if (this.db) {
			try {
				this.db.close();
			} catch {
				// ignore close errors when replacing the database
			}
			this.db = null;
			this.ready = false;
		}

		this.db = new sql.Database(bytes);
		this.ready = true;
	}

	getBlocksForChapter(bookId: number, chapter: number): CrossReferenceBlock[] {
		if (!this.ready || !this.db) {
			return [];
		}

		const result = this.db.exec(CHAPTER_QUERY, [bookId, chapter]);
		const refs = (result[0]?.values ?? []).map(rowToRef);
		return groupRefsIntoBlocks(refs);
	}

	getRefsForVerse(bookId: number, chapter: number, verse: number): CrossReference[] {
		if (!this.ready || !this.db) {
			return [];
		}

		const result = this.db.exec(VERSE_QUERY, [bookId, chapter, verse]);
		return (result[0]?.values ?? []).map(rowToRef);
	}
}
