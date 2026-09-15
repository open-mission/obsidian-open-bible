import { Menu } from "obsidian";
import type { CrossReference } from "../../data/crossRefModel";
import { getLocale } from "../../i18n";
import { formatCrossRef } from "./formatCrossRef";

interface MenuWithDom {
	dom?: HTMLElement;
}

export function openThompsonXrefMenu(
	event: MouseEvent,
	refs: CrossReference[],
	onSelect: (ref: CrossReference, event: MouseEvent) => void,
): void {
	event.stopPropagation();
	if (refs.length === 0) return;

	const locale = getLocale();
	const menu = new Menu();
	menu.setUseNativeMenu(false);
	menu.setNoIcon();
	for (const ref of refs) {
		menu.addItem((item) => {
			item.setTitle(formatCrossRef(ref, "short", locale)).onClick(() => {
				onSelect(ref, event);
			});
		});
	}
	menu.showAtMouseEvent(event);
	(menu as MenuWithDom).dom?.addClass("open-bible-thompson-xref-menu");
}
