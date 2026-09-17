/** Curated Lucide icon names (resolved via Obsidian `setIcon`) for resource types. */

export interface ResourceIconOption {
	value: string;
	label: string;
}

export interface ResourceIconGroup {
	group: string;
	icons: ResourceIconOption[];
}

export const RESOURCE_ICON_GROUPS: ResourceIconGroup[] = [
	{
		group: "Pessoas",
		icons: [
			{ value: "user", label: "user" },
			{ value: "users", label: "users" },
			{ value: "baby", label: "baby" },
			{ value: "crown", label: "crown" },
			{ value: "hand", label: "hand" },
			{ value: "heart", label: "heart" },
			{ value: "footprints", label: "footprints" },
		],
	},
	{
		group: "Lugares",
		icons: [
			{ value: "map-pin", label: "map-pin" },
			{ value: "map", label: "map" },
			{ value: "landmark", label: "landmark" },
			{ value: "church", label: "church" },
			{ value: "castle", label: "castle" },
			{ value: "tent", label: "tent" },
			{ value: "home", label: "home" },
			{ value: "mountain", label: "mountain" },
			{ value: "tree-pine", label: "tree-pine" },
			{ value: "waves", label: "waves" },
			{ value: "compass", label: "compass" },
			{ value: "globe", label: "globe" },
			{ value: "flag", label: "flag" },
		],
	},
	{
		group: "Estudo e objetos",
		icons: [
			{ value: "link", label: "link" },
			{ value: "book-open", label: "book-open" },
			{ value: "book", label: "book" },
			{ value: "scroll", label: "scroll" },
			{ value: "scroll-text", label: "scroll-text" },
			{ value: "library", label: "library" },
			{ value: "graduation-cap", label: "graduation-cap" },
			{ value: "lightbulb", label: "lightbulb" },
			{ value: "quote", label: "quote" },
			{ value: "pen-line", label: "pen-line" },
			{ value: "star", label: "star" },
			{ value: "sparkles", label: "sparkles" },
			{ value: "sun", label: "sun" },
			{ value: "moon", label: "moon" },
			{ value: "flame", label: "flame" },
			{ value: "sword", label: "sword" },
			{ value: "swords", label: "swords" },
			{ value: "shield", label: "shield" },
			{ value: "anchor", label: "anchor" },
			{ value: "cross", label: "cross" },
			{ value: "scale", label: "scale" },
			{ value: "key", label: "key" },
			{ value: "gift", label: "gift" },
			{ value: "music", label: "music" },
			{ value: "calendar", label: "calendar" },
			{ value: "hourglass", label: "hourglass" },
			{ value: "fish", label: "fish" },
			{ value: "bird", label: "bird" },
			{ value: "leaf", label: "leaf" },
			{ value: "droplet", label: "droplet" },
		],
	},
];

/** Flat list of all curated icon values (used to validate stored settings). */
export const ALL_RESOURCE_ICONS: string[] = RESOURCE_ICON_GROUPS.flatMap((g) =>
	g.icons.map((i) => i.value),
);
