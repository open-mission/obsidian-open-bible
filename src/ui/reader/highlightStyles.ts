const NAMED_COLORS: Record<string, string> = {
	yellow: "var(--color-yellow, #eab308)",
	green: "var(--color-green, #22c55e)",
	blue: "var(--color-blue, #3b82f6)",
	purple: "var(--color-purple, #a855f7)",
	pink: "var(--color-pink, #ec4899)",
	orange: "var(--color-orange, #f97316)",
};

/**
 * Returns a CSS-safe color string for underlines, indicators, and palette dots.
 */
export function resolveHighlightCssColor(color: string | undefined): string {
	if (!color) return NAMED_COLORS.yellow;

	const trimmed = color.trim().toLowerCase();
	if (NAMED_COLORS[trimmed]) {
		return NAMED_COLORS[trimmed];
	}

	if (
		trimmed.startsWith("#") ||
		trimmed.startsWith("rgb") ||
		trimmed.startsWith("hsl") ||
		trimmed.startsWith("var(")
	) {
		return color;
	}

	return `var(--color-${trimmed}, ${color})`;
}
