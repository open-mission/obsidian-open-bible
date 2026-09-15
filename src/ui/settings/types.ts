import type { Component } from "svelte";
import type { App, IconName } from "obsidian";
import type { BibleVersionService } from "../../services/bibleVersionService";
import type { OpenBibleSettings } from "../../settings";

/** Uniform context received by every section. Each section only uses what it needs. */
export interface SectionContext {
	app: App;
	service: BibleVersionService;
	settings: OpenBibleSettings;
	updateDataFolder: (value: string) => Promise<string>;
	updateGeneral: (patch: Partial<OpenBibleSettings>) => Promise<void>;
}

/** Definition for registering a settings section. */
export interface SectionDef {
	id: string;
	title: string;
	description?: string;
	icon?: IconName;
	component: Component<SectionContext>;
	/** Optional backwards-compatible alias for title */
	label?: string;
}
