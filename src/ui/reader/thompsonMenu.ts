import { Menu, Platform } from "obsidian";
import type OpenBiblePlugin from "../../main";
import { t } from "../../i18n";
import type { BibleReaderController } from "./types";

export const THOMPSON_NARROW_BREAKPOINT = 640;

export function isWideViewport(): boolean {
	return !Platform.isMobile && window.innerWidth > THOMPSON_NARROW_BREAKPOINT;
}

export function addThompsonMenuItems(
	menu: Menu,
	plugin: OpenBiblePlugin,
	controller?: BibleReaderController | null,
): void {
	const viewState = controller?.getViewState?.();
	const enabled = viewState?.thompsonCrossRefsEnabled !== undefined
		? viewState.thompsonCrossRefsEnabled
		: Boolean(plugin.settings.thompsonCrossRefsEnabled);
	const position = viewState?.thompsonCrossRefsPosition ?? plugin.settings.thompsonCrossRefsPosition ?? "margin";

	menu.addItem((item) => {
		item
			.setTitle(t("readerMenu.thompsonCrossRefs") || "Referências cruzadas (Thompson)")
			.setIcon("link")
			.setChecked(enabled)
			.onClick(async () => {
				if (controller?.toggleThompson) {
					controller.toggleThompson();
				} else {
					plugin.settings.thompsonCrossRefsEnabled = !enabled;
					await plugin.saveSettings();
					plugin.refreshReaderViews();
				}
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
