import { t } from "../../i18n";
import type OpenBiblePlugin from "../../main";

export const GUIDE_CATEGORY_IDS = [
	"read",
	"find",
	"study",
	"create",
	"integrate",
	"configure",
] as const;

export const GUIDE_CONTEXT_IDS = [
	"workspace",
	"reader",
	"selection",
	"editor",
	"settings",
	"automatic",
] as const;

export type GuideCategoryId = (typeof GUIDE_CATEGORY_IDS)[number];
export type GuideContextId = (typeof GUIDE_CONTEXT_IDS)[number];
export type GuideContextFilter = GuideContextId | "all";
export type GuideRequirement = "none" | "database" | "selection" | "editor";
export type GuideAvailabilityState = "ready" | "setup" | "context" | "automatic";
export type GuideActionTone = "primary" | "secondary";

export type GuideActionId =
	| "open-reader"
	| "reader-new-tab"
	| "reader-split"
	| "reader-left"
	| "reader-right"
	| "open-book"
	| "open-chapter"
	| "open-version"
	| "open-history"
	| "open-appearance"
	| "toggle-two-columns"
	| "toggle-selection"
	| "open-passage"
	| "insert-scripture"
	| "create-note"
	| "open-compare"
	| "compare-tab"
	| "compare-split"
	| "open-highlights"
	| "highlights-right"
	| "highlights-left"
	| "resources-right"
	| "resources-left"
	| "open-resource-hub"
	| "resource-hub-right"
	| "resource-hub-new-tab"
	| "open-resource-detail"
	| "resource-detail-right"
	| "toggle-thompson"
	| "toggle-crossrefs-panel"
	| "configure-general"
	| "configure-data"
	| "configure-reader"
	| "configure-study"
	| "configure-notes"
	| "configure-resources"
	| "configure-language"
	| "configure-about";

export interface GuideCapabilityDefinition {
	id: string;
	category: GuideCategoryId;
	contexts: GuideContextId[];
	requirement: GuideRequirement;
	icon: string;
	keywords: string[];
	actionIds: GuideActionId[];
	relatedIds: string[];
	requiresDatabase: boolean;
	featured?: boolean;
}

export interface GuideAction {
	id: GuideActionId;
	label: string;
	icon: string;
	tone: GuideActionTone;
	run: () => void | Promise<void>;
	disabled?: boolean;
	disabledReason?: string;
}

export interface GuideAvailability {
	state: GuideAvailabilityState;
	label: string;
}

export interface GuideCapability extends GuideCapabilityDefinition {
	title: string;
	summary: string;
	detail: string;
	categoryLabel: string;
	contextLabels: string[];
	availability: GuideAvailability;
	actions: GuideAction[];
}

const DATABASE_CAPABILITY_IDS = new Set([
	"open-reader",
	"reading-navigation",
	"reading-history",
	"reader-layout",
	"reader-selection",
	"selection-actions",
	"open-passage",
	"compare-versions",
	"comparison-organization",
	"export-canvas",
	"export-excalidraw",
	"inline-cross-references",
	"cross-reference-panel",
	"cross-reference-preview",
	"create-note",
	"note-preview",
	"resource-links",
	"resource-preview",
	"markdown-preview",
	"insert-scripture",
	"markdown-context-actions",
	"remember-context",
]);

const capability = (
	id: string,
	category: GuideCategoryId,
	contexts: GuideContextId[],
	requirement: GuideRequirement,
	icon: string,
	keywords: string[],
	actionIds: GuideActionId[],
	relatedIds: string[],
	featured = false,
): GuideCapabilityDefinition => ({
	id,
	category,
	contexts,
	requirement,
	icon,
	keywords,
	actionIds,
	relatedIds,
	requiresDatabase: DATABASE_CAPABILITY_IDS.has(id),
	featured,
});

export const GUIDE_CAPABILITY_DEFINITIONS: GuideCapabilityDefinition[] = [
	capability(
		"open-reader",
		"read",
		["workspace", "reader"],
		"none",
		"book-open",
		["leitor", "reader", "aba", "tab", "split", "barra lateral", "sidebar"],
		["open-reader", "reader-new-tab", "reader-split", "reader-left", "reader-right"],
		["reading-navigation", "reader-layout", "reading-history"],
		true,
	),
	capability(
		"reading-navigation",
		"read",
		["reader"],
		"none",
		"list-ordered",
		["navegar", "navigate", "livro", "book", "capítulo", "chapter", "versão", "version"],
		["open-reader", "open-book", "open-chapter", "open-version"],
		["open-reader", "open-passage", "reader-selection"],
	),
	capability(
		"reading-history",
		"read",
		["reader", "automatic"],
		"none",
		"history",
		["histórico", "history", "recent", "recentes", "retomar", "resume"],
		["open-history"],
		["remember-context", "open-reader"],
	),
	capability(
		"reader-layout",
		"read",
		["reader", "settings"],
		"none",
		"panel-top",
		["layout", "aparência", "appearance", "colunas", "columns", "largura", "spacing"],
		["open-appearance", "toggle-two-columns", "configure-reader"],
		["inline-cross-references", "reader-selection"],
	),
	capability(
		"reader-selection",
		"read",
		["reader", "selection"],
		"selection",
		"text-select",
		["selecionar", "select", "versículo", "verse", "intervalo", "range", "palavra", "word"],
		["toggle-selection", "open-reader"],
		["selection-actions", "highlights", "create-note"],
	),
	capability(
		"selection-actions",
		"create",
		["selection", "reader"],
		"selection",
		"mouse-pointer-2",
		["ações", "actions", "copiar", "copy", "nota", "note", "recurso", "resource", "comparar"],
		["open-reader"],
		["reader-selection", "create-note", "resource-links", "compare-versions"],
		true,
	),
	capability(
		"open-passage",
		"find",
		["workspace", "reader"],
		"none",
		"search",
		["passagem", "passage", "referência", "reference", "buscar", "search", "abrir"],
		["open-passage"],
		["reading-navigation", "compare-versions", "insert-scripture"],
		true,
	),
	capability(
		"compare-versions",
		"find",
		["workspace", "reader", "selection"],
		"none",
		"columns-2",
		["comparar", "compare", "versões", "versions", "traduções", "translations", "side by side"],
		["open-compare", "compare-tab", "compare-split"],
		["comparison-organization", "export-canvas", "export-excalidraw"],
		true,
	),
	capability(
		"comparison-organization",
		"find",
		["workspace"],
		"none",
		"list-columns",
		["layout", "colunas", "columns", "versículo", "verse", "ordenar", "order", "copiar"],
		["open-compare", "compare-tab"],
		["compare-versions", "export-canvas"],
	),
	capability(
		"export-canvas",
		"find",
		["workspace"],
		"none",
		"workflow",
		["canvas", "exportar", "export", "fluxo", "flow"],
		["open-compare", "compare-tab"],
		["compare-versions", "comparison-organization"],
	),
	capability(
		"export-excalidraw",
		"find",
		["workspace"],
		"none",
		"pen-tool",
		["excalidraw", "desenho", "drawing", "exportar", "export"],
		["open-compare", "compare-tab"],
		["compare-versions", "export-canvas"],
	),
	capability(
		"inline-cross-references",
		"study",
		["reader", "settings"],
		"none",
		"git-fork",
		["thompson", "referências cruzadas", "cross references", "margem", "margin", "centro"],
		["toggle-thompson", "configure-reader"],
		["cross-reference-panel", "cross-reference-preview"],
	),
	capability(
		"cross-reference-panel",
		"study",
		["reader", "settings"],
		"none",
		"panel-bottom",
		["referências", "references", "rodapé", "footer", "buscar", "search", "expandir"],
		["toggle-crossrefs-panel", "configure-reader"],
		["inline-cross-references", "cross-reference-preview"],
	),
	capability(
		"cross-reference-preview",
		"study",
		["reader"],
		"none",
		"scan-search",
		["preview", "prévia", "cadeia", "chain", "referência", "destination"],
		["open-reader"],
		["inline-cross-references", "cross-reference-panel"],
	),
	capability(
		"highlights",
		"create",
		["selection", "reader", "settings"],
		"selection",
		"highlighter",
		["destaque", "highlight", "cor", "color", "categoria", "remover", "remove"],
		["open-highlights", "configure-notes"],
		["reader-selection", "highlight-library"],
	),
	capability(
		"highlight-library",
		"create",
		["workspace", "reader"],
		"none",
		"library",
		["biblioteca", "library", "painel", "panel", "buscar", "filtrar", "excluir"],
		["open-highlights", "highlights-right", "highlights-left"],
		["highlights", "create-note"],
	),
	capability(
		"create-note",
		"create",
		["workspace", "selection", "editor"],
		"none",
		"file-plus",
		["criar nota", "create note", "nota bíblica", "bible note", "markdown", "salvar"],
		["create-note"],
		["selection-actions", "note-preview", "notes-highlights-settings"],
		true,
	),
	capability(
		"note-preview",
		"create",
		["reader", "selection"],
		"none",
		"notebook-tabs",
		["nota", "note", "prévia", "preview", "abrir editor", "open editor", "gutter"],
		["open-reader"],
		["create-note", "highlights", "remember-context"],
	),
	capability(
		"resource-links",
		"create",
		["selection", "reader"],
		"selection",
		"link-2",
		["vincular", "link", "recurso", "resource", "pessoa", "place", "estudo", "study"],
		["open-reader", "configure-resources"],
		["resource-preview", "resource-hub", "resource-settings"],
		true,
	),
	capability(
		"resource-library",
		"create",
		["workspace", "reader"],
		"none",
		"files",
		["recursos", "resources", "lista", "list", "vínculos", "links", "filtrar"],
		["resources-right", "resources-left"],
		["resource-hub", "resource-detail", "resource-links"],
	),
	capability(
		"resource-hub",
		"create",
		["workspace", "reader"],
		"none",
		"layout-grid",
		["central", "hub", "catálogo", "catalog", "buscar", "ordenar", "agrupar"],
		["open-resource-hub", "resource-hub-right", "resource-hub-new-tab"],
		["resource-library", "resource-detail", "resource-settings"],
	),
	capability(
		"resource-detail",
		"create",
		["workspace", "reader"],
		"none",
		"file-search",
		["detalhe", "detail", "ocorrências", "occurrences", "markdown", "passagem vinculada"],
		["open-resource-detail", "resource-detail-right", "open-resource-hub"],
		["resource-hub", "resource-preview", "resource-links"],
	),
	capability(
		"resource-preview",
		"study",
		["reader", "selection"],
		"selection",
		"scan-eye",
		["preview recurso", "resource preview", "hover", "ícone", "sublinhado", "underline"],
		["open-reader", "configure-resources"],
		["resource-links", "resource-detail"],
	),
	capability(
		"markdown-reference-detection",
		"integrate",
		["editor", "automatic"],
		"none",
		"braces",
		["markdown", "referência", "reference", "detectar", "detect", "sublinhado", "editor"],
		["configure-study"],
		["markdown-preview", "markdown-context-actions"],
	),
	capability(
		"markdown-preview",
		"integrate",
		["editor"],
		"editor",
		"scan-text",
		["preview", "prévia", "hover", "clique", "click", "tooltip", "versículo"],
		["configure-study"],
		["markdown-reference-detection", "cross-reference-preview"],
	),
	capability(
		"insert-scripture",
		"integrate",
		["editor", "workspace"],
		"editor",
		"text-cursor-input",
		["inserir", "insert", "citação", "quote", "versículo", "cursor", "markdown"],
		["insert-scripture", "configure-study"],
		["open-passage", "markdown-context-actions"],
	),
	capability(
		"markdown-context-actions",
		"integrate",
		["editor", "selection"],
		"editor",
		"mouse-pointer-click",
		["menu contexto", "context menu", "acima", "above", "abaixo", "below", "copiar", "create"],
		["insert-scripture", "create-note", "open-compare", "open-reader"],
		["markdown-reference-detection", "insert-scripture", "create-note"],
	),
	capability(
		"bible-versions",
		"configure",
		["settings", "automatic"],
		"none",
		"database",
		["versões", "versions", "sqlite", "importar", "import", "metadados", "padrão"],
		["configure-general", "configure-data"],
		["data-folder", "reader-layout", "language"],
	),
	capability(
		"data-folder",
		"configure",
		["settings"],
		"none",
		"folder-cog",
		["pasta", "folder", "dados", "data", "sqlite", "local"],
		["configure-data"],
		["bible-versions", "local-first"],
	),
	capability(
		"notes-highlights-settings",
		"configure",
		["settings"],
		"none",
		"settings-2",
		["notas", "notes", "destaques", "highlights", "categorias", "cores", "confirmação"],
		["configure-notes"],
		["create-note", "highlights", "highlight-library"],
	),
	capability(
		"resource-settings",
		"configure",
		["settings"],
		"none",
		"sliders-horizontal",
		["recursos", "resources", "tipos", "types", "ícones", "cores", "workspace", "modal"],
		["configure-resources"],
		["resource-links", "resource-hub", "resource-preview"],
	),
	capability(
		"language",
		"configure",
		["settings", "automatic"],
		"none",
		"languages",
		["idioma", "language", "português", "english", "obsidian", "automático"],
		["configure-language"],
		["local-first", "about-support"],
	),
	capability(
		"local-first",
		"configure",
		["automatic"],
		"none",
		"shield-check",
		["offline", "privacidade", "privacy", "local", "telemetria", "telemetry", "vault"],
		[],
		["data-folder", "remember-context", "about-support"],
	),
	capability(
		"remember-context",
		"configure",
		["automatic", "reader"],
		"none",
		"history",
		["lembrar", "remember", "última passagem", "last passage", "metadados", "sincronizar"],
		["open-reader", "open-history"],
		["reading-history", "bible-versions", "local-first"],
	),
	capability(
		"about-support",
		"configure",
		["settings"],
		"none",
		"circle-help",
		["sobre", "about", "ajuda", "help", "problema", "issue", "open mission", "créditos"],
		["configure-about"],
		["local-first", "language"],
	),
];

export const GUIDE_CAPABILITY_IDS = GUIDE_CAPABILITY_DEFINITIONS.map((item) => item.id);

function makeAction(
	plugin: OpenBiblePlugin,
	id: GuideActionId,
	icon: string,
	run: () => void | Promise<void>,
	tone: GuideActionTone = "secondary",
	disabled = false,
): GuideAction {
	return {
		id,
		label: t(`guide.actionLabels.${id}`),
		icon,
		tone,
		run,
		disabled,
		disabledReason: disabled ? t("guide.states.requiresEditor") : undefined,
	};
}

function createActions(plugin: OpenBiblePlugin, ids: GuideActionId[]): GuideAction[] {
	return ids.map((id, index) => {
		const tone: GuideActionTone = index === 0 ? "primary" : "secondary";
		const editorDisabled = plugin.app.workspace.activeEditor === null;

		switch (id) {
			case "open-reader":
				return makeAction(plugin, id, "book-open", () => plugin.openReader(), tone);
			case "reader-new-tab":
				return makeAction(plugin, id, "file-plus", () => plugin.openReader("new-tab"));
			case "reader-split":
				return makeAction(plugin, id, "split", () => plugin.openReader("split"));
			case "reader-left":
				return makeAction(plugin, id, "panel-left", () => plugin.openReader("left"));
			case "reader-right":
				return makeAction(plugin, id, "panel-right", () => plugin.openReader("right"));
			case "open-book":
				return makeAction(plugin, id, "book", () => plugin.openReaderSurface("book"));
			case "open-chapter":
				return makeAction(plugin, id, "list", () => plugin.openReaderSurface("chapter"));
			case "open-version":
				return makeAction(plugin, id, "book-copy", () => plugin.openReaderSurface("version"));
			case "open-history":
				return makeAction(plugin, id, "history", () => plugin.openReaderSurface("history"));
			case "open-appearance":
				return makeAction(plugin, id, "sliders-horizontal", () => plugin.openReaderSurface("appearance"));
			case "toggle-two-columns":
				return makeAction(plugin, id, "columns-2", () => plugin.toggleReaderTwoColumns());
			case "toggle-selection":
				return makeAction(plugin, id, "check-square", () => plugin.toggleReaderSelectionMode());
			case "open-passage":
				return makeAction(plugin, id, "search", () => plugin.openBiblePassage());
			case "insert-scripture":
				return makeAction(plugin, id, "text-cursor-input", () => plugin.insertBibleText(), tone, editorDisabled);
			case "create-note":
				return makeAction(plugin, id, "file-plus", () => plugin.createBibleNote());
			case "open-compare":
				return makeAction(plugin, id, "columns-2", () => plugin.openCompareModal());
			case "compare-tab":
				return makeAction(plugin, id, "file-plus", async () => {
					await plugin.openCompareView("tab");
				});
			case "compare-split":
				return makeAction(plugin, id, "split", async () => {
					await plugin.openCompareView("split");
				});
			case "open-highlights":
				return makeAction(plugin, id, "highlighter", () => plugin.openHighlightsDrawer());
			case "highlights-right":
				return makeAction(plugin, id, "panel-right", () => plugin.openHighlightsView("right"));
			case "highlights-left":
				return makeAction(plugin, id, "panel-left", () => plugin.openHighlightsView("left"));
			case "resources-right":
				return makeAction(plugin, id, "panel-right", () => plugin.openResourcesView("right"));
			case "resources-left":
				return makeAction(plugin, id, "panel-left", () => plugin.openResourcesView("left"));
			case "open-resource-hub":
				return makeAction(plugin, id, "layout-grid", () => plugin.openResourceHub());
			case "resource-hub-right":
				return makeAction(plugin, id, "panel-right", async () => {
					await plugin.openResourceHubView("right");
				});
			case "resource-hub-new-tab":
				return makeAction(plugin, id, "file-plus", async () => {
					await plugin.openResourceHubView("new-tab");
				});
			case "open-resource-detail":
				return makeAction(plugin, id, "file-search", async () => {
					await plugin.openResourceDetailView();
				});
			case "resource-detail-right":
				return makeAction(plugin, id, "panel-right", async () => {
					await plugin.openResourceDetailView(undefined, "right");
				});
			case "toggle-thompson":
				return makeAction(plugin, id, "git-fork", () => plugin.toggleReaderThompson());
			case "toggle-crossrefs-panel":
				return makeAction(plugin, id, "panel-bottom", () => plugin.toggleReaderCrossReferencePanel());
			case "configure-general":
				return makeAction(plugin, id, "settings", () => plugin.openPluginSettings("general"));
			case "configure-data":
				return makeAction(plugin, id, "database", () => plugin.openPluginSettings("data"));
			case "configure-reader":
				return makeAction(plugin, id, "book-open", () => plugin.openPluginSettings("reader"));
			case "configure-study":
				return makeAction(plugin, id, "scan-text", () => plugin.openPluginSettings("study"));
			case "configure-notes":
				return makeAction(plugin, id, "highlighter", () => plugin.openPluginSettings("notes-highlights"));
			case "configure-resources":
				return makeAction(plugin, id, "link-2", () => plugin.openPluginSettings("study-resources"));
			case "configure-language":
				return makeAction(plugin, id, "languages", () => plugin.openPluginSettings("language"));
			case "configure-about":
				return makeAction(plugin, id, "info", () => plugin.openPluginSettings("about"));
		}
	});
}

function availabilityFor(
	definition: GuideCapabilityDefinition,
	plugin: OpenBiblePlugin,
	hasVersions: boolean,
): GuideAvailability {
	if (definition.requiresDatabase && !hasVersions) {
		return { state: "setup", label: t("guide.states.requiresDatabase") };
	}
	if (definition.requirement === "editor" && !plugin.app.workspace.activeEditor) {
		return { state: "context", label: t("guide.states.requiresEditor") };
	}
	if (definition.requirement === "selection") {
		return { state: "context", label: t("guide.states.requiresSelection") };
	}
	if (definition.actionIds.length === 0) {
		return { state: "automatic", label: t("guide.states.automatic") };
	}
	return { state: "ready", label: t("guide.states.ready") };
}

export function resolveGuideCapabilities(
	plugin: OpenBiblePlugin,
	hasVersions: boolean,
): GuideCapability[] {
	return GUIDE_CAPABILITY_DEFINITIONS.map((definition) => {
		const actionIds = definition.requiresDatabase && !hasVersions
			? (["configure-data"] as GuideActionId[])
			: definition.actionIds;
		return {
			...definition,
			title: t(`guide.capabilities.${definition.id}.title`),
			summary: t(`guide.capabilities.${definition.id}.summary`),
			detail: t(`guide.capabilities.${definition.id}.detail`),
			categoryLabel: t(`guide.categories.${definition.category}`),
			contextLabels: definition.contexts.map((context) => t(`guide.contexts.${context}`)),
			availability: availabilityFor(definition, plugin, hasVersions),
			actions: createActions(plugin, actionIds),
		};
	});
}

function normalize(value: string): string {
	return value
		.toLocaleLowerCase()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[^a-z0-9\s]/g, " ")
		.replace(/\s+/g, " ")
		.trim();
}

export function searchGuideCapabilities(
	capabilities: GuideCapability[],
	query: string,
	context: GuideContextFilter,
): GuideCapability[] {
	const normalizedQuery = normalize(query);
	return capabilities
		.filter((capability) => context === "all" || capability.contexts.includes(context))
		.map((capability, index) => {
			if (!normalizedQuery) return { capability, index, score: 0 };
			const title = normalize(capability.title);
			const summary = normalize(capability.summary);
			const detail = normalize(capability.detail);
			const keywords = normalize(capability.keywords.join(" "));
			let score = 0;
			if (title === normalizedQuery) score += 120;
			if (title.startsWith(normalizedQuery)) score += 90;
			if (title.includes(normalizedQuery)) score += 70;
			if (keywords.includes(normalizedQuery)) score += 55;
			if (summary.includes(normalizedQuery)) score += 35;
			if (detail.includes(normalizedQuery)) score += 15;
			return { capability, index, score };
		})
		.filter((result) => !normalizedQuery || result.score > 0)
		.sort((a, b) => b.score - a.score || a.index - b.index)
		.map((result) => result.capability);
}

export function groupGuideCapabilities(capabilities: GuideCapability[]): Array<{
	id: GuideCategoryId;
	label: string;
	items: GuideCapability[];
}> {
	return GUIDE_CATEGORY_IDS.map((id) => ({
		id,
		label: t(`guide.categories.${id}`),
		items: capabilities.filter((capability) => capability.category === id),
	})).filter((group) => group.items.length > 0);
}
