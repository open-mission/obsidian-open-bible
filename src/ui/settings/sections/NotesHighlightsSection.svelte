<script lang="ts">
	import { Notice } from "obsidian";
	import { t } from "../../../i18n";
	import type { SectionContext } from "../types";
	import { DEFAULT_HIGHLIGHT_CONFIGS, DEFAULT_NOTE_CONFIGS, type HighlightConfig } from "../../../settings";
	import { icon } from "../../actions/icon";
	import { resolveHighlightCssColor } from "../../reader/highlightStyles";
	import Toggle from "../../kit/Toggle.svelte";

	let { settings, updateGeneral }: SectionContext = $props();

	let notesFolder = $state("");
	let highlightsFolder = $state("");
	let highlights = $state<HighlightConfig[]>([]);
	let notes = $state<HighlightConfig[]>([]);
	let confirmDelete = $state(false);

	$effect(() => {
		notesFolder = settings.notesFolder ?? "OpenBible/notes";
		highlightsFolder = settings.highlightsFolder ?? "OpenBible/highlights";
		highlights = settings.configuredHighlights && settings.configuredHighlights.length > 0
			? [...settings.configuredHighlights]
			: [...DEFAULT_HIGHLIGHT_CONFIGS];
		notes = settings.configuredNotes && settings.configuredNotes.length > 0
			? [...settings.configuredNotes]
			: [...DEFAULT_NOTE_CONFIGS];
		confirmDelete = Boolean(settings.confirmHighlightDeletion);
	});

	async function handleNotesFolderChange(e: Event) {
		const val = (e.target as HTMLInputElement).value.trim();
		notesFolder = val;
		await updateGeneral({ notesFolder: val || "OpenBible/notes" });
	}

	async function handleHighlightsFolderChange(e: Event) {
		const val = (e.target as HTMLInputElement).value.trim();
		highlightsFolder = val;
		await updateGeneral({ highlightsFolder: val || "OpenBible/highlights" });
	}

	async function handleConfirmDeleteChange(val: boolean) {
		confirmDelete = val;
		await updateGeneral({ confirmHighlightDeletion: val });
	}

	async function handleAddHighlight() {
		const newId = `hl_${Date.now().toString(36)}`;
		const newHl: HighlightConfig = {
			id: newId,
			label: t("settings.newHighlightDefaultLabel"),
			color: "#22c55e",
		};
		highlights = [...highlights, newHl];
		await updateGeneral({ configuredHighlights: highlights });
		new Notice(t("settings.highlightAddedNotice"));
	}

	async function handleUpdateLabel(id: string, label: string) {
		highlights = highlights.map((h) => (h.id === id ? { ...h, label } : h));
		await updateGeneral({ configuredHighlights: highlights });
	}

	async function handleUpdateColor(id: string, color: string) {
		highlights = highlights.map((h) => (h.id === id ? { ...h, color } : h));
		await updateGeneral({ configuredHighlights: highlights });
	}

	async function handleDeleteHighlight(id: string) {
		if (highlights.length <= 1) {
			new Notice(t("settings.cannotDeleteLastHighlight"));
			return;
		}
		highlights = highlights.filter((h) => h.id !== id);
		await updateGeneral({ configuredHighlights: highlights });
		new Notice(t("settings.highlightRemovedNotice"));
	}

	async function handleResetDefaults() {
		highlights = [...DEFAULT_HIGHLIGHT_CONFIGS];
		await updateGeneral({ configuredHighlights: highlights });
		new Notice(t("settings.highlightsResetNotice"));
	}

	async function handleAddNote() {
		const newId = `note_${Date.now().toString(36)}`;
		const newNote: HighlightConfig = {
			id: newId,
			label: t("settings.newNoteDefaultLabel"),
			color: "#3b82f6",
		};
		notes = [...notes, newNote];
		await updateGeneral({ configuredNotes: notes });
		new Notice(t("settings.noteAddedNotice"));
	}

	async function handleUpdateNoteLabel(id: string, label: string) {
		notes = notes.map((n) => (n.id === id ? { ...n, label } : n));
		await updateGeneral({ configuredNotes: notes });
	}

	async function handleUpdateNoteColor(id: string, color: string) {
		notes = notes.map((n) => (n.id === id ? { ...n, color } : n));
		await updateGeneral({ configuredNotes: notes });
	}

	async function handleDeleteNote(id: string) {
		if (notes.length <= 1) {
			new Notice(t("settings.cannotDeleteLastNote"));
			return;
		}
		notes = notes.filter((n) => n.id !== id);
		await updateGeneral({ configuredNotes: notes });
		new Notice(t("settings.noteRemovedNotice"));
	}

	async function handleResetNotesDefaults() {
		notes = [...DEFAULT_NOTE_CONFIGS];
		await updateGeneral({ configuredNotes: notes });
		new Notice(t("settings.notesResetNotice"));
	}
</script>

<div class="open-bible-settings-notes-section">
	<!-- Folders Configuration -->
	<div class="setting-item">
		<div class="setting-item-info">
			<div class="setting-item-name">{t("settings.notesFolderName")}</div>
			<div class="setting-item-description">{t("settings.notesFolderDesc")}</div>
		</div>
		<div class="setting-item-control">
			<input
				type="text"
				class="text-input"
				value={notesFolder}
				placeholder="OpenBible/notes"
				onchange={handleNotesFolderChange}
			/>
		</div>
	</div>

	<div class="setting-item">
		<div class="setting-item-info">
			<div class="setting-item-name">{t("settings.highlightsFolderName")}</div>
			<div class="setting-item-description">{t("settings.highlightsFolderDesc")}</div>
		</div>
		<div class="setting-item-control">
			<input
				type="text"
				class="text-input"
				value={highlightsFolder}
				placeholder="OpenBible/highlights"
				onchange={handleHighlightsFolderChange}
			/>
		</div>
	</div>

	<!-- Highlight Deletion Confirmation -->
	<div class="setting-item">
		<div class="setting-item-info">
			<div class="setting-item-name">{t("settings.confirmHighlightDeletionName")}</div>
			<div class="setting-item-description">{t("settings.confirmHighlightDeletionDesc")}</div>
		</div>
		<div class="setting-item-control">
			<Toggle checked={confirmDelete} onchange={handleConfirmDeleteChange} />
		</div>
	</div>

	<div class="setting-item-heading">
		<div class="setting-item-name">{t("settings.configuredHighlightsHeading")}</div>
		<div class="setting-item-description">{t("settings.configuredHighlightsDesc")}</div>
	</div>

	<!-- Highlights List / Customizer -->
	<div class="open-bible-settings-highlights-list">
		{#each highlights as hl (hl.id)}
			{@const cssColor = resolveHighlightCssColor(hl.color)}
			<div class="open-bible-settings-highlight-row">
				<div class="open-bible-settings-color-wrapper">
					<span class="open-bible-settings-color-preview" style:background-color={cssColor}></span>
					<input
						type="color"
						class="open-bible-settings-color-input"
						value={cssColor.startsWith("#") ? cssColor : "#eab308"}
						title={t("settings.chooseColor")}
						onchange={(e) => handleUpdateColor(hl.id, (e.target as HTMLInputElement).value)}
					/>
				</div>

				<input
					type="text"
					class="text-input open-bible-settings-label-input"
					value={hl.label}
					placeholder={t("settings.highlightLabelPlaceholder")}
					onchange={(e) => handleUpdateLabel(hl.id, (e.target as HTMLInputElement).value)}
				/>

				<button
					type="button"
					class="clickable-icon open-bible-settings-delete-btn"
					aria-label={t("common.delete")}
					title={t("common.delete")}
					onclick={() => handleDeleteHighlight(hl.id)}
				>
					<span use:icon={"trash-2"}></span>
				</button>
			</div>
		{/each}
	</div>

	<div class="open-bible-settings-actions-row">
		<button type="button" class="open-bible-ui-btn mod-cta is-small" onclick={handleAddHighlight}>
			<span use:icon={"plus"}></span>
			<span>{t("settings.addHighlightBtn")}</span>
		</button>
		<button type="button" class="open-bible-ui-btn is-ghost is-small" onclick={handleResetDefaults}>
			<span use:icon={"rotate-ccw"}></span>
			<span>{t("settings.resetHighlightsBtn")}</span>
		</button>
	</div>

	<!-- Note Categories / Customizer -->
	<div class="setting-item-heading" style="margin-top: 2rem;">
		<div class="setting-item-name">{t("settings.configuredNotesHeading")}</div>
		<div class="setting-item-description">{t("settings.configuredNotesDesc")}</div>
	</div>

	<div class="open-bible-settings-highlights-list">
		{#each notes as item (item.id)}
			{@const cssColor = resolveHighlightCssColor(item.color)}
			<div class="open-bible-settings-highlight-row">
				<div class="open-bible-settings-color-wrapper">
					<span class="open-bible-settings-color-preview" style:background-color={cssColor}></span>
					<input
						type="color"
						class="open-bible-settings-color-input"
						value={cssColor.startsWith("#") ? cssColor : "#3b82f6"}
						title={t("settings.chooseColor")}
						onchange={(e) => handleUpdateNoteColor(item.id, (e.target as HTMLInputElement).value)}
					/>
				</div>

				<input
					type="text"
					class="text-input open-bible-settings-label-input"
					value={item.label}
					placeholder={t("settings.noteLabelPlaceholder")}
					onchange={(e) => handleUpdateNoteLabel(item.id, (e.target as HTMLInputElement).value)}
				/>

				<button
					type="button"
					class="clickable-icon open-bible-settings-delete-btn"
					aria-label={t("common.delete")}
					title={t("common.delete")}
					onclick={() => handleDeleteNote(item.id)}
				>
					<span use:icon={"trash-2"}></span>
				</button>
			</div>
		{/each}
	</div>

	<div class="open-bible-settings-actions-row">
		<button type="button" class="open-bible-ui-btn mod-cta is-small" onclick={handleAddNote}>
			<span use:icon={"plus"}></span>
			<span>{t("settings.addNoteBtn")}</span>
		</button>
		<button type="button" class="open-bible-ui-btn is-ghost is-small" onclick={handleResetNotesDefaults}>
			<span use:icon={"rotate-ccw"}></span>
			<span>{t("settings.resetNotesBtn")}</span>
		</button>
	</div>
</div>
