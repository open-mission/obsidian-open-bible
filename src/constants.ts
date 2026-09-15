export const BOOK_ABBREVIATIONS: Record<string, string[]> = {
	// Portuguese & English bilingual books and abbreviations
	"genesis": ["gn", "gen", "genesis"],
	"exodo": ["ex", "exo", "exod", "exodus"],
	"exodus": ["ex", "exo", "exod", "exodo"],
	"levitico": ["lv", "lev", "leviticus"],
	"leviticus": ["lv", "lev", "levitico"],
	"numeros": ["nm", "num", "numbers"],
	"numbers": ["nm", "num", "numeros"],
	"deuteronomio": ["dt", "deu", "deut", "deuteronomy"],
	"deuteronomy": ["dt", "deu", "deut", "deuteronomio"],
	"josue": ["js", "jos", "josh", "joshua"],
	"joshua": ["js", "jos", "josh", "josue"],
	"juizes": ["jz", "jui", "judg", "judges"],
	"judges": ["jz", "jui", "judg", "juizes"],
	"rute": ["rt", "rut", "ruth"],
	"ruth": ["rt", "rut", "rute"],
	"1 samuel": ["1sm", "1sam", "1s"],
	"2 samuel": ["2sm", "2sam", "2s"],
	"1 reis": ["1rs", "1re", "1r", "1ki", "1kgs", "1 kings"],
	"1 kings": ["1ki", "1kgs", "1k", "1rs", "1re", "1 reis"],
	"2 reis": ["2rs", "2re", "2r", "2ki", "2kgs", "2 kings"],
	"2 kings": ["2ki", "2kgs", "2k", "2rs", "2re", "2 reis"],
	"1 cronicas": ["1cr", "1cro", "1c", "1ch", "1chr", "1 chronicles"],
	"1 chronicles": ["1ch", "1chr", "1c", "1cr", "1cro", "1 cronicas"],
	"2 cronicas": ["2cr", "2cro", "2c", "2ch", "2chr", "2 chronicles"],
	"2 chronicles": ["2ch", "2chr", "2c", "2cr", "2cro", "2 cronicas"],
	"esdras": ["ed", "esd", "ezr", "ezra"],
	"ezra": ["ezr", "ez", "ed", "esd", "esdras"],
	"neemias": ["ne", "nee", "neh", "nehemiah"],
	"nehemiah": ["neh", "ne", "nee", "neemias"],
	"ester": ["et", "est", "esther"],
	"esther": ["est", "et", "ester"],
	"jo": ["jb", "job"],
	"job": ["jb", "job", "jo"],
	"salmos": ["sl", "sal", "ps", "psa", "psm", "psalms", "psalm"],
	"psalms": ["ps", "psa", "psm", "sl", "sal", "salmos", "psalm"],
	"psalm": ["ps", "psa", "psm", "sl", "sal", "salmos", "psalms"],
	"proverbios": ["pv", "pro", "prov", "pr", "proverbs"],
	"proverbs": ["pr", "pro", "prov", "pv", "proverbios"],
	"eclesiastes": ["ec", "ecl", "ecc", "eccl", "ecclesiastes"],
	"ecclesiastes": ["ecc", "eccl", "ec", "ecl", "eclesiastes"],
	"cantares": ["ct", "cant", "canticos", "song", "sos", "song of solomon", "song of songs"],
	"song of solomon": ["sos", "song", "cant", "ct", "cantares"],
	"song of songs": ["sos", "song", "cant", "ct", "cantares"],
	"isaias": ["is", "isa", "isaiah"],
	"isaiah": ["isa", "is", "isaias"],
	"jeremias": ["jr", "jer", "jeremiah"],
	"jeremiah": ["jer", "jr", "jeremias"],
	"lamentacoes": ["lm", "lam", "lamentations"],
	"lamentations": ["lam", "lm", "lamentacoes"],
	"ezequiel": ["ez", "eze", "ezk", "ezekiel"],
	"ezekiel": ["ezk", "eze", "ez", "ezequiel"],
	"daniel": ["dn", "dan"],
	"oseias": ["os", "ose", "hos", "hosea"],
	"hosea": ["hos", "os", "ose", "oseias"],
	"joel": ["jl", "joe"],
	"amos": ["am", "amo"],
	"obadias": ["ob", "oba", "obad", "obadiah"],
	"obadiah": ["obad", "ob", "oba", "obadias"],
	"jonas": ["jn", "jon", "jonah"],
	"jonah": ["jon", "jn", "jonas"],
	"miqueias": ["mq", "miq", "mic", "micah"],
	"micah": ["mic", "mq", "miq", "miqueias"],
	"naum": ["na", "nau", "nah", "nahum"],
	"nahum": ["nah", "na", "nau", "naum"],
	"habacuque": ["hc", "hab", "habakkuk"],
	"habakkuk": ["hab", "hc", "habacuque"],
	"sofonias": ["sf", "sof", "zep", "zeph", "zephaniah"],
	"zephaniah": ["zep", "zeph", "sf", "sof", "sofonias"],
	"ageu": ["ag", "age", "hag", "haggai"],
	"haggai": ["hag", "ag", "age", "ageu"],
	"zacarias": ["zc", "zac", "zec", "zech", "zechariah"],
	"zechariah": ["zec", "zech", "zc", "zac", "zacarias"],
	"malaquias": ["ml", "mal", "malachi"],
	"malachi": ["mal", "ml", "malaquias"],
	"mateus": ["mt", "mat", "matt", "matthew"],
	"matthew": ["mt", "mat", "matt", "mateus"],
	"marcos": ["mc", "mar", "mk", "mrk", "mark"],
	"mark": ["mk", "mrk", "mc", "mar", "marcos"],
	"lucas": ["lc", "luc", "lk", "luk", "luke"],
	"luke": ["lk", "luk", "lc", "luc", "lucas"],
	"joao": ["jo", "joa", "jn", "jhn", "john"],
	"john": ["jn", "jhn", "jo", "joa", "joao"],
	"atos": ["at", "act", "acts"],
	"acts": ["act", "acts", "at", "atos"],
	"romanos": ["rm", "rom", "ro", "romans"],
	"romans": ["ro", "rom", "rm", "romanos"],
	"1 corintios": ["1co", "1cor", "1 corinthians"],
	"1 corinthians": ["1co", "1cor", "1 corintios"],
	"2 corintios": ["2co", "2cor", "2 corinthians"],
	"2 corinthians": ["2co", "2cor", "2 corintios"],
	"galatas": ["gl", "gal", "ga", "galatians"],
	"galatians": ["ga", "gal", "gl", "galatas"],
	"efesios": ["ef", "efe", "eph", "ephesians"],
	"ephesians": ["eph", "ef", "efe", "efesios"],
	"filipenses": ["fp", "fil", "flp", "php", "phil", "philippians"],
	"philippians": ["php", "phil", "fp", "fil", "flp", "filipenses"],
	"colossenses": ["cl", "col", "colossians"],
	"colossians": ["col", "cl", "colossenses"],
	"1 tessalonicenses": ["1ts", "1tes", "1th", "1thess", "1 thessalonians"],
	"1 thessalonians": ["1th", "1thess", "1ts", "1tes", "1 tessalonicenses"],
	"2 tessalonicenses": ["2ts", "2tes", "2th", "2thess", "2 thessalonians"],
	"2 thessalonians": ["2th", "2thess", "2ts", "2tes", "2 tessalonicenses"],
	"1 timoteo": ["1tm", "1tim", "1ti", "1 timothy"],
	"1 timothy": ["1ti", "1tim", "1tm", "1 timoteo"],
	"2 timoteo": ["2tm", "2tim", "2ti", "2 timothy"],
	"2 timothy": ["2ti", "2tim", "2tm", "2 timoteo"],
	"tito": ["tt", "tit", "titus"],
	"titus": ["tit", "tt", "tito"],
	"filemom": ["fm", "flm", "phm", "philemon"],
	"philemon": ["phm", "fm", "flm", "filemom"],
	"hebreus": ["hb", "heb", "hebrews"],
	"hebrews": ["heb", "hb", "hebreus"],
	"tiago": ["tg", "tia", "jas", "jam", "james"],
	"james": ["jas", "jam", "tg", "tia", "tiago"],
	"1 pedro": ["1pe", "1ped", "1p", "1pet", "1 peter"],
	"1 peter": ["1pe", "1ped", "1pet", "1p", "1 pedro"],
	"2 pedro": ["2pe", "2ped", "2p", "2pet", "2 peter"],
	"2 peter": ["2pe", "2ped", "2pet", "2p", "2 pedro"],
	"1 joao": ["1jo", "1j", "1jn", "1 john"],
	"1 john": ["1jn", "1jo", "1j", "1 joao"],
	"2 joao": ["2jo", "2j", "2jn", "2 john"],
	"2 john": ["2jn", "2jo", "2j", "2 joao"],
	"3 joao": ["3jo", "3j", "3jn", "3 john"],
	"3 john": ["3jn", "3jo", "3j", "3 joao"],
	"judas": ["jd", "jud", "jude"],
	"jude": ["jud", "jd", "judas"],
	"apocalipse": ["ap", "apo", "apoc", "rev", "revelation"],
	"revelation": ["rev", "re", "ap", "apo", "apoc", "apocalipse"],
};

export function normalizeText(text: string): string {
	return text
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase()
		.trim();
}

export function matchesBookSearch(bookName: string, query: string): boolean {
	const normQuery = normalizeText(query);
	if (!normQuery) return true;
	const normName = normalizeText(bookName);
	if (normName.includes(normQuery)) return true;
	const abbrevs = BOOK_ABBREVIATIONS[normName] ?? [];
	return abbrevs.some((abbr) => abbr === normQuery || abbr.startsWith(normQuery));
}

export const DATABASE_EXTENSION = /\.(sqlite|sqlite3|db)$/i;
export const DEFAULT_DATA_FOLDER = "OpenBible";
export const DEFAULT_DATABASE_FOLDER = "bibles";
export const PLUGIN_FOLDER = ".obsidian/plugins/open-bible";
export const LEGACY_PLUGIN_FOLDER = ".obsidian/plugins/obsidian-open-bible";
export const VIEW_TYPE_BIBLE_READER = "open-bible-reader";

export function hasSqliteHeader(buffer: ArrayBuffer): boolean {
	if (buffer.byteLength < 16) return false;
	const magic = new Uint8Array(buffer, 0, 16);
	const expected = [0x53, 0x51, 0x4c, 0x69, 0x74, 0x65, 0x20, 0x66, 0x6f, 0x72, 0x6d, 0x61, 0x74, 0x20, 0x33, 0x00];
	return expected.every((byte, i) => magic[i] === byte);
}

export function sanitizeDatabaseName(value: string): string {
	return value
		.replace(/[\\/:*?"<>|]/g, "-")
		.replace(/\s+/g, " ")
		.trim()
		.replace(/[. ]+$/, "");
}

export function abbreviationFromFilename(filename: string): string {
	const stem = filename.replace(DATABASE_EXTENSION, "");
	const parts = stem.split(/[_\-\s]+/).filter(Boolean);
	const candidate = parts[parts.length - 1] ?? stem;
	return candidate.replace(/[^a-z0-9]/gi, "").toUpperCase().slice(0, 8) || "BÍBLIA";
}

