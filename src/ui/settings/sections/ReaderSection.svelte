<script lang="ts">
	import { t } from "../../../i18n";
	import type { ReaderContainerWidth, ReaderSpacing } from "../../../settings";
	import type { SectionContext } from "../types";

	let { settings, updateGeneral }: SectionContext = $props();

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

<div class="setting-item">
	<div class="setting-item-info">
		<div class="setting-item-name">{t("settings.readerTwoColumnsName")}</div>
		<div class="setting-item-description">{t("settings.readerTwoColumnsDesc")}</div>
	</div>
	<div class="setting-item-control">
		<input
			type="checkbox"
			checked={settings.readerTwoColumns}
			aria-label={t("settings.readerTwoColumnsName")}
			onchange={(e) => void updateGeneral({ readerTwoColumns: e.currentTarget.checked })}
		/>
	</div>
</div>

<div class="setting-item">
	<div class="setting-item-info">
		<div class="setting-item-name">{t("settings.thompsonCrossRefsName")}</div>
		<div class="setting-item-description">{t("settings.thompsonCrossRefsDesc")}</div>
	</div>
	<div class="setting-item-control">
		<input
			type="checkbox"
			checked={Boolean(settings.thompsonCrossRefsEnabled)}
			aria-label={t("settings.thompsonCrossRefsName")}
			onchange={(e) => void updateGeneral({ thompsonCrossRefsEnabled: e.currentTarget.checked })}
		/>
	</div>
</div>

{#if settings.thompsonCrossRefsEnabled}
	<div class="setting-item">
		<div class="setting-item-info">
			<div class="setting-item-name">{t("settings.thompsonCrossRefsPositionName")}</div>
			<div class="setting-item-description">{t("settings.thompsonCrossRefsPositionDesc")}</div>
		</div>
		<div class="setting-item-control">
			<select
				value={settings.thompsonCrossRefsPosition || "margin"}
				aria-label={t("settings.thompsonCrossRefsPositionName")}
				onchange={(e) => void updateGeneral({ thompsonCrossRefsPosition: e.currentTarget.value as "margin" | "center" })}
			>
				<option value="margin">{t("settings.thompsonPositionMargin")}</option>
				<option value="center">{t("settings.thompsonPositionCenter")}</option>
			</select>
		</div>
	</div>
{/if}

<div class="setting-item">
	<div class="setting-item-info">
		<div class="setting-item-name">{t("settings.showCrossRefsBottomPanelName")}</div>
		<div class="setting-item-description">{t("settings.showCrossRefsBottomPanelDesc")}</div>
	</div>
	<div class="setting-item-control">
		<input
			type="checkbox"
			checked={settings.showCrossRefsBottomPanel ?? true}
			aria-label={t("settings.showCrossRefsBottomPanelName")}
			onchange={(e) => void updateGeneral({ showCrossRefsBottomPanel: e.currentTarget.checked })}
		/>
	</div>
</div>

{#if settings.showCrossRefsBottomPanel ?? true}
	<div class="setting-item">
		<div class="setting-item-info">
			<div class="setting-item-name">{t("settings.crossRefsBottomPanelFixedName")}</div>
			<div class="setting-item-description">{t("settings.crossRefsBottomPanelFixedDesc")}</div>
		</div>
		<div class="setting-item-control">
			<select
				value={settings.crossRefsBottomPanelFixed ? "fixed" : "inline"}
				aria-label={t("settings.crossRefsBottomPanelFixedName")}
				onchange={(e) => void updateGeneral({ crossRefsBottomPanelFixed: e.currentTarget.value === "fixed" })}
			>
				<option value="inline">{t("resources.pinInline")}</option>
				<option value="fixed">{t("resources.pinFixed")}</option>
			</select>
		</div>
	</div>
{/if}

<div class="setting-item">
	<div class="setting-item-info">
		<div class="setting-item-name">{t("settings.readerContainerWidthName")}</div>
		<div class="setting-item-description">{t("settings.readerContainerWidthDesc")}</div>
	</div>
	<div class="setting-item-control">
		<select
			value={settings.readerContainerWidth}
			aria-label={t("settings.readerContainerWidthName")}
			onchange={(e) => void updateGeneral({ readerContainerWidth: e.currentTarget.value as ReaderContainerWidth })}
		>
			{#each widths as width (width)}
				<option value={width}>{widthLabel(width)}</option>
			{/each}
		</select>
	</div>
</div>

<div class="setting-item">
	<div class="setting-item-info">
		<div class="setting-item-name">{t("settings.readerVerseSpacingName")}</div>
		<div class="setting-item-description">{t("settings.readerVerseSpacingDesc")}</div>
	</div>
	<div class="setting-item-control">
		<select
			value={settings.readerVerseSpacing}
			aria-label={t("settings.readerVerseSpacingName")}
			onchange={(e) => void updateGeneral({ readerVerseSpacing: e.currentTarget.value as ReaderSpacing })}
		>
			{#each spacings as spacing (spacing)}
				<option value={spacing}>{spacingLabel(spacing)}</option>
			{/each}
		</select>
	</div>
</div>

<div class="setting-item">
	<div class="setting-item-info">
		<div class="setting-item-name">{t("settings.readerLineSpacingName")}</div>
		<div class="setting-item-description">{t("settings.readerLineSpacingDesc")}</div>
	</div>
	<div class="setting-item-control">
		<select
			value={settings.readerLineSpacing}
			aria-label={t("settings.readerLineSpacingName")}
			onchange={(e) => void updateGeneral({ readerLineSpacing: e.currentTarget.value as ReaderSpacing })}
		>
			{#each spacings as spacing (spacing)}
				<option value={spacing}>{spacingLabel(spacing)}</option>
			{/each}
		</select>
	</div>
</div>
