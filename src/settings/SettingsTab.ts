import { PluginSettingTab, type App } from "obsidian";
import { mount, unmount } from "svelte";
import SettingsApp from "../ui/settings/SettingsApp.svelte";
import type { OpenBibleSettings } from "../settings";
import type OpenBiblePlugin from "../main";

export class OpenBibleSettingTab extends PluginSettingTab {
	private component: Record<string, unknown> | undefined;
	private initialSectionId: string | null = null;

	constructor(
		app: App,
		private readonly plugin: OpenBiblePlugin,
	) {
		super(app, plugin);
	}

	display(): void {
		this.unmount();
		const { containerEl } = this;
		containerEl.empty();
		containerEl.addClass("ob-settings-tab");
		this.component = mount(SettingsApp, {
			target: containerEl,
			props: {
				app: this.app,
				service: this.plugin.bibleVersions,
				settings: this.plugin.settings,
				initialSectionId: this.initialSectionId,
				updateDataFolder: (value: string) => this.plugin.updateDataFolder(value),
				updateGeneral: (patch: Partial<OpenBibleSettings>) => this.plugin.updateGeneral(patch),
			},
		});
	}

	/** Opens a specific settings section the next time the tab is displayed. */
	openSection(sectionId: string): void {
		this.initialSectionId = sectionId;
	}

	hide(): void {
		this.initialSectionId = null;
		this.unmount();
		super.hide();
	}

	private unmount(): void {
		if (this.component) {
			void unmount(this.component);
			this.component = undefined;
		}
	}
}
