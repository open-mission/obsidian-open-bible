import type { Workspace, WorkspaceLeaf } from "obsidian";

export type ViewSplit = "tab" | "left" | "right";

/** Expands a collapsed side dock so the revealed leaf is visible. */
function expandSplitIfNeeded(workspace: Workspace, leaf: WorkspaceLeaf): void {
	const root = leaf.getRoot();
	if (root === workspace.rightSplit && workspace.rightSplit.collapsed) {
		workspace.rightSplit.expand();
	} else if (root === workspace.leftSplit && workspace.leftSplit.collapsed) {
		workspace.leftSplit.expand();
	}
}

/**
 * Reveals an existing leaf of the given view type or creates one in the requested
 * location. Keeps a single instance per split instead of spawning duplicates.
 */
export async function openOrRevealView(
	workspace: Workspace,
	type: string,
	split: ViewSplit = "tab",
): Promise<WorkspaceLeaf | null> {
	const leaves = workspace.getLeavesOfType(type);

	if (split === "tab") {
		const existing = leaves[0];
		if (existing) {
			await workspace.revealLeaf(existing);
			expandSplitIfNeeded(workspace, existing);
			return existing;
		}
		const leaf = workspace.getLeaf("tab");
		await leaf.setViewState({ type, active: true });
		await workspace.revealLeaf(leaf);
		return leaf;
	}

	const sideRoot = split === "right" ? workspace.rightSplit : workspace.leftSplit;
	const existing = leaves.find((candidate) => candidate.getRoot() === sideRoot);
	const leaf = existing ?? (split === "right" ? workspace.getRightLeaf(false) : workspace.getLeftLeaf(false));
	if (!leaf) return null;

	if (!existing) {
		await leaf.setViewState({ type, active: true });
	}
	await workspace.revealLeaf(leaf);
	if (sideRoot?.collapsed) {
		sideRoot.expand();
	}
	return leaf;
}