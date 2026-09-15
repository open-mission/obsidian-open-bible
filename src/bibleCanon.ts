import { BOOK_ABBREVIATIONS, normalizeText } from "./constants";

export interface BibleCanonBook {
	id: number;
	namePt: string;
	nameEn: string;
	testament: 1 | 2; // 1 = Old Testament, 2 = New Testament
	chaptersCount: number;
	categoryPt: string;
	categoryEn: string;
	abbreviation: string;
}

export const BIBLE_CANON: BibleCanonBook[] = [
	// Antigo Testamento — Pentateuco
	{ id: 1, namePt: "Gênesis", nameEn: "Genesis", testament: 1, chaptersCount: 50, categoryPt: "Pentateuco", categoryEn: "Pentateuch", abbreviation: "gn" },
	{ id: 2, namePt: "Êxodo", nameEn: "Exodus", testament: 1, chaptersCount: 40, categoryPt: "Pentateuco", categoryEn: "Pentateuch", abbreviation: "ex" },
	{ id: 3, namePt: "Levítico", nameEn: "Leviticus", testament: 1, chaptersCount: 27, categoryPt: "Pentateuco", categoryEn: "Pentateuch", abbreviation: "lv" },
	{ id: 4, namePt: "Números", nameEn: "Numbers", testament: 1, chaptersCount: 36, categoryPt: "Pentateuco", categoryEn: "Pentateuch", abbreviation: "nm" },
	{ id: 5, namePt: "Deuteronômio", nameEn: "Deuteronomy", testament: 1, chaptersCount: 34, categoryPt: "Pentateuco", categoryEn: "Pentateuch", abbreviation: "dt" },

	// Antigo Testamento — Livros Históricos
	{ id: 6, namePt: "Josué", nameEn: "Joshua", testament: 1, chaptersCount: 24, categoryPt: "Livros Históricos", categoryEn: "Historical Books", abbreviation: "js" },
	{ id: 7, namePt: "Juízes", nameEn: "Judges", testament: 1, chaptersCount: 21, categoryPt: "Livros Históricos", categoryEn: "Historical Books", abbreviation: "jz" },
	{ id: 8, namePt: "Rute", nameEn: "Ruth", testament: 1, chaptersCount: 4, categoryPt: "Livros Históricos", categoryEn: "Historical Books", abbreviation: "rt" },
	{ id: 9, namePt: "1 Samuel", nameEn: "1 Samuel", testament: 1, chaptersCount: 31, categoryPt: "Livros Históricos", categoryEn: "Historical Books", abbreviation: "1sm" },
	{ id: 10, namePt: "2 Samuel", nameEn: "2 Samuel", testament: 1, chaptersCount: 24, categoryPt: "Livros Históricos", categoryEn: "Historical Books", abbreviation: "2sm" },
	{ id: 11, namePt: "1 Reis", nameEn: "1 Kings", testament: 1, chaptersCount: 22, categoryPt: "Livros Históricos", categoryEn: "Historical Books", abbreviation: "1rs" },
	{ id: 12, namePt: "2 Reis", nameEn: "2 Kings", testament: 1, chaptersCount: 25, categoryPt: "Livros Históricos", categoryEn: "Historical Books", abbreviation: "2rs" },
	{ id: 13, namePt: "1 Crônicas", nameEn: "1 Chronicles", testament: 1, chaptersCount: 29, categoryPt: "Livros Históricos", categoryEn: "Historical Books", abbreviation: "1cr" },
	{ id: 14, namePt: "2 Crônicas", nameEn: "2 Chronicles", testament: 1, chaptersCount: 36, categoryPt: "Livros Históricos", categoryEn: "Historical Books", abbreviation: "2cr" },
	{ id: 15, namePt: "Esdras", nameEn: "Ezra", testament: 1, chaptersCount: 10, categoryPt: "Livros Históricos", categoryEn: "Historical Books", abbreviation: "ed" },
	{ id: 16, namePt: "Neemias", nameEn: "Nehemiah", testament: 1, chaptersCount: 13, categoryPt: "Livros Históricos", categoryEn: "Historical Books", abbreviation: "ne" },
	{ id: 17, namePt: "Ester", nameEn: "Esther", testament: 1, chaptersCount: 10, categoryPt: "Livros Históricos", categoryEn: "Historical Books", abbreviation: "et" },

	// Antigo Testamento — Livros Poéticos
	{ id: 18, namePt: "Jó", nameEn: "Job", testament: 1, chaptersCount: 42, categoryPt: "Livros Poéticos", categoryEn: "Poetic Books", abbreviation: "jb" },
	{ id: 19, namePt: "Salmos", nameEn: "Psalms", testament: 1, chaptersCount: 150, categoryPt: "Livros Poéticos", categoryEn: "Poetic Books", abbreviation: "sl" },
	{ id: 20, namePt: "Provérbios", nameEn: "Proverbs", testament: 1, chaptersCount: 31, categoryPt: "Livros Poéticos", categoryEn: "Poetic Books", abbreviation: "pv" },
	{ id: 21, namePt: "Eclesiastes", nameEn: "Ecclesiastes", testament: 1, chaptersCount: 12, categoryPt: "Livros Poéticos", categoryEn: "Poetic Books", abbreviation: "ec" },
	{ id: 22, namePt: "Cantares", nameEn: "Song of Solomon", testament: 1, chaptersCount: 8, categoryPt: "Livros Poéticos", categoryEn: "Poetic Books", abbreviation: "ct" },

	// Antigo Testamento — Profetas Maiores
	{ id: 23, namePt: "Isaías", nameEn: "Isaiah", testament: 1, chaptersCount: 66, categoryPt: "Profetas Maiores", categoryEn: "Major Prophets", abbreviation: "is" },
	{ id: 24, namePt: "Jeremias", nameEn: "Jeremiah", testament: 1, chaptersCount: 52, categoryPt: "Profetas Maiores", categoryEn: "Major Prophets", abbreviation: "jr" },
	{ id: 25, namePt: "Lamentações", nameEn: "Lamentations", testament: 1, chaptersCount: 5, categoryPt: "Profetas Maiores", categoryEn: "Major Prophets", abbreviation: "lm" },
	{ id: 26, namePt: "Ezequiel", nameEn: "Ezekiel", testament: 1, chaptersCount: 48, categoryPt: "Profetas Maiores", categoryEn: "Major Prophets", abbreviation: "ez" },
	{ id: 27, namePt: "Daniel", nameEn: "Daniel", testament: 1, chaptersCount: 12, categoryPt: "Profetas Maiores", categoryEn: "Major Prophets", abbreviation: "dn" },

	// Antigo Testamento — Profetas Menores
	{ id: 28, namePt: "Oseias", nameEn: "Hosea", testament: 1, chaptersCount: 14, categoryPt: "Profetas Menores", categoryEn: "Minor Prophets", abbreviation: "os" },
	{ id: 29, namePt: "Joel", nameEn: "Joel", testament: 1, chaptersCount: 3, categoryPt: "Profetas Menores", categoryEn: "Minor Prophets", abbreviation: "jl" },
	{ id: 30, namePt: "Amós", nameEn: "Amos", testament: 1, chaptersCount: 9, categoryPt: "Profetas Menores", categoryEn: "Minor Prophets", abbreviation: "am" },
	{ id: 31, namePt: "Obadias", nameEn: "Obadiah", testament: 1, chaptersCount: 1, categoryPt: "Profetas Menores", categoryEn: "Minor Prophets", abbreviation: "ob" },
	{ id: 32, namePt: "Jonas", nameEn: "Jonah", testament: 1, chaptersCount: 4, categoryPt: "Profetas Menores", categoryEn: "Minor Prophets", abbreviation: "jn" },
	{ id: 33, namePt: "Miqueias", nameEn: "Micah", testament: 1, chaptersCount: 7, categoryPt: "Profetas Menores", categoryEn: "Minor Prophets", abbreviation: "mq" },
	{ id: 34, namePt: "Naum", nameEn: "Nahum", testament: 1, chaptersCount: 3, categoryPt: "Profetas Menores", categoryEn: "Minor Prophets", abbreviation: "na" },
	{ id: 35, namePt: "Habacuque", nameEn: "Habakkuk", testament: 1, chaptersCount: 3, categoryPt: "Profetas Menores", categoryEn: "Minor Prophets", abbreviation: "hc" },
	{ id: 36, namePt: "Sofonias", nameEn: "Zephaniah", testament: 1, chaptersCount: 3, categoryPt: "Profetas Menores", categoryEn: "Minor Prophets", abbreviation: "sf" },
	{ id: 37, namePt: "Ageu", nameEn: "Haggai", testament: 1, chaptersCount: 2, categoryPt: "Profetas Menores", categoryEn: "Minor Prophets", abbreviation: "ag" },
	{ id: 38, namePt: "Zacarias", nameEn: "Zechariah", testament: 1, chaptersCount: 14, categoryPt: "Profetas Menores", categoryEn: "Minor Prophets", abbreviation: "zc" },
	{ id: 39, namePt: "Malaquias", nameEn: "Malachi", testament: 1, chaptersCount: 4, categoryPt: "Profetas Menores", categoryEn: "Minor Prophets", abbreviation: "ml" },

	// Novo Testamento — Evangelhos
	{ id: 40, namePt: "Mateus", nameEn: "Matthew", testament: 2, chaptersCount: 28, categoryPt: "Evangelhos", categoryEn: "Gospels", abbreviation: "mt" },
	{ id: 41, namePt: "Marcos", nameEn: "Mark", testament: 2, chaptersCount: 16, categoryPt: "Evangelhos", categoryEn: "Gospels", abbreviation: "mc" },
	{ id: 42, namePt: "Lucas", nameEn: "Luke", testament: 2, chaptersCount: 24, categoryPt: "Evangelhos", categoryEn: "Gospels", abbreviation: "lc" },
	{ id: 43, namePt: "João", nameEn: "John", testament: 2, chaptersCount: 21, categoryPt: "Evangelhos", categoryEn: "Gospels", abbreviation: "jo" },

	// Novo Testamento — Histórico
	{ id: 44, namePt: "Atos", nameEn: "Acts", testament: 2, chaptersCount: 28, categoryPt: "Histórico", categoryEn: "History", abbreviation: "at" },

	// Novo Testamento — Epístolas Paulinas
	{ id: 45, namePt: "Romanos", nameEn: "Romans", testament: 2, chaptersCount: 16, categoryPt: "Epístolas Paulinas", categoryEn: "Pauline Epistles", abbreviation: "rm" },
	{ id: 46, namePt: "1 Coríntios", nameEn: "1 Corinthians", testament: 2, chaptersCount: 16, categoryPt: "Epístolas Paulinas", categoryEn: "Pauline Epistles", abbreviation: "1co" },
	{ id: 47, namePt: "2 Coríntios", nameEn: "2 Corinthians", testament: 2, chaptersCount: 13, categoryPt: "Epístolas Paulinas", categoryEn: "Pauline Epistles", abbreviation: "2co" },
	{ id: 48, namePt: "Gálatas", nameEn: "Galatians", testament: 2, chaptersCount: 6, categoryPt: "Epístolas Paulinas", categoryEn: "Pauline Epistles", abbreviation: "gl" },
	{ id: 49, namePt: "Efésios", nameEn: "Ephesians", testament: 2, chaptersCount: 6, categoryPt: "Epístolas Paulinas", categoryEn: "Pauline Epistles", abbreviation: "ef" },
	{ id: 50, namePt: "Filipenses", nameEn: "Philippians", testament: 2, chaptersCount: 4, categoryPt: "Epístolas Paulinas", categoryEn: "Pauline Epistles", abbreviation: "fp" },
	{ id: 51, namePt: "Colossenses", nameEn: "Colossians", testament: 2, chaptersCount: 4, categoryPt: "Epístolas Paulinas", categoryEn: "Pauline Epistles", abbreviation: "cl" },
	{ id: 52, namePt: "1 Tessalonicenses", nameEn: "1 Thessalonians", testament: 2, chaptersCount: 5, categoryPt: "Epístolas Paulinas", categoryEn: "Pauline Epistles", abbreviation: "1ts" },
	{ id: 53, namePt: "2 Tessalonicenses", nameEn: "2 Thessalonians", testament: 2, chaptersCount: 3, categoryPt: "Epístolas Paulinas", categoryEn: "Pauline Epistles", abbreviation: "2ts" },
	{ id: 54, namePt: "1 Timóteo", nameEn: "1 Timothy", testament: 2, chaptersCount: 6, categoryPt: "Epístolas Paulinas", categoryEn: "Pauline Epistles", abbreviation: "1tm" },
	{ id: 55, namePt: "2 Timóteo", nameEn: "2 Timothy", testament: 2, chaptersCount: 4, categoryPt: "Epístolas Paulinas", categoryEn: "Pauline Epistles", abbreviation: "2tm" },
	{ id: 56, namePt: "Tito", nameEn: "Titus", testament: 2, chaptersCount: 3, categoryPt: "Epístolas Paulinas", categoryEn: "Pauline Epistles", abbreviation: "tt" },
	{ id: 57, namePt: "Filemom", nameEn: "Philemon", testament: 2, chaptersCount: 1, categoryPt: "Epístolas Paulinas", categoryEn: "Pauline Epistles", abbreviation: "fm" },

	// Novo Testamento — Epístolas Gerais
	{ id: 58, namePt: "Hebreus", nameEn: "Hebrews", testament: 2, chaptersCount: 13, categoryPt: "Epístolas Gerais", categoryEn: "General Epistles", abbreviation: "hb" },
	{ id: 59, namePt: "Tiago", nameEn: "James", testament: 2, chaptersCount: 5, categoryPt: "Epístolas Gerais", categoryEn: "General Epistles", abbreviation: "tg" },
	{ id: 60, namePt: "1 Pedro", nameEn: "1 Peter", testament: 2, chaptersCount: 5, categoryPt: "Epístolas Gerais", categoryEn: "General Epistles", abbreviation: "1pe" },
	{ id: 61, namePt: "2 Pedro", nameEn: "2 Peter", testament: 2, chaptersCount: 3, categoryPt: "Epístolas Gerais", categoryEn: "General Epistles", abbreviation: "2pe" },
	{ id: 62, namePt: "1 João", nameEn: "1 John", testament: 2, chaptersCount: 5, categoryPt: "Epístolas Gerais", categoryEn: "General Epistles", abbreviation: "1jo" },
	{ id: 63, namePt: "2 João", nameEn: "2 John", testament: 2, chaptersCount: 1, categoryPt: "Epístolas Gerais", categoryEn: "General Epistles", abbreviation: "2jo" },
	{ id: 64, namePt: "3 João", nameEn: "3 John", testament: 2, chaptersCount: 1, categoryPt: "Epístolas Gerais", categoryEn: "General Epistles", abbreviation: "3jo" },
	{ id: 65, namePt: "Judas", nameEn: "Jude", testament: 2, chaptersCount: 1, categoryPt: "Epístolas Gerais", categoryEn: "General Epistles", abbreviation: "jd" },

	// Novo Testamento — Profético
	{ id: 66, namePt: "Apocalipse", nameEn: "Revelation", testament: 2, chaptersCount: 22, categoryPt: "Profético", categoryEn: "Prophetic", abbreviation: "ap" },
];

/**
 * Normalizes and looks up a book candidate against canon book names and abbreviations.
 */
export function getCanonBook(candidate: string): BibleCanonBook | null {
	const norm = normalizeText(candidate);
	if (!norm) return null;

	for (const book of BIBLE_CANON) {
		if (normalizeText(book.namePt) === norm || normalizeText(book.nameEn) === norm) {
			return book;
		}
		if (book.abbreviation === norm) {
			return book;
		}
	}

	for (const [key, aliases] of Object.entries(BOOK_ABBREVIATIONS)) {
		if (key === norm || aliases.includes(norm)) {
			const found = BIBLE_CANON.find((b) => normalizeText(b.namePt) === key || normalizeText(b.nameEn) === key);
			if (found) return found;
		}
	}

	return null;
}
