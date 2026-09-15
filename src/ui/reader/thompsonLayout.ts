export type ThompsonLayoutMode = "center" | "margin" | "off";

export function shouldUseCenter(
	enabled: boolean,
	position: "margin" | "center",
	twoColumnsEffective: boolean,
): ThompsonLayoutMode {
	if (!enabled) {
		return "off";
	}
	if (position === "center" && twoColumnsEffective) {
		return "center";
	}
	return "margin";
}

export function splitThompsonColumns<T>(items: T[]): { left: T[]; right: T[] } {
	const mid = Math.ceil(items.length / 2);
	return {
		left: items.slice(0, mid),
		right: items.slice(mid),
	};
}
