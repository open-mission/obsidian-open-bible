import { App, MarkdownView, Menu, Modal, Notice, setIcon } from "obsidian";
import type OpenBiblePlugin from "../../main";
import { BIBLE_CANON, getCanonBook } from "../../bibleCanon";
import type { BibleBook } from "../../models/bible";
import type { CrossReference } from "../../data/crossRefModel";
import { getLocale, t } from "../../i18n";
import type { ResolvedVersePreview } from "../../services/VersePreviewService";
import { formatCrossRef } from "../resources/formatCrossRef";
import { crossRefToParsedVerseReference } from "../resources/crossRefPreviewParse";
import { formatVersesText } from "../../services/verseFormat";
import { insertScriptureInEditor } from "../../services/editorInsertion";
import { createNoteFromSelection } from "../../services/NoteService";
import { createUiButton, createUiDialogBody, createUiFooter, setupOpenBibleDialog } from "../kit/dom";

export interface VersePreviewModalOptions {
	originLabel?: string;
	chainRefs?: CrossReference[];
	chainIndex?: number;
}

export class VersePreviewModal extends Modal {
	private currentPreview: ResolvedVersePreview | null;
	private currentRef: CrossReference | null = null;
	private currentIndex = 0;
	private readonly chainRefs: CrossReference[];
	private readonly originLabel?: string;
	private headerTitleEl!: HTMLElement;
	private versionSubEl!: HTMLElement | null;
	private subtitleEl!: HTMLElement | null;
	private navEl!: HTMLElement | null;
	private prevBtn!: HTMLButtonElement | null;
	private nextBtn!: HTMLButtonElement | null;
	private versesContainer!: HTMLElement;
	private openReaderBtn!: HTMLButtonElement;
	private copyBtn!: HTMLButtonElement;
	private loading = false;

	constructor(
		app: App,
		private plugin: OpenBiblePlugin,
		preview: ResolvedVersePreview | null,
		options?: VersePreviewModalOptions,
	) {
		super(app);
		this.currentPreview = preview;
		this.chainRefs = options?.chainRefs ?? [];
		this.originLabel = options?.originLabel;
		this.currentIndex = options?.chainIndex ?? 0;
		if (this.chainRefs.length > 0) {
			this.currentRef = this.chainRefs[this.currentIndex] ?? null;
		}
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.empty();
		setupOpenBibleDialog(this, { drawerOnMobile: true });
		contentEl.addClass("open-bible-verse-preview-modal");

		const headerEl = contentEl.createDiv("open-bible-preview-modal-header");
		const headerTopRow = headerEl.createDiv("open-bible-preview-modal-header-top");
		this.headerTitleEl = headerTopRow.createEl("h3", {
			cls: "open-bible-preview-modal-title",
		});

		const actionsBtn = headerTopRow.createEl("button", {
			cls: "open-bible-preview-modal-more-btn clickable-icon",
			attr: {
				type: "button",
				"aria-label": t("contextMenu.moreOptions") || "Mais opções",
			},
		});
		setIcon(actionsBtn, "more-vertical");
		actionsBtn.addEventListener("click", (e) => {
			this.openActionsMenu(e);
		});

		this.versionSubEl = headerEl.createEl("span", {
			cls: "open-bible-preview-modal-version-sub",
		});
		this.subtitleEl = this.originLabel
			? headerEl.createEl("p", { cls: "open-bible-preview-modal-context" })
			: null;

		if (this.chainRefs.length > 1) {
			this.navEl = headerEl.createDiv("open-bible-preview-modal-chain-nav");
			this.prevBtn = this.navEl.createEl("button", {
				cls: "open-bible-preview-modal-chain-btn",
				attr: { type: "button" },
			});
			setIcon(this.prevBtn.createSpan({ cls: "open-bible-preview-modal-chain-btn-icon" }), "chevron-left");
			this.prevBtn.createSpan({ text: t("resources.previous") || "Anterior" });
			this.prevBtn.addEventListener("click", () => {
				void this.navigateToIndex(this.currentIndex - 1);
			});

			this.nextBtn = this.navEl.createEl("button", {
				cls: "open-bible-preview-modal-chain-btn",
				attr: { type: "button" },
			});
			this.nextBtn.createSpan({ text: t("resources.next") || "Próximo" });
			setIcon(this.nextBtn.createSpan({ cls: "open-bible-preview-modal-chain-btn-icon" }), "chevron-right");
			this.nextBtn.addEventListener("click", () => {
				void this.navigateToIndex(this.currentIndex + 1);
			});
		} else {
			this.navEl = null;
			this.prevBtn = null;
			this.nextBtn = null;
		}

		this.versesContainer = createUiDialogBody(contentEl);
		this.versesContainer.addClass("open-bible-preview-modal-verses");

		const footer = createUiFooter(contentEl);
		this.openReaderBtn = createUiButton(footer, {
			text: t("commands.openReader") || "Abrir no leitor",
			variant: "cta",
			onClick: async () => {
				this.close();
				await this.navigateToCurrentDestination();
			},
		});
		this.copyBtn = createUiButton(footer, {
			text: t("popover.copyText") || "Copiar",
			onClick: async () => {
				if (!this.currentPreview?.verses.length) {
					return;
				}
				const textToCopy = this.currentPreview.verses
					.map((v) => `${v.number}. ${v.text}`)
					.join("\n");
				const formatted = `"${textToCopy}" — ${this.currentPreview.reference} (${this.currentPreview.versionAbbr})`;
				await navigator.clipboard.writeText(formatted);
				new Notice(t("notices.textCopied") || "Texto copiado.");
			},
		});
		createUiButton(footer, {
			text: t("bookPicker.close") || "Fechar",
			variant: "ghost",
			onClick: () => this.close(),
		});

		this.renderHeader();
		this.renderBody();
		this.updateNavButtons();
		this.updateActionButtons();
	}

	onClose(): void {
		this.contentEl.empty();
	}

	private renderHeader(): void {
		const preview = this.currentPreview;
		const ref = this.currentRef;
		const locale = getLocale();

		if (preview) {
			this.headerTitleEl.setText(`${preview.reference} (${preview.versionAbbr})`);
			if (
				this.versionSubEl &&
				preview.versionName &&
				preview.versionName !== preview.versionAbbr
			) {
				this.versionSubEl.setText(preview.versionName);
				this.versionSubEl.show();
			} else if (this.versionSubEl) {
				this.versionSubEl.setText("");
				this.versionSubEl.hide();
			}
		} else if (ref) {
			this.headerTitleEl.setText(formatCrossRef(ref, "long", locale));
			if (this.versionSubEl) {
				this.versionSubEl.setText("");
				this.versionSubEl.hide();
			}
		} else {
			this.headerTitleEl.setText("");
			if (this.versionSubEl) {
				this.versionSubEl.setText("");
				this.versionSubEl.hide();
			}
		}

		if (this.subtitleEl && this.originLabel) {
			const destination = ref
				? formatCrossRef(ref, "long", locale)
				: preview?.reference ?? "";
			this.subtitleEl.setText(`${this.originLabel} → ${destination}`);
		}
	}

	private renderBody(): void {
		this.versesContainer.empty();

		if (this.loading) {
			this.versesContainer.createDiv({
				cls: "open-bible-preview-modal-loading",
				text: "…",
			});
			return;
		}

		const preview = this.currentPreview;
		if (!preview?.verses.length) {
			this.versesContainer.createDiv({
				cls: "open-bible-preview-modal-missing",
				text: t("resources.verseMissing") || "Versículo não encontrado.",
			});
			return;
		}

		for (const verse of preview.verses) {
			const verseRow = this.versesContainer.createDiv("open-bible-preview-modal-verse-row");
			verseRow.createSpan({
				text: String(verse.number),
				cls: "open-bible-preview-verse-number",
			});
			verseRow.createSpan({
				text: verse.text,
				cls: "open-bible-preview-verse-text",
			});
		}
	}

	private updateNavButtons(): void {
		if (!this.prevBtn || !this.nextBtn) {
			return;
		}
		this.prevBtn.disabled = this.currentIndex <= 0 || this.loading;
		this.nextBtn.disabled = this.currentIndex >= this.chainRefs.length - 1 || this.loading;
	}

	private updateActionButtons(): void {
		const hasVerses = Boolean(this.currentPreview?.verses.length);
		this.copyBtn.disabled = !hasVerses;
		this.openReaderBtn.disabled = !this.currentPreview && !this.currentRef;
	}

	private async navigateToIndex(index: number): Promise<void> {
		if (index < 0 || index >= this.chainRefs.length || this.loading) {
			return;
		}

		const ref = this.chainRefs[index];
		if (!ref) {
			return;
		}

		this.loading = true;
		this.currentIndex = index;
		this.currentRef = ref;
		this.renderHeader();
		this.renderBody();
		this.updateNavButtons();
		this.updateActionButtons();

		const locale = getLocale();
		const parsed = crossRefToParsedVerseReference(ref, locale);
		if (!parsed) {
			this.currentPreview = null;
			this.loading = false;
			this.renderHeader();
			this.renderBody();
			this.updateNavButtons();
			this.updateActionButtons();
			return;
		}

		const preview = await this.plugin.versePreviewService.getVersePreview(parsed);
		this.currentPreview = preview;
		this.loading = false;
		this.renderHeader();
		this.renderBody();
		this.updateNavButtons();
		this.updateActionButtons();
	}

	private async navigateToCurrentDestination(): Promise<void> {
		const preview = this.currentPreview;
		if (preview) {
			await this.plugin.navigateToPassage(
				preview.bookName,
				preview.chapter,
				preview.verseStart,
				preview.versionAbbr,
			);
			return;
		}

		const ref = this.currentRef;
		if (!ref) {
			return;
		}

		const book = BIBLE_CANON.find((entry) => entry.id === ref.toBook);
		if (!book) {
			return;
		}

		const locale = getLocale();
		const bookName = locale === "pt" ? book.namePt : book.nameEn;
		const dbInfo = await this.plugin.versePreviewService.resolveDatabase();
		await this.plugin.navigateToPassage(
			bookName,
			ref.toChapter,
			ref.toVerseStart,
			dbInfo?.abbreviation,
		);
	}

	private openActionsMenu(e: MouseEvent): void {
		if (!this.currentPreview?.verses.length) {
			return;
		}

		const menu = new Menu();
		const preview = this.currentPreview;
		const defaultPos = this.plugin.settings.verseInsertPosition ?? "below";

		menu.addItem((item) => {
			item.setTitle(t("contextMenu.insertBelow"))
				.setIcon("book-open")
				.onClick(() => {
					const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
					if (!activeView) {
						new Notice(t("notices.noActiveMarkdownNote"));
						return;
					}
					const text = formatVersesText(preview.verses, preview.bookName, preview.chapter, preview.versionAbbr);
					insertScriptureInEditor(activeView.editor, text, "below");
					new Notice(t("notices.verseInserted"));
					this.close();
				});
		});

		menu.addItem((item) => {
			item.setTitle(t("contextMenu.insertAbove"))
				.setIcon("list-plus")
				.onClick(() => {
					const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
					if (!activeView) {
						new Notice(t("notices.noActiveMarkdownNote"));
						return;
					}
					const text = formatVersesText(preview.verses, preview.bookName, preview.chapter, preview.versionAbbr);
					insertScriptureInEditor(activeView.editor, text, "above");
					new Notice(t("notices.verseInserted"));
					this.close();
				});
		});

		menu.addItem((item) => {
			item.setTitle(t("contextMenu.createNote"))
				.setIcon("file-plus")
				.onClick(async () => {
					const bookCanon = getCanonBook(preview.bookName);
					const book: BibleBook = {
						id: bookCanon?.id ?? 0,
						name: preview.bookName,
						chapters: [],
						testament: bookCanon?.testament ?? 1,
					};
					await createNoteFromSelection(this.app, this.plugin.settings, {
						book,
						chapter: preview.chapter,
						verses: preview.verses,
						versionAbbr: preview.versionAbbr,
					});
					new Notice(t("notices.noteCreated"));
					this.close();
				});
		});

		menu.addItem((item) => {
			item.setTitle(t("contextMenu.copyQuote"))
				.setIcon("copy")
				.onClick(async () => {
					const text = formatVersesText(preview.verses, preview.bookName, preview.chapter, preview.versionAbbr);
					await navigator.clipboard.writeText(text);
					new Notice(t("notices.textCopied"));
				});
		});

		menu.showAtMouseEvent(e);
	}
}
