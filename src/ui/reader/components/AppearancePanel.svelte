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
		thompsonEnabled?: boolean;
		thompsonPosition?: "margin" | "center";
		bottomPanelEnabled?: boolean;
		bottomPanelFixed?: boolean;
		bottomPanelColumns?: 1 | 2;
		onToggleTwoColumns: () => void;
		onToggleThompson?: () => void;
		onToggleBottomPanel?: () => void;
		onToggleBottomPanelFixed?: () => void;
		onChange: (patch: {
			readerContainerWidth?: ReaderContainerWidth;
			readerVerseSpacing?: ReaderSpacing;
			readerLineSpacing?: ReaderSpacing;
			thompsonCrossRefsPosition?: "margin" | "center";
			crossRefsBottomPanelColumns?: 1 | 2;
		}) => void;
		onClose: () => void;
	}

	let {
		twoColumns,
		containerWidth,
		verseSpacing,
		lineSpacing,
		thompsonEnabled = false,
		thompsonPosition = "margin",
		bottomPanelEnabled = true,
		bottomPanelFixed = false,
		bottomPanelColumns = 2,
		onToggleTwoColumns,
		onToggleThompson,
		onToggleBottomPanel,
		onToggleBottomPanelFixed,
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

	{#if onToggleThompson}
		<button type="button" class="open-bible-appearance-toggle-row" onclick={onToggleThompson}>
			<span class="open-bible-appearance-row-icon" use:icon={"link-2"}></span>
			<span class="open-bible-appearance-row-label">{t("readerMenu.thompsonCrossRefs") || "Referências cruzadas"}</span>
			<span class="open-bible-switch" class:is-on={thompsonEnabled} aria-hidden="true"></span>
		</button>

		{#if thompsonEnabled}
			<h4 class="open-bible-appearance-section-title">{t("settings.thompsonCrossRefsPositionName") || "Posição do layout"}</h4>
			<div class="open-bible-segmented" role="group">
				<button
					type="button"
					class="open-bible-segmented-btn"
					class:is-active={thompsonPosition === "margin"}
					onclick={() => onChange({ thompsonCrossRefsPosition: "margin" })}
				>
					{t("settings.thompsonPositionMargin") || "Margem"}
				</button>
				<button
					type="button"
					class="open-bible-segmented-btn"
					class:is-active={thompsonPosition === "center"}
					onclick={() => onChange({ thompsonCrossRefsPosition: "center" })}
				>
					{t("settings.thompsonPositionCenter") || "Centro"}
				</button>
			</div>
		{/if}
	{/if}

	{#if onToggleBottomPanel}
		<button type="button" class="open-bible-appearance-toggle-row" onclick={onToggleBottomPanel}>
			<span class="open-bible-appearance-row-icon" use:icon={"list-collapse"}></span>
			<span class="open-bible-appearance-row-label">{t("readerMenu.bottomCrossRefs") || "Painel de referências cruzadas"}</span>
			<span class="open-bible-switch" class:is-on={bottomPanelEnabled} aria-hidden="true"></span>
		</button>

		{#if bottomPanelEnabled}
			<h4 class="open-bible-appearance-section-title">{t("settings.crossRefsBottomPanelFixedName") || "Posição do painel"}</h4>
			<div class="open-bible-segmented" role="group">
				<button
					type="button"
					class="open-bible-segmented-btn"
					class:is-active={!bottomPanelFixed}
					onclick={() => {
						if (bottomPanelFixed && onToggleBottomPanelFixed) onToggleBottomPanelFixed();
					}}
				>
					{t("resources.pinInline") || "Final do texto"}
				</button>
				<button
					type="button"
					class="open-bible-segmented-btn"
					class:is-active={bottomPanelFixed}
					onclick={() => {
						if (!bottomPanelFixed && onToggleBottomPanelFixed) onToggleBottomPanelFixed();
					}}
				>
					{t("resources.pinFixed") || "Fixa no rodapé"}
				</button>
			</div>

			<h4 class="open-bible-appearance-section-title">{t("resources.columnsTwo") || "Colunas"}</h4>
			<div class="open-bible-segmented" role="group">
				<button
					type="button"
					class="open-bible-segmented-btn"
					class:is-active={bottomPanelColumns === 1}
					onclick={() => onChange({ crossRefsBottomPanelColumns: 1 })}
				>
					{t("resources.columnsOne") || "1 coluna"}
				</button>
				<button
					type="button"
					class="open-bible-segmented-btn"
					class:is-active={bottomPanelColumns === 2}
					onclick={() => onChange({ crossRefsBottomPanelColumns: 2 })}
				>
					{t("resources.columnsTwo") || "2 colunas"}
				</button>
			</div>
		{/if}
	{/if}

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
