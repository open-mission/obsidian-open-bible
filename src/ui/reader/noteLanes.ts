export interface NoteLaneSource {
	id: string;
	verses: number[];
	color: string;
	linkedNotePath?: string;
	noteTitle?: string;
}

export interface NoteLaneInfo {
	id: string;
	noteTitle: string;
	linkedNotePath: string;
	color: string;
	minVerse: number;
	maxVerse: number;
	verseSet: Set<number>;
	lane: number;
}

export interface VerseLaneSlot {
	note: NoteLaneInfo;
	isStart: boolean;
	isEnd: boolean;
}

export interface NoteLanesData {
	totalLanes: number;
	notes: NoteLaneInfo[];
}

export function resolveNoteTitle(
	path: string,
	fallbackTitle: string | undefined,
	basenameFromVault: string | null
): string {
	return (
		basenameFromVault ||
		fallbackTitle ||
		path.split("/").pop()?.replace(/\.md$/i, "") ||
		""
	);
}

export function buildNoteLanes(
	notes: NoteLaneSource[],
	resolveTitle: (path: string, fallback?: string) => string
): NoteLanesData {
	if (notes.length === 0) {
		return { totalLanes: 0, notes: [] };
	}

	const items: NoteLaneInfo[] = notes.map((h) => {
		const minVerse = Math.min(...h.verses);
		const maxVerse = Math.max(...h.verses);
		return {
			id: h.id,
			noteTitle: resolveTitle(h.linkedNotePath || "", h.noteTitle),
			linkedNotePath: h.linkedNotePath || "",
			color: h.color,
			minVerse,
			maxVerse,
			verseSet: new Set(h.verses),
			lane: 0,
		};
	});

	items.sort((a, b) => {
		if (a.minVerse !== b.minVerse) return a.minVerse - b.minVerse;
		const spanA = a.maxVerse - a.minVerse;
		const spanB = b.maxVerse - b.minVerse;
		if (spanA !== spanB) return spanB - spanA;
		return a.id.localeCompare(b.id);
	});

	const laneOccupants: { minVerse: number; maxVerse: number }[][] = [];

	for (const item of items) {
		let assignedLane = -1;
		for (let l = 0; l < laneOccupants.length; l++) {
			const hasOverlap = laneOccupants[l].some(
				(occ) => !(item.maxVerse < occ.minVerse || item.minVerse > occ.maxVerse)
			);
			if (!hasOverlap) {
				assignedLane = l;
				laneOccupants[l].push({ minVerse: item.minVerse, maxVerse: item.maxVerse });
				break;
			}
		}

		if (assignedLane === -1) {
			assignedLane = laneOccupants.length;
			laneOccupants.push([{ minVerse: item.minVerse, maxVerse: item.maxVerse }]);
		}

		item.lane = assignedLane;
	}

	return {
		totalLanes: laneOccupants.length,
		notes: items,
	};
}

export function buildVerseLanesMap(
	verseNumbers: number[],
	lanes: NoteLanesData
): Map<number, (VerseLaneSlot | null)[]> {
	const map = new Map<number, (VerseLaneSlot | null)[]>();
	const totalLanes = lanes.totalLanes;
	if (totalLanes === 0) return map;

	for (const verseNumber of verseNumbers) {
		const slots: (VerseLaneSlot | null)[] = new Array(totalLanes).fill(null);
		for (const note of lanes.notes) {
			if (note.verseSet.has(verseNumber)) {
				const isStart = !note.verseSet.has(verseNumber - 1);
				const isEnd = !note.verseSet.has(verseNumber + 1);
				slots[note.lane] = { note, isStart, isEnd };
			}
		}
		map.set(verseNumber, slots);
	}

	return map;
}
