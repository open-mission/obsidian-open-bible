<script lang="ts">
	import type { Snippet } from "svelte";
	import { icon } from "../actions/icon";
	import IconButton from "./IconButton.svelte";

	interface Props {
		title: string;
		subtitle?: string;
		onClose: () => void;
		closeLabel: string;
		onBack?: () => void;
		backLabel?: string;
		actions?: Snippet;
	}

	let {
		title,
		subtitle,
		onClose,
		closeLabel,
		onBack,
		backLabel,
		actions,
	}: Props = $props();
</script>

<div class="open-bible-picker-header open-bible-ui-picker-header">
	{#if onBack}
		<button
			type="button"
			class="open-bible-picker-back-btn"
			aria-label={backLabel}
			onclick={onBack}
		>
			<span use:icon={"chevron-left"}></span>
			{#if backLabel}
				<span>{backLabel}</span>
			{/if}
		</button>
	{/if}

	<div class="open-bible-picker-title open-bible-ui-picker-title">
		{#if title}<strong>{title}</strong>{/if}
		{#if subtitle}
			<span>{subtitle}</span>
		{/if}
	</div>

	<div class="open-bible-picker-actions">
		{@render actions?.()}
		<IconButton
			iconName="x"
			class="open-bible-picker-close-btn"
			title={closeLabel}
			ariaLabel={closeLabel}
			onclick={onClose}
		/>
	</div>
</div>
