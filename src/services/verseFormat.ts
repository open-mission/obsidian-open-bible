import type { BibleVerse } from "../models/bible";

const SUPERSCRIPT_MAP: Record<string, string> = {
	"0": "⁰",
	"1": "¹",
	"2": "²",
	"3": "³",
	"4": "⁴",
	"5": "⁵",
	"6": "⁶",
	"7": "⁷",
	"8": "⁸",
	"9": "⁹",
};

export function toSuperscript(num: number): string {
	return String(num)
		.split("")
		.map((char) => SUPERSCRIPT_MAP[char] ?? char)
		.join("");
}

export function formatVerseRange(verseNumbers: number[]): string {
	if (verseNumbers.length === 0) return "";
	const sorted = [...new Set(verseNumbers)].sort((a, b) => a - b);

	const ranges: string[] = [];
	let start = sorted[0];
	let end = start;

	for (let i = 1; i < sorted.length; i++) {
		if (sorted[i] === end + 1) {
			end = sorted[i];
		} else {
			ranges.push(start === end ? `${start}` : `${start}-${end}`);
			start = sorted[i];
			end = start;
		}
	}
	ranges.push(start === end ? `${start}` : `${start}-${end}`);

	return ranges.join(", ");
}

export function formatReference(
	bookName: string,
	chapter: number,
	verseNumbers: number[],
	versionAbbr?: string
): string {
	const range = formatVerseRange(verseNumbers);
	const base = `${bookName} ${chapter}:${range}`;
	return versionAbbr ? `${base} (${versionAbbr})` : base;
}

export function formatVersesText(
	verses: BibleVerse[],
	bookName: string,
	chapter: number,
	versionAbbr?: string
): string {
	const sorted = [...verses].sort((a, b) => a.number - b.number);
	const lines = sorted.map((v) => `> ${toSuperscript(v.number)} ${v.text}`);
	const reference = formatReference(bookName, chapter, sorted.map((v) => v.number), versionAbbr);
	return `${lines.join("\n>\n")}\n>\n> — ${reference}`;
}

export function formatVersesPlainText(
	verses: BibleVerse[],
	bookName: string,
	chapter: number,
	versionAbbr?: string
): string {
	const sorted = [...verses].sort((a, b) => a.number - b.number);
	const text = sorted.map((v) => `${toSuperscript(v.number)} ${v.text}`).join("\n");
	const reference = formatReference(bookName, chapter, sorted.map((v) => v.number), versionAbbr);
	return `${text}\n— ${reference}`;
}

