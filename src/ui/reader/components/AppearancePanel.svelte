<script lang="ts">
	import { t } from "../../../i18n";
	import type { ReaderContainerWidth, ReaderSpacing } from "../../../settings";
	import PickerHeader from "../../kit/PickerHeader.svelte";
	import { icon } from "../../actions/icon";

	interface Props {
		twoColumns: boolean;
		containerWidth: ReaderContainerWidth;
		verseSpacing: ReaderSpacing;
		lineSpacing: ReaderSpacing;
		onToggleTwoColumns: () => void;
		onChange: (patch: {
			readerContainerWidth?: ReaderContainerWidth;
			readerVerseSpacing?: ReaderSpacing;
			readerLineSpacing?: ReaderSpacing;
		}) => void;
		onClose: () => void;
	}

	let {
		twoColumns,
		containerWidth,
		verseSpacing,
		lineSpacing,
		onToggleTwoColumns,
		onChange,
		onClose,
	}: Props = $props();

	const widths: ReaderContainerWidth[] = ["default", "large", "wide"];
	const spacings: ReaderSpacing[] = ["compact", "normal", "spacious"];

	function widthLabel(value: ReaderContainerWidth): string {
		if (value === "large") return t("readerMenu.containerWidthLarge");
		if (value === "wide") return t("readerMenu.containerWidthWide");
		return t("readerMenu.containerWidthDefault");
	}

	function spacingLabel(value: ReaderSpacing): string {
		if (value === "compact") return t("readerMenu.spacingCompact");
		if (value === "spacious") return t("readerMenu.spacingSpacious");
		return t("readerMenu.spacingNormal");
	}
</script>

<PickerHeader
	title={t("settings.pageReaderAppearance") || "Leitor e aparência"}
	closeLabel={t("bookPicker.close")}
	{onClose}
/>

<div class="open-bible-appearance-body">
	<button type="button" class="open-bible-appearance-toggle-row" onclick={onToggleTwoColumns}>
		<span class="open-bible-appearance-row-icon" use:icon={twoColumns ? "columns-2" : "columns-1"}></span>
		<span class="open-bible-appearance-row-label">{t("readerMenu.twoColumnsToggle")}</span>
		<span class="open-bible-switch" class:is-on={twoColumns} aria-hidden="true"></span>
	</button>

	<h4 class="open-bible-appearance-section-title">{t("readerMenu.containerWidthHeader")}</h4>
	<div class="open-bible-segmented" role="group">
		{#each widths as width (width)}
			<button
				type="button"
				class="open-bible-segmented-btn"
				class:is-active={containerWidth === width}
				onclick={() => onChange({ readerContainerWidth: width })}
			>
				{widthLabel(width)}
			</button>
		{/each}
	</div>

	<h4 class="open-bible-appearance-section-title">{t("readerMenu.verseSpacingHeader")}</h4>
	<div class="open-bible-segmented" role="group">
		{#each spacings as spacing (spacing)}
			<button
				type="button"
				class="open-bible-segmented-btn"
				class:is-active={verseSpacing === spacing}
				onclick={() => onChange({ readerVerseSpacing: spacing })}
			>
				{spacingLabel(spacing)}
			</button>
		{/each}
	</div>

	<h4 class="open-bible-appearance-section-title">{t("readerMenu.lineSpacingHeader")}</h4>
	<div class="open-bible-segmented" role="group">
		{#each spacings as spacing (spacing)}
			<button
				type="button"
				class="open-bible-segmented-btn"
				class:is-active={lineSpacing === spacing}
				onclick={() => onChange({ readerLineSpacing: spacing })}
			>
				{spacingLabel(spacing)}
			</button>
		{/each}
	</div>
</div>
