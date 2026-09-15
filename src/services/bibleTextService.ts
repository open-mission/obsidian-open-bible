import type { App } from "obsidian";
import { createSqlEngine } from "../data/sqlEngine";
import { getEmbeddedSqlWasm } from "../data/sqlWasm";
import { t } from "../i18n";
import type { BibleBook, BibleDatabaseInfo, BibleVerse } from "../models/bible";
import type { BibleVersionService } from "./bibleVersionService";

type SqlJs = Awaited<ReturnType<typeof createSqlEngine>>;
type SqlDatabase = InstanceType<SqlJs["Database"]>;

/**
 * Reads Bible text from installed SQLite versions.
 * Holds one active SQLite database in memory for speed.
 */
export class BibleTextService {
	private sqlPromise?: Promise<SqlJs>;
	private active: { path: string; db: SqlDatabase } | null = null;
	private infoCache = new Map<string, BibleDatabaseInfo>();

	constructor(
		private readonly app: App,
		private readonly versionService?: BibleVersionService,
	) {}

	reset(): void {
		this.closeActiveDatabase();
		this.infoCache.clear();
	}

	closeActiveDatabase(): void {
		if (!this.active) return;
		try {
			this.active.db.close();
		} catch (error) {
			console.error("OpenBible: could not close the SQLite database", error);
		}
		this.active = null;
	}

	/** Display name, abbreviation and available books/chapters of an installed version. */
	async inspectVersion(path: string): Promise<BibleDatabaseInfo> {
		const cached = this.infoCache.get(path);
		if (cached) return cached;

		const db = await this.getDatabase(path);
		const filename = path.slice(path.lastIndexOf("/") + 1);
		const resolved = this.versionService?.resolveVersionInfo(filename) ?? {
			name: filename,
			abbreviation: "BÍBLIA",
		};

		let name = resolved.name;
		let abbreviation = resolved.abbreviation;

		const metaName = this.readMetadataName(db);
		if (metaName) name = metaName;

		const metaAbbr = this.readMetadataAbbr(db);
		if (metaAbbr) abbreviation = metaAbbr;

		if (this.versionService) {
			this.versionService.setCachedMetadata(path, { name, abbreviation });
		}

		const books = this.readBooks(db);
		const info: BibleDatabaseInfo = {
			path,
			name,
			abbreviation,
			books,
		};
		this.infoCache.set(path, info);
		return info;
	}

	/** Verses of a chapter in canonical order. */
	async readChapter(path: string, bookId: number, chapter: number): Promise<BibleVerse[]> {
		if (!Number.isInteger(bookId) || !Number.isInteger(chapter) || bookId < 1 || chapter < 1) {
			return [];
		}
		const db = await this.getDatabase(path);
		const result = db.exec(
			"SELECT verse, text FROM verse WHERE book_id = ? AND chapter = ? ORDER BY verse",
			[bookId, chapter],
		);
		return (result[0]?.values ?? []).flatMap((row) => {
			const number = Number(row[0]);
			if (!Number.isFinite(number)) return [];
			return [{ number, text: String(row[1] ?? "").trim() }];
		});
	}

	private async getDatabase(path: string): Promise<SqlDatabase> {
		if (this.active?.path === path) return this.active.db;
		this.closeActiveDatabase();
		const sql = await this.getSql();
		const bytes = await this.app.vault.adapter.readBinary(path);
		const db = new sql.Database(new Uint8Array(bytes));
		this.active = { path, db };
		return db;
	}

	private async getSql(): Promise<SqlJs> {
		if (!this.sqlPromise) {
			this.sqlPromise = createSqlEngine(getEmbeddedSqlWasm());
		}
		return this.sqlPromise;
	}

	private readMetadataName(db: SqlDatabase): string | null {
		try {
			const result = db.exec(
				"SELECT value FROM metadata WHERE key IN ('name', 'title', 'version', 'description') " +
					"ORDER BY CASE key WHEN 'name' THEN 1 WHEN 'title' THEN 2 ELSE 3 END LIMIT 1",
			);
			const value = result[0]?.values[0]?.[0];
			if (!value) return null;
			const name = String(value).trim();
			return name && !/\.(sqlite|sqlite3|db)$/i.test(name) ? name : null;
		} catch {
			return null;
		}
	}

	private readMetadataAbbr(db: SqlDatabase): string | null {
		try {
			const result = db.exec(
				"SELECT value FROM metadata WHERE key IN ('abbreviation', 'short_name', 'acronym') LIMIT 1",
			);
			const value = result[0]?.values[0]?.[0];
			if (!value) return null;
			const abbr = String(value).toUpperCase().trim();
			return abbr || null;
		} catch {
			return null;
		}
	}

	private readBooks(db: SqlDatabase): BibleBook[] {
		const books = new Map<number, BibleBook>();

		const collect = (bookRows: unknown[][] | undefined, chapterRows: unknown[][] | undefined): void => {
			for (const row of bookRows ?? []) {
				const id = Number(row[0]);
				if (!Number.isFinite(id)) continue;
				const testamentVal = Number(row[2]);
				const testament: 1 | 2 =
					testamentVal === 1 || testamentVal === 2 ? testamentVal : id <= 39 ? 1 : 2;
				books.set(id, {
					id,
					name: String(row[1] ?? ""),
					chapters: [],
					testament,
				});
			}
			for (const row of chapterRows ?? []) {
				const bookId = Number(row[0]);
				const chapter = Number(row[1]);
				if (!Number.isFinite(bookId) || !Number.isFinite(chapter)) continue;
				const book = books.get(bookId);
				if (book) {
					book.chapters.push(chapter);
				} else {
					books.set(bookId, {
						id: bookId,
						name: t("errors.fallbackBookName", { id: bookId }),
						chapters: [chapter],
						testament: bookId <= 39 ? 1 : 2,
					});
				}
			}
		};

		try {
			collect(
				db.exec("SELECT id, name, testament_reference_id FROM book ORDER BY id")[0]?.values,
				db.exec("SELECT DISTINCT book_id, chapter FROM verse ORDER BY book_id, chapter")[0]?.values,
			);
		} catch {
			try {
				collect(
					db
						.exec(
							"SELECT b.id, b.name, NULL FROM book b ORDER BY b.id",
						)[0]?.values,
					db.exec("SELECT DISTINCT book_id, chapter FROM verse ORDER BY book_id, chapter")[0]?.values,
				);
			} catch {
				// empty map fallback
			}
		}

		return Array.from(books.values()).sort((a, b) => a.id - b.id);
	}
}