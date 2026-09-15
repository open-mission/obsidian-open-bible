import type { IconName } from "obsidian";

export interface SettingsItemDef {
	id: string;
	title: string;
	description?: string;
	icon?: IconName;
	badge?: string;
	disabled?: boolean;
}
