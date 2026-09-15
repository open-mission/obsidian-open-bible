<script lang="ts">
	import type { Snippet } from "svelte";
	import { t } from "../../../i18n";
	import { lucide } from "../icons";

	interface Props {
		title: string;
		description?: string;
		onBack: () => void;
		backAriaLabel?: string;
		actions?: Snippet;
	}

	let { title, onBack, backAriaLabel, actions }: Props = $props();

	// Localized fallback for the back button label (reactive to locale changes).
	const backLabel = $derived(backAriaLabel ?? t("common.backToSettings"));

	function handleKeyDown(event: KeyboardEvent): void {
		if (event.key === "Enter" || event.key === " ") {
			event.preventDefault();
			onBack();
		}
	}
</script>

<div class="ob-settings-section-header">
	<div class="ob-settings-section-header-main">
		<button
			type="button"
			class="clickable-icon ob-settings-back-button"
			aria-label={backLabel}
			title={backLabel}
			onclick={onBack}
			onkeydown={handleKeyDown}
		>
			<span class="ob-back-icon" use:lucide={"arrow-left"}></span>
		</button>

		<h3 class="ob-settings-header-title">{title}</h3>
	</div>

	{#if actions}
		<div class="ob-settings-section-header-actions">
			{@render actions()}
		</div>
	{/if}
</div>

<style>
	.ob-settings-section-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 2px 0 14px 0;
		margin-bottom: 16px;
		border-bottom: 1px solid var(--background-modifier-border);
	}

	.ob-settings-section-header-main {
		display: flex;
		align-items: center;
		gap: 10px;
		min-width: 0;
	}

	.ob-settings-back-button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		padding: 4px;
		border: none;
		border-radius: var(--radius-s, 4px);
		cursor: pointer;
		flex-shrink: 0;
		color: var(--icon-color, var(--text-muted));
		background: transparent;
		box-shadow: none;
	}

	.ob-settings-back-button:hover {
		color: var(--icon-color-hover, var(--text-normal));
		background-color: var(--background-modifier-hover);
	}

	.ob-settings-back-button:focus-visible {
		outline: 2px solid var(--interactive-accent);
		outline-offset: 1px;
	}

	.ob-back-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 18px;
		height: 18px;
	}

	.ob-settings-header-title {
		margin: 0;
		font-size: var(--font-ui-large, 1.25rem);
		font-weight: var(--font-semibold, 600);
		color: var(--text-normal);
		line-height: var(--line-height-tight);
	}

	.ob-settings-section-header-actions {
		display: flex;
		align-items: center;
		gap: 8px;
	}
</style>
