<script lang="ts">
	import type { HighlightConfig } from "../../../settings";
	import { resolveHighlightCssColor } from "../highlightStyles";
	import Drawer from "../../kit/Drawer.svelte";
	import PickerHeader from "../../kit/PickerHeader.svelte";
	import { icon } from "../../actions/icon";
	import { t } from "../../../i18n";

	interface Props {
		reference: string;
		highlights: HighlightConfig[];
		currentColor?: string | null;
		onSelectHighlight: (colorId: string) => void;
		onRemoveHighlight?: () => void;
		onOpenSettings?: () => void;
		onClose: () => void;
	}

	let {
		reference,
		highlights,
		currentColor = null,
		onSelectHighlight,
		onRemoveHighlight,
		onOpenSettings,
		onClose,
	}: Props = $props();
</script>

<Drawer size="highlights" {onClose}>
	<div class="open-bible-highlights-drawer">
		<PickerHeader
			title={reference}
			subtitle={t("popover.selectHighlight")}
			closeLabel={t("common.close")}
			{onClose}
		/>

		<div class="open-bible-highlights-drawer-list" role="list">
			{#each highlights as hl (hl.id)}
				{@const isSelected = currentColor === hl.id || currentColor === hl.color}
				{@const cssColor = resolveHighlightCssColor(hl.color)}
				<button
					type="button"
					class="open-bible-highlights-drawer-item"
					class:is-active={isSelected}
					onclick={() => {
						onSelectHighlight(hl.id);
						onClose();
					}}
				>
					<span
						class="open-bible-highlights-drawer-dot"
						style:background-color={cssColor}
					>
						{#if isSelected}
							<span class="open-bible-highlights-drawer-check" use:icon={"check"}></span>
						{/if}
					</span>
					<span class="open-bible-highlights-drawer-label">{hl.label}</span>
				</button>
			{/each}
		</div>

		<div class="open-bible-highlights-drawer-footer">
			{#if currentColor && onRemoveHighlight}
				<button
					type="button"
					class="open-bible-highlights-drawer-action mod-danger"
					onclick={() => {
						onRemoveHighlight();
						onClose();
					}}
				>
					<span use:icon={"trash-2"}></span>
					<span>{t("popover.removeHighlight")}</span>
				</button>
			{/if}

			{#if onOpenSettings}
				<button
					type="button"
					class="open-bible-highlights-drawer-action"
					onclick={() => {
						onClose();
						onOpenSettings();
					}}
				>
					<span use:icon={"settings"}></span>
					<span>{t("popover.configureHighlights")}</span>
				</button>
			{/if}
		</div>
	</div>
</Drawer>
