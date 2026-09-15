import { Menu, Notice, MarkdownView, type MarkdownPostProcessorContext } from "obsidian";
import type OpenBiblePlugin from "../main";
import type { VerseHoverModifier } from "../settings";
import { findAllReferencesInText } from "./VerseReferenceParser";
import {
	showVerseTooltip,
	scheduleHideVerseTooltip,
	hideVerseTooltip,
} from "../ui/components/VerseHoverTooltip";
import { VersePreviewModal } from "../ui/modals/VersePreviewModal";
import { formatVersesText } from "./verseFormat";
import { insertScriptureInEditor } from "./editorInsertion";
import { createNoteFromSelection } from "./NoteService";
import { getCanonBook } from "../bibleCanon";
import type { BibleBook } from "../models/bible";
import { t } from "../i18n";

const IGNORED_TAGS = new Set([
	"CODE",
	"PRE",
	"A",
	"BUTTON",
	"SCRIPT",
	"STYLE",
	"SVG",
	"INPUT",
	"TEXTAREA",
]);

function matchesModifier(event: MouseEvent | KeyboardEvent, modifier: VerseHoverModifier): boolean {
	if (modifier === "none") return true;
	if (modifier === "shift") return event.shiftKey;
	if (modifier === "ctrlCmd") return event.ctrlKey || event.metaKey;
	if (modifier === "alt") return event.altKey;
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

export function processMarkdownVerseReferences(
	element: HTMLElement,
	_context: MarkdownPostProcessorContext,
	plugin: OpenBiblePlugin
): void {
	if (plugin.settings.enableVersePreviews === false) {
		return;
	}

	// Helper to find text nodes excluding code blocks and existing links
	const walker = document.createTreeWalker(
		element,
		NodeFilter.SHOW_TEXT,
		{
			acceptNode(node: Node): number {
				let parent = node.parentElement;
				while (parent && parent !== element) {
					if (
						IGNORED_TAGS.has(parent.tagName) ||
						parent.classList.contains("open-bible-verse-preview-link")
					) {
						return NodeFilter.FILTER_REJECT;
					}
					parent = parent.parentElement;
				}
				return NodeFilter.FILTER_ACCEPT;
			},
		}
	);

	const textNodes: Text[] = [];
	let currentNode = walker.nextNode();
	while (currentNode) {
		textNodes.push(currentNode as Text);
		currentNode = walker.nextNode();
	}

	for (const textNode of textNodes) {
		const text = textNode.nodeValue;
		if (!text) continue;

		const refs = findAllReferencesInText(text);
		if (refs.length === 0) continue;

		const fragment = document.createDocumentFragment();
		let lastIndex = 0;

		for (const ref of refs) {
			if (ref.startIndex > lastIndex) {
				fragment.appendChild(document.createTextNode(text.substring(lastIndex, ref.startIndex)));
			}

			const link = document.createElement("a");
			link.className = "open-bible-verse-preview-link";
			link.textContent = ref.raw;
			link.setAttribute("data-book-name", ref.bookName);
			link.setAttribute("data-book-id", String(ref.canonicalBookId));
			link.setAttribute("data-chapter", String(ref.chapter));
			link.setAttribute("data-verse-start", String(ref.verseStart));
			if (ref.verseEnd) link.setAttribute("data-verse-end", String(ref.verseEnd));
			if (ref.versionAbbr) link.setAttribute("data-version", ref.versionAbbr);
			if (ref.isChapterOnly) link.setAttribute("data-chapter-only", "true");
			if (plugin.settings.enableVerseClickPreview === false) {
				link.setAttribute("data-open-bible-clickable", "false");
			}

			// Hover preview logic
			link.addEventListener("mouseenter", async (e) => {
				if (plugin.settings.enableVersePreviews === false) return;
				if (plugin.settings.enableVerseHoverPreview === false) return;
				const modifier = getActiveModifier(plugin);
				if (modifier !== "none" && !matchesModifier(e, modifier)) return;

				const preview = await plugin.versePreviewService.getVersePreview(ref);
				if (preview) {
					showVerseTooltip(link, preview);
				}
			});

			link.addEventListener("mousemove", async (e) => {
				if (plugin.settings.enableVersePreviews === false) return;
				if (plugin.settings.enableVerseHoverPreview === false) return;

				const modifier = getActiveModifier(plugin);
				if (modifier !== "none") {
					if (!matchesModifier(e, modifier)) {
						scheduleHideVerseTooltip();
						return;
					}
					const preview = await plugin.versePreviewService.getVersePreview(ref);
					if (preview) {
						showVerseTooltip(link, preview);
					}
				}
			});

			link.addEventListener("mouseleave", () => {
				scheduleHideVerseTooltip();
			});

			// Click preview logic (modal dialog)
			link.addEventListener("click", async (e) => {
				if (plugin.settings.enableVersePreviews === false) return;
				if (plugin.settings.enableVerseClickPreview === false) return;

				e.preventDefault();
				e.stopPropagation();
				hideVerseTooltip();

				const preview = await plugin.versePreviewService.getVersePreview(ref);
				if (preview) {
					new VersePreviewModal(plugin.app, plugin, preview).open();
				}
			});

			// Context menu (right-click) logic
			link.addEventListener("contextmenu", (e) => {
				if (plugin.settings.enableVersePreviews === false) return;
				e.preventDefault();
				e.stopPropagation();
				hideVerseTooltip();

				const menu = new Menu();
				const defaultPos = plugin.settings.verseInsertPosition ?? "below";
				const defaultLabel = defaultPos === "below"
					? t("contextMenu.insertBelow")
					: t("contextMenu.insertAbove");

				menu.addItem((item) => {
					item.setTitle(defaultLabel)
						.setIcon("book-open")
						.onClick(async () => {
							const preview = await plugin.versePreviewService.getVersePreview(ref);
							if (!preview || preview.verses.length === 0) {
								new Notice(t("resources.verseMissing"));
								return;
							}
							const activeView = plugin.app.workspace.getActiveViewOfType(MarkdownView);
							if (!activeView) {
								new Notice(t("notices.noActiveMarkdownNote"));
								return;
							}
							const text = formatVersesText(preview.verses, preview.bookName, preview.chapter, preview.versionAbbr);
							insertScriptureInEditor(activeView.editor, text, defaultPos);
							new Notice(t("notices.verseInserted"));
						});
				});

				const altPos = defaultPos === "below" ? "above" : "below";
				const altLabel = altPos === "below"
					? t("contextMenu.insertBelow")
					: t("contextMenu.insertAbove");

				menu.addItem((item) => {
					item.setTitle(altLabel)
						.setIcon("list-plus")
						.onClick(async () => {
							const preview = await plugin.versePreviewService.getVersePreview(ref);
							if (!preview || preview.verses.length === 0) {
								new Notice(t("resources.verseMissing"));
								return;
							}
							const activeView = plugin.app.workspace.getActiveViewOfType(MarkdownView);
							if (!activeView) {
								new Notice(t("notices.noActiveMarkdownNote"));
								return;
							}
							const text = formatVersesText(preview.verses, preview.bookName, preview.chapter, preview.versionAbbr);
							insertScriptureInEditor(activeView.editor, text, altPos);
							new Notice(t("notices.verseInserted"));
						});
				});

				menu.addItem((item) => {
					item.setTitle(t("contextMenu.createNote"))
						.setIcon("file-plus")
						.onClick(async () => {
							const preview = await plugin.versePreviewService.getVersePreview(ref);
							if (!preview || preview.verses.length === 0) {
								new Notice(t("resources.verseMissing"));
								return;
							}
							const bookCanon = getCanonBook(preview.bookName);
							const book: BibleBook = {
								id: bookCanon?.id ?? 0,
								name: preview.bookName,
								chapters: [],
								testament: bookCanon?.testament ?? 1,
							};
							await createNoteFromSelection(plugin.app, plugin.settings, {
								book,
								chapter: preview.chapter,
								verses: preview.verses,
								versionAbbr: preview.versionAbbr,
							});
							new Notice(t("notices.noteCreated"));
						});
				});

				menu.addItem((item) => {
					item.setTitle(t("contextMenu.copyQuote"))
						.setIcon("copy")
						.onClick(async () => {
							const preview = await plugin.versePreviewService.getVersePreview(ref);
							if (!preview || preview.verses.length === 0) return;
							const text = formatVersesText(preview.verses, preview.bookName, preview.chapter, preview.versionAbbr);
							await navigator.clipboard.writeText(text);
							new Notice(t("notices.textCopied"));
						});
				});

				menu.addItem((item) => {
					item.setTitle(t("commands.openReader"))
						.setIcon("book-marked")
						.onClick(async () => {
							const preview = await plugin.versePreviewService.getVersePreview(ref);
							if (preview) {
								await plugin.navigateToPassage(preview.bookName, preview.chapter, preview.verseStart, preview.versionAbbr);
							}
						});
				});

				menu.showAtMouseEvent(e);
			});

			fragment.appendChild(link);
			lastIndex = ref.endIndex;
		}

		if (lastIndex < text.length) {
			fragment.appendChild(document.createTextNode(text.substring(lastIndex)));
		}

		textNode.replaceWith(fragment);
	}
}
