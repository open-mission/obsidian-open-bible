import { setIcon, type IconName } from "obsidian";

/** Svelte action for native Obsidian Lucide icons. Usage: <span use:lucide={"database"} /> */
export function lucide(node: HTMLElement, name: IconName): void {
	node.empty();
	setIcon(node, name);
}
