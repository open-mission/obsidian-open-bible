import {
	Decoration,
	EditorView,
	ViewPlugin,
	ViewUpdate,
} from "@codemirror/view";
import type { DecorationSet } from "@codemirror/view";
import { RangeSetBuilder } from "@codemirror/state";
import { syntaxTree } from "@codemirror/language";
import type OpenBiblePlugin from "../main";
import {
	findAllReferencesInText,
	findReferenceAtPosition,
	type ParsedVerseReference,
} from "../services/VerseReferenceParser";
import {
	hideVerseTooltip,
	scheduleHideVerseTooltip,
	showVerseTooltipAtRect,
} from "../ui/components/VerseHoverTooltip";
import { VersePreviewModal } from "../ui/modals/VersePreviewModal";

const MARK_CLASS = "open-bible-verse-preview-link";
const HOVER_DELAY_MS = 350;

const EXCLUDED_SYNTAX_NODES = new Set([
	"CodeBlock",
	"FencedCode",
	"InlineCode",
	"Link",
	"LinkReference",
	"URL",
	"Image",
	"HTMLBlock",
	"HTMLTag",
	"comment",
	"Frontmatter",
	"frontmatter",
]);

function isInsideExcludedSyntax(view: EditorView, from: number): boolean {
	const tree = syntaxTree(view.state);
	if (tree.length === 0) return false;

	let node = tree.resolveInner(from, 1);
	while (node) {
		if (EXCLUDED_SYNTAX_NODES.has(node.name)) return true;
		const parent = node.parent;
		if (!parent) break;
		node = parent;
	}
	return false;
}

function buildDecorations(view: EditorView, plugin: OpenBiblePlugin): DecorationSet {
	if (plugin.settings.enableVersePreviews === false) {
		return Decoration.none;
	}

	const builder = new RangeSetBuilder<Decoration>();
	const { doc } = view.state;

	for (const { from, to } of view.visibleRanges) {
		const text = doc.sliceString(from, to);
		for (const ref of findAllReferencesInText(text)) {
			const start = from + ref.startIndex;
			const end = from + ref.endIndex;
			if (start >= end || isInsideExcludedSyntax(view, start)) continue;

			builder.add(
				start,
				end,
				Decoration.mark({
					class: MARK_CLASS,
					attributes: {
						"data-open-bible-verse-ref": "1",
						"data-open-bible-clickable": plugin.settings.enableVerseClickPreview !== false ? "true" : "false",
					},
				})
			);
		}
	}

	return builder.finish();
}

function findReferenceAtViewPos(
	view: EditorView,
	pos: number,
	inclusiveEnd = false
): { ref: ParsedVerseReference; from: number; to: number } | null {
	const line = view.state.doc.lineAt(pos);
	const posInLine = pos - line.from;
	const ref = findReferenceAtPosition(line.text, posInLine, inclusiveEnd);
	if (!ref) return null;

	const from = line.from + ref.startIndex;
	const to = line.from + ref.endIndex;
	if (isInsideExcludedSyntax(view, from)) return null;

	return { ref, from, to };
}

function referenceAnchor(view: EditorView, from: number, to: number) {
	const startCoords = view.coordsAtPos(from);
	const endCoords = view.coordsAtPos(to);
	if (!startCoords || !endCoords) return null;

	return {
		top: startCoords.top,
		bottom: endCoords.bottom,
		left: startCoords.left,
		width: Math.max(endCoords.right - startCoords.left, 1),
	};
}

import type { VerseHoverModifier } from "../settings";

function matchesModifier(event: MouseEvent | KeyboardEvent, modifier: VerseHoverModifier): boolean {
	if (modifier === "none") return true;
	if (modifier === "shift") return event.shiftKey;
	if (modifier === "ctrlCmd") return event.ctrlKey || event.metaKey;
	if (modifier === "alt") return event.altKey;
	return false;
}

function isModifierKey(event: KeyboardEvent, modifier: VerseHoverModifier): boolean {
	if (modifier === "none") return false;
	if (modifier === "shift") return event.key === "Shift";
	if (modifier === "ctrlCmd") return event.key === "Control" || event.key === "Meta";
	if (modifier === "alt") return event.key === "Alt";
	return false;
}

function getActiveModifier(plugin: OpenBiblePlugin): VerseHoverModifier {
	if (plugin.settings.verseHoverModifier) {
		return plugin.settings.verseHoverModifier;
	}
	if (plugin.settings.verseHoverRequireShift === false) {
		return "none";
	}
	return "shift";
}

function isPointInsideElement(el: HTMLElement, x: number, y: number): boolean {
	const rects = el.getClientRects();
	for (let i = 0; i < rects.length; i++) {
		const r = rects[i];
		if (x >= r.left - 1 && x <= r.right + 1 && y >= r.top - 1 && y <= r.bottom + 1) {
			return true;
		}
	}
	return false;
}

function createViewPlugin(plugin: OpenBiblePlugin) {
	return ViewPlugin.fromClass(
		class {
			decorations: DecorationSet;
			hoverTimeout: number | null = null;
			activeHoverKey: string | null = null;
			currentMousePos: number | null = null;
			lastEnabledSettingsKey: string;

			constructor(view: EditorView) {
				this.decorations = buildDecorations(view, plugin);
				this.lastEnabledSettingsKey = this.getSettingsKey();
			}

			getSettingsKey(): string {
				return `${plugin.settings.enableVersePreviews}:${plugin.settings.enableVerseClickPreview}`;
			}

			update(update: ViewUpdate) {
				const currentSettingsKey = this.getSettingsKey();
				if (update.docChanged || update.viewportChanged || this.lastEnabledSettingsKey !== currentSettingsKey) {
					this.lastEnabledSettingsKey = currentSettingsKey;
					this.decorations = buildDecorations(update.view, plugin);
					this.clearHoverState();
				}
			}

			destroy() {
				this.clearHoverState();
			}

			clearHoverState() {
				if (this.hoverTimeout != null) {
					window.clearTimeout(this.hoverTimeout);
					this.hoverTimeout = null;
				}
				this.activeHoverKey = null;
				scheduleHideVerseTooltip(0);
			}

			scheduleHover(
				view: EditorView,
				hit: { ref: ParsedVerseReference; from: number; to: number },
				delay = HOVER_DELAY_MS
			) {
				const hoverKey = `${hit.from}:${hit.to}`;
				if (hoverKey === this.activeHoverKey) return;

				if (this.hoverTimeout != null) {
					window.clearTimeout(this.hoverTimeout);
				}

				this.hoverTimeout = window.setTimeout(() => {
					this.hoverTimeout = null;
					this.activeHoverKey = hoverKey;
					void plugin.versePreviewService.getVersePreview(hit.ref).then((preview) => {
						if (!preview || this.activeHoverKey !== hoverKey) return;
						const anchor = referenceAnchor(view, hit.from, hit.to);
						if (anchor) {
							showVerseTooltipAtRect(anchor, preview);
						}
					});
				}, delay);
			}
		},
		{
			decorations: (value) => value.decorations,
			eventHandlers: {
				mousemove(event, view) {
					if (plugin.settings.enableVersePreviews === false) return false;

					const targetEl =
						event.target instanceof HTMLElement
							? event.target
							: (event.target as Node | null)?.parentElement;
					const markEl = targetEl?.closest<HTMLElement>(`.${MARK_CLASS}`);
					if (!markEl || !isPointInsideElement(markEl, event.clientX, event.clientY)) {
						if (this.hoverTimeout != null) {
							window.clearTimeout(this.hoverTimeout);
							this.hoverTimeout = null;
						}
						this.activeHoverKey = null;
						scheduleHideVerseTooltip();
						this.currentMousePos = null;
						return false;
					}

					// Check if hover previews are enabled
					if (plugin.settings.enableVerseHoverPreview === false) {
						this.clearHoverState();
						return false;
					}

					// Check configured modifier key requirement
					const modifier = getActiveModifier(plugin);
					if (modifier !== "none" && !matchesModifier(event, modifier)) {
						this.clearHoverState();
						return false;
					}

					let startPos: number;
					try {
						startPos = view.posAtDOM(markEl);
					} catch {
						this.clearHoverState();
						this.currentMousePos = null;
						return false;
					}

					this.currentMousePos = startPos;

					const hit = findReferenceAtViewPos(view, startPos);
					if (!hit) {
						this.clearHoverState();
						return false;
					}

					this.scheduleHover(view, hit);
					return false;
				},
				mouseleave() {
					this.currentMousePos = null;
					if (this.hoverTimeout != null) {
						window.clearTimeout(this.hoverTimeout);
						this.hoverTimeout = null;
					}
					this.activeHoverKey = null;
					scheduleHideVerseTooltip();
					return false;
				},
				keydown(event, view) {
					if (plugin.settings.enableVersePreviews === false) return false;
					if (plugin.settings.enableVerseHoverPreview === false) return false;

					const modifier = getActiveModifier(plugin);
					// If user presses the configured modifier while positioned over a reference, trigger hover preview immediately
					if (isModifierKey(event, modifier) && this.currentMousePos != null) {
						const hit = findReferenceAtViewPos(view, this.currentMousePos);
						if (hit) {
							this.scheduleHover(view, hit, 0);
						}
					}
					return false;
				},
				keyup(event, view) {
					if (plugin.settings.enableVersePreviews === false) return false;
					const modifier = getActiveModifier(plugin);
					if (isModifierKey(event, modifier)) {
						this.clearHoverState();
					}
					return false;
				},
				mousedown(event, view) {
					if (plugin.settings.enableVersePreviews === false) return false;
					if (plugin.settings.enableVerseClickPreview === false) return false;
					if (event.button !== 0) return false;

					const targetEl =
						event.target instanceof HTMLElement
							? event.target
							: (event.target as Node | null)?.parentElement;
					const markEl = targetEl?.closest<HTMLElement>(`.${MARK_CLASS}`);
					if (!markEl || !isPointInsideElement(markEl, event.clientX, event.clientY)) {
						return false;
					}

					let startPos: number;
					try {
						startPos = view.posAtDOM(markEl);
					} catch {
						return false;
					}

					const hit = findReferenceAtViewPos(view, startPos);
					if (!hit) return false;

					event.preventDefault();
					event.stopPropagation();
					this.clearHoverState();
					hideVerseTooltip();

					void plugin.versePreviewService.getVersePreview(hit.ref).then((preview) => {
						if (preview) {
							new VersePreviewModal(plugin.app, plugin, preview).open();
						}
					});

					return true;
				},
			},
		}
	);
}

export function createVerseReferenceEditorExtension(plugin: OpenBiblePlugin) {
	return createViewPlugin(plugin);
}
