<script lang="ts">
	import { t } from "../../../i18n";
	import type { ReaderContainerWidth, ReaderSpacing } from "../../../settings";
	import PickerHeader from "../../kit/PickerHeader.svelte";
	import Toggle from "../../kit/Toggle.svelte";

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
	title={t("readerMenu.appearance") || "Aparência"}
	closeLabel={t("bookPicker.close")}
	{onClose}
/>

<div class="open-bible-appearance-body">
	<!-- Two Columns Layout -->
	<div class="setting-item">
		<div class="setting-item-info">
			<div class="setting-item-name">{t("settings.readerTwoColumnsName") || t("readerMenu.twoColumnsToggle")}</div>
		</div>
		<div class="setting-item-control">
			<Toggle
				checked={twoColumns}
				ariaLabel={t("settings.readerTwoColumnsName") || t("readerMenu.twoColumnsToggle")}
				onchange={onToggleTwoColumns}
			/>
		</div>
	</div>

	<!-- Thompson Cross-references -->
	{#if onToggleThompson}
		<div class="setting-item">
			<div class="setting-item-info">
				<div class="setting-item-name">{t("settings.thompsonCrossRefsName") || t("readerMenu.thompsonCrossRefs")}</div>
			</div>
			<div class="setting-item-control">
				<Toggle
					checked={thompsonEnabled}
					ariaLabel={t("settings.thompsonCrossRefsName")}
					onchange={onToggleThompson}
				/>
			</div>
		</div>

		{#if thompsonEnabled}
			<div class="setting-item mod-sub">
				<div class="setting-item-info">
					<div class="setting-item-name">{t("settings.thompsonCrossRefsPositionName") || "Posição do layout"}</div>
				</div>
				<div class="setting-item-control">
					<select
						class="dropdown"
						value={thompsonPosition}
						aria-label={t("settings.thompsonCrossRefsPositionName") || "Posição do layout"}
						onchange={(e) => onChange({ thompsonCrossRefsPosition: e.currentTarget.value as "margin" | "center" })}
					>
						<option value="margin">{t("settings.thompsonPositionMargin") || "Margem"}</option>
						<option value="center">{t("settings.thompsonPositionCenter") || "Centro"}</option>
					</select>
				</div>
			</div>
		{/if}
	{/if}

	<!-- Cross References Bottom Panel -->
	{#if onToggleBottomPanel}
		<div class="setting-item">
			<div class="setting-item-info">
				<div class="setting-item-name">{t("settings.showCrossRefsBottomPanelName") || t("readerMenu.bottomCrossRefs")}</div>
			</div>
			<div class="setting-item-control">
				<Toggle
					checked={bottomPanelEnabled}
					ariaLabel={t("settings.showCrossRefsBottomPanelName")}
					onchange={onToggleBottomPanel}
				/>
			</div>
		</div>

		{#if bottomPanelEnabled}
			<div class="setting-item mod-sub">
				<div class="setting-item-info">
					<div class="setting-item-name">{t("settings.crossRefsBottomPanelFixedName") || "Posição do painel"}</div>
				</div>
				<div class="setting-item-control">
					<select
						class="dropdown"
						value={bottomPanelFixed ? "fixed" : "inline"}
						aria-label={t("settings.crossRefsBottomPanelFixedName") || "Posição do painel"}
						onchange={(e) => {
							const isFixed = e.currentTarget.value === "fixed";
							if (isFixed !== bottomPanelFixed && onToggleBottomPanelFixed) {
								onToggleBottomPanelFixed();
							}
						}}
					>
						<option value="inline">{t("resources.pinInline") || "Final do texto"}</option>
						<option value="fixed">{t("resources.pinFixed") || "Fixa no rodapé"}</option>
					</select>
				</div>
			</div>

			<div class="setting-item mod-sub">
				<div class="setting-item-info">
					<div class="setting-item-name">{t("resources.columnsTwo") || "Colunas"}</div>
				</div>
				<div class="setting-item-control">
					<select
						class="dropdown"
						value={String(bottomPanelColumns)}
						aria-label={t("resources.columnsTwo") || "Colunas"}
						onchange={(e) => onChange({ crossRefsBottomPanelColumns: Number(e.currentTarget.value) as 1 | 2 })}
					>
						<option value="1">{t("resources.columnsOne") || "1 coluna"}</option>
						<option value="2">{t("resources.columnsTwo") || "2 colunas"}</option>
					</select>
				</div>
			</div>
		{/if}
	{/if}

	<!-- Text Container Width -->
	<div class="setting-item">
		<div class="setting-item-info">
			<div class="setting-item-name">{t("readerMenu.containerWidthHeader")}</div>
		</div>
		<div class="setting-item-control">
			<select
				class="dropdown"
				value={containerWidth}
				aria-label={t("readerMenu.containerWidthHeader")}
				onchange={(e) => onChange({ readerContainerWidth: e.currentTarget.value as ReaderContainerWidth })}
			>
				{#each widths as width (width)}
					<option value={width}>{widthLabel(width)}</option>
				{/each}
			</select>
		</div>
	</div>

	<!-- Verse Spacing -->
	<div class="setting-item">
		<div class="setting-item-info">
			<div class="setting-item-name">{t("readerMenu.verseSpacingHeader")}</div>
		</div>
		<div class="setting-item-control">
			<select
				class="dropdown"
				value={verseSpacing}
				aria-label={t("readerMenu.verseSpacingHeader")}
				onchange={(e) => onChange({ readerVerseSpacing: e.currentTarget.value as ReaderSpacing })}
			>
				{#each spacings as spacing (spacing)}
					<option value={spacing}>{spacingLabel(spacing)}</option>
				{/each}
			</select>
		</div>
	</div>

	<!-- Line Spacing -->
	<div class="setting-item">
		<div class="setting-item-info">
			<div class="setting-item-name">{t("readerMenu.lineSpacingHeader")}</div>
		</div>
		<div class="setting-item-control">
			<select
				class="dropdown"
				value={lineSpacing}
				aria-label={t("readerMenu.lineSpacingHeader")}
				onchange={(e) => onChange({ readerLineSpacing: e.currentTarget.value as ReaderSpacing })}
			>
				{#each spacings as spacing (spacing)}
					<option value={spacing}>{spacingLabel(spacing)}</option>
				{/each}
			</select>
		</div>
	</div>
</div>
