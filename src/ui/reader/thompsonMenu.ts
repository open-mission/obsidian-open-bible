import { Menu, Platform } from "obsidian";
import type OpenBiblePlugin from "../../main";
import { t } from "../../i18n";

export const THOMPSON_NARROW_BREAKPOINT = 640;

export function isWideViewport(): boolean {
	return !Platform.isMobile && window.innerWidth > THOMPSON_NARROW_BREAKPOINT;
}

export function addThompsonMenuItems(menu: Menu, plugin: OpenBiblePlugin): void {
	const enabled = Boolean(plugin.settings.thompsonCrossRefsEnabled);
	const position = plugin.settings.thompsonCrossRefsPosition ?? "margin";

	menu.addItem((item) => {
		item
			.setTitle(t("readerMenu.thompsonCrossRefs") || "Referências cruzadas (Thompson)")
			.setIcon("link")
			.setChecked(enabled)
			.onClick(async () => {
				plugin.settings.thompsonCrossRefsEnabled = !enabled;
				await plugin.saveSettings();
				plugin.refreshReaderViews();
			});
	});

	if (enabled) {
		menu.addItem((item) => {
			item
				.setTitle(t("readerMenu.thompsonPositionMargin") || "Thompson: Margem")
				.setChecked(position === "margin")
				.onClick(async () => {
					plugin.settings.thompsonCrossRefsPosition = "margin";
					await plugin.saveSettings();
					plugin.refreshReaderViews();
				});
		});
		menu.addItem((item) => {
			item
				.setTitle(t("readerMenu.thompsonPositionCenter") || "Thompson: Coluna central")
				.setChecked(position === "center")
				.onClick(async () => {
					plugin.settings.thompsonCrossRefsPosition = "center";
					if (isWideViewport()) {
						plugin.settings.twoColumnLayout = true;
						plugin.settings.readerTwoColumns = true;
					}
					await plugin.saveSettings();
					plugin.refreshReaderViews();
				});
		});
	}
}
