<script lang="ts">
	import type { Snippet } from "svelte";
	import SettingsSectionHeader from "./SettingsSectionHeader.svelte";

	interface Props {
		title?: string;
		description?: string;
		onBack?: () => void;
		backAriaLabel?: string;
		header?: Snippet;
		children?: Snippet;
	}

	let {
		title,
		description,
		onBack,
		backAriaLabel,
		header,
		children,
	}: Props = $props();
</script>

<div class="ob-settings-section-page">
	{#if header}
		{@render header()}
	{:else if title && onBack}
		<SettingsSectionHeader {title} {onBack} {backAriaLabel} />
	{/if}

	<div class="ob-settings-section-content">
		{@render children?.()}
	</div>
</div>

<style>
	.ob-settings-section-page {
		display: flex;
		flex-direction: column;
		width: 100%;
		animation: ob-fade-in 120ms ease-out;
	}

	.ob-settings-section-content {
		display: flex;
		flex-direction: column;
		width: 100%;
	}

	.ob-settings-section-content :global(.setting-item:first-child) {
		border-top: none;
	}

	@keyframes ob-fade-in {
		from {
			opacity: 0;
			transform: translateY(2px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.ob-settings-section-page {
			animation: none;
		}
	}
</style>
