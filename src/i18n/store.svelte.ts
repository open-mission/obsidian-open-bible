import { moment } from "obsidian";
import type { LocalePreference, SupportedLocale, TranslationStrings } from "./types";
import { en } from "./locales/en";
import { pt } from "./locales/pt";

/** Locales shipped with the plugin. */
export const SUPPORTED_LOCALES: readonly SupportedLocale[] = ["en", "pt"] as const;

/** Locale used when a key is missing or when the preference cannot be resolved. */
export const FALLBACK_LOCALE: SupportedLocale = "en";

const translations: Record<SupportedLocale, TranslationStrings> = {
	en,
	pt,
};

/**
 * Current locale as module-level reactive state (Svelte 5 runes).
 * Any `t()` call made while rendering a component or inside an `$effect`/`$derived`
 * reads this state, so the UI re-renders automatically when the locale changes.
 */
let currentLocale = $state<SupportedLocale>(FALLBACK_LOCALE);

/** Maps an arbitrary language tag (e.g. "pt-BR") to a supported locale. */
function matchLocale(languageTag: string | null | undefined): SupportedLocale | null {
	const tag = languageTag?.toLowerCase();
	if (!tag) return null;
	for (const locale of SUPPORTED_LOCALES) {
		if (tag.startsWith(locale)) return locale;
	}
	return null;
}

/**
 * Detects the locale from the Obsidian UI language.
 * Obsidian stores its UI language in `localStorage.language`; moment and the browser
 * locale are used as fallbacks (e.g. on mobile or when the vault is not yet loaded).
 */
export function detectObsidianLocale(): SupportedLocale {
	try {
		const stored = matchLocale(window?.localStorage?.getItem("language"));
		if (stored) return stored;
	} catch {
		// localStorage may be restricted or unavailable
	}

	try {
		const momentLocale = matchLocale(moment.locale());
		if (momentLocale) return momentLocale;
	} catch {
		// moment may be uninitialized
	}

	try {
		const navigatorLocale = matchLocale(navigator?.language);
		if (navigatorLocale) return navigatorLocale;
	} catch {
		// navigator may be unavailable
	}

	return FALLBACK_LOCALE;
}

/** Current locale (reactive when read during component rendering). */
export function getLocale(): SupportedLocale {
	return currentLocale;
}

/** Applies a concrete locale. */
export function setLocale(locale: SupportedLocale): void {
	currentLocale = locale;
}

/**
 * Applies the user preference: `"auto"` follows the Obsidian UI language,
 * any other value is applied directly. Returns the resolved locale.
 */
export function applyLocalePreference(preference: LocalePreference): SupportedLocale {
	const resolved = preference === "auto" ? detectObsidianLocale() : preference;
	setLocale(resolved);
	return resolved;
}

/**
 * Resolves a dot-separated key (e.g. "settings.languageSettingName") for the current
 * locale, falling back to English and finally to the key itself.
 * Supports `{placeholder}` interpolation via `params`.
 */
export function t(key: string, params?: Record<string, string | number>): string {
	const dict = translations[currentLocale] ?? translations[FALLBACK_LOCALE];
	const resolved = lookup(dict, key) ?? lookup(translations[FALLBACK_LOCALE], key);

	if (typeof resolved !== "string") {
		return key;
	}
	if (!params) {
		return resolved;
	}

	return resolved.replace(/\{(\w+)\}/g, (_, name: string) =>
		name in params ? String(params[name]) : `{${name}}`,
	);
}

/** Walks the nested dictionary following the dotted key segments. */
function lookup(dictionary: TranslationStrings, key: string): unknown {
	let current: unknown = dictionary;
	for (const segment of key.split(".")) {
		if (!current || typeof current !== "object" || !(segment in current)) {
			return undefined;
		}
		current = (current as Record<string, unknown>)[segment];
	}
	return current;
}
