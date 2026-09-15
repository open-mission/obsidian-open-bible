/** Installed Bible version in vault. id === filePath (unique by construction). */
export interface BibleVersion {
	id: string;
	name: string;
	abbreviation: string;
	filePath: string;
	language?: string;
	isDefault?: boolean;
	mdPath?: string;
}
