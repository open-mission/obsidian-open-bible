export interface CrossReference {
	fromBook: number;
	fromChapter: number;
	fromVerse: number;
	toBook: number;
	toChapter: number;
	toVerseStart: number;
	toVerseEnd: number;
	votes: number;
}

export interface CrossReferenceBlock {
	fromVerse: number;
	refs: CrossReference[];
}

export const RESOURCE_XREF_BAR_LIMIT = 10;
export const RESOURCE_XREF_MARGIN_LIMIT = 4;
export const CROSS_REFS_MODULE_ID = "cross-refs";
export const CROSS_REFS_FILTER_ID = "module:cross-refs";

export function groupRefsIntoBlocks(
	refs: CrossReference[],
): CrossReferenceBlock[] {
	const byVerse = new Map<number, CrossReference[]>();

	for (const ref of refs) {
		const block = byVerse.get(ref.fromVerse);
		if (block) {
			block.push(ref);
		} else {
			byVerse.set(ref.fromVerse, [ref]);
		}
	}

	return [...byVerse.entries()]
		.sort(([leftVerse], [rightVerse]) => leftVerse - rightVerse)
		.map(([fromVerse, blockRefs]) => ({
			fromVerse,
			refs: [...blockRefs].sort((left, right) => right.votes - left.votes),
		}));
}

export function splitVisible(
	refs: CrossReference[],
	limit: number,
): { visible: CrossReference[]; overflow: CrossReference[] } {
	return {
		visible: refs.slice(0, limit),
		overflow: refs.slice(limit),
	};
}

export function crossRefsEqual(left: CrossReference, right: CrossReference): boolean {
	return (
		left.fromBook === right.fromBook &&
		left.fromChapter === right.fromChapter &&
		left.fromVerse === right.fromVerse &&
		left.toBook === right.toBook &&
		left.toChapter === right.toChapter &&
		left.toVerseStart === right.toVerseStart &&
		left.toVerseEnd === right.toVerseEnd
	);
}

export function indexOfCrossRef(refs: CrossReference[], target: CrossReference): number {
	return refs.findIndex((ref) => crossRefsEqual(ref, target));
}

/** Stable unique key for Svelte `{#each}`. */
export function crossRefDomKey(ref: CrossReference): string {
	return [
		ref.fromBook,
		ref.fromChapter,
		ref.fromVerse,
		ref.toBook,
		ref.toChapter,
		ref.toVerseStart,
		ref.toVerseEnd,
	].join(":");
}

/** Chain order for prev/next in preview dialog. */
export function chainForDialog(block: CrossReferenceBlock, expanded: boolean): CrossReference[] {
	const { visible, overflow } = splitVisible(block.refs, RESOURCE_XREF_BAR_LIMIT);
	return expanded ? [...visible, ...overflow] : visible;
}
