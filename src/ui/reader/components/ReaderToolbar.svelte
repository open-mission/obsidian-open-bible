<script lang="ts">
	import { Platform } from "obsidian";
	import { t } from "../../../i18n";
	import type { BibleDatabaseInfo } from "../../../models/bible";
	import { icon } from "../../actions/icon";
	import IconButton from "../../kit/IconButton.svelte";

	type PickerMode = "book" | "chapter" | "version" | "history" | "appearance" | null;

	interface Props {
		currentInfo?: BibleDatabaseInfo;
		currentBookName: string;
		currentChapter?: number;
		activePicker: PickerMode;
		canNavigatePrevious: boolean;
		canNavigateNext: boolean;
		onNavigate: (direction: -1 | 1) => void;
		onTogglePicker: (picker: Exclude<PickerMode, null>) => void;
	}

	let {
		currentInfo,
		currentBookName,
		currentChapter,
		activePicker,
		canNavigatePrevious,
		canNavigateNext,
		onNavigate,
		onTogglePicker,
	}: Props = $props();

	let isMobile = Platform.isMobile;

	let defaultVersionLabel = $derived(t("toolbar.defaultVersion"));
	let versionFullName = $derived(
		currentInfo
			? currentInfo.name && currentInfo.name !== currentInfo.abbreviation
				? `${currentInfo.abbreviation} — ${currentInfo.name}`
				: (currentInfo.name || currentInfo.abbreviation || defaultVersionLabel)
			: defaultVersionLabel
	);
</script>

<div class="open-bible-reader-toolbar">
	<!-- 1. Previous Button (<) -->
	<IconButton
		iconName="chevron-left"
		class="open-bible-reader-nav open-bible-reader-prev-btn"
		title={t("toolbar.prevChapter")}
		ariaLabel={t("toolbar.prevChapter")}
		disabled={!canNavigatePrevious}
		onclick={() => onNavigate(-1)}
	/>

	<!-- 2. Book Pill Button -->
	<button
		type="button"
		class="open-bible-reader-pill-btn open-bible-reader-book-btn"
		class:is-active={activePicker === "book"}
		aria-label={t("toolbar.chooseBook")}
		title={t("toolbar.chooseBook")}
		onclick={(e) => {
			e.stopPropagation();
			onTogglePicker("book");
		}}
	>
		<span class="open-bible-reader-pill-text">{currentBookName || t("toolbar.selectBook")}</span>
		<span class="open-bible-reader-pill-chevron" use:icon={"chevron-down"}></span>
	</button>

	<!-- 3. Chapter Pill Button -->
	<button
		type="button"
		class="open-bible-reader-pill-btn open-bible-reader-chapter-btn"
		class:is-active={activePicker === "chapter"}
		aria-label={t("toolbar.chooseChapter")}
		title={t("toolbar.chooseChapter")}
		onclick={(e) => {
			e.stopPropagation();
			onTogglePicker("chapter");
		}}
	>
		<span class="open-bible-reader-pill-text">{currentChapter !== undefined ? String(currentChapter) : "–"}</span>
		<span class="open-bible-reader-pill-chevron" use:icon={"chevron-down"}></span>
	</button>

	<!-- 4. Version Pill Button -->
	<button
		type="button"
		class="open-bible-reader-pill-btn open-bible-reader-version-btn"
		class:is-active={activePicker === "version"}
		aria-label={t("toolbar.versionLabel", { version: versionFullName })}
		title={versionFullName}
		onclick={(e) => {
			e.stopPropagation();
			onTogglePicker("version");
		}}
	>
		<span class="open-bible-reader-pill-text">{currentInfo?.abbreviation || defaultVersionLabel}</span>
		<span class="open-bible-reader-pill-chevron" use:icon={"chevron-down"}></span>
	</button>

	<!-- 5. Appearance Controls (hidden on mobile; accessed via page header '...' menu) -->
	{#if !isMobile}
		<IconButton
			iconName="sliders-horizontal"
			class="open-bible-reader-nav open-bible-reader-toolbar-appearance"
			active={activePicker === "appearance"}
			title={t("readerMenu.appearance") || "Aparência"}
			ariaLabel={t("readerMenu.appearance") || "Aparência"}
			onclick={() => onTogglePicker("appearance")}
		/>
	{/if}

	<!-- 6. History -->
	<IconButton
		iconName="history"
		class="open-bible-reader-nav open-bible-reader-toolbar-history"
		active={activePicker === "history"}
		title={t("readerMenu.readingHistory") || "Histórico"}
		ariaLabel={t("readerMenu.readingHistory") || "Histórico"}
		onclick={() => onTogglePicker("history")}
	/>

	<!-- 7. Next Button (>) -->
	<IconButton
		iconName="chevron-right"
		class="open-bible-reader-nav open-bible-reader-next-btn"
		title={t("toolbar.nextChapter")}
		ariaLabel={t("toolbar.nextChapter")}
		disabled={!canNavigateNext}
		onclick={() => onNavigate(1)}
	/>
</div>