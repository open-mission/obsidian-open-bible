import { Notice, type App } from "obsidian";
import type OpenBiblePlugin from "../../main";
import type { CrossReference } from "../../data/crossRefModel";
import { getLocale, t } from "../../i18n";
import { VersePreviewModal, type VersePreviewModalOptions } from "../modals/VersePreviewModal";
import { crossRefToParsedVerseReference } from "./crossRefPreviewParse";

export type { VersePreviewModalOptions };

export async function openCrossRefPreview(
	app: App,
	plugin: OpenBiblePlugin,
	ref: CrossReference,
	options?: VersePreviewModalOptions,
): Promise<void> {
	const locale = getLocale();
	const parsed = crossRefToParsedVerseReference(ref, locale);
	if (!parsed) {
		new Notice(t("resources.verseMissing") || "Versículo não encontrado.");
		return;
	}
	const preview = await plugin.versePreviewService.getVersePreview(parsed);
	if (!preview && !options?.chainRefs?.length) {
		new Notice(t("resources.verseMissing") || "Versículo não encontrado.");
		return;
	}
	new VersePreviewModal(app, plugin, preview, options).open();
}
