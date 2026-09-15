import { setIcon } from "obsidian";

export function icon(node: HTMLElement, iconName: string) {
	if (iconName) {
		setIcon(node, iconName);
	}
	return {
		update(newIconName: string) {
			if (newIconName) {
				node.empty();
				setIcon(node, newIconName);
			}
		},
	};
}
