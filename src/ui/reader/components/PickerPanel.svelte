<script lang="ts">
	import type { Snippet } from "svelte";
	import { t } from "../../../i18n";
	import { lucide } from "../../core/icons";

	interface Props {
		title?: string;
		subtitle?: string;
		onClose: () => void;
		onBack?: () => void;
		backLabel?: string;
		children?: Snippet;
	}

	let { title = "", subtitle = "", onClose, onBack, backLabel, children }: Props = $props();
</script>

<!-- Click outside closes the panel, mirroring the native Obsidian dropdown behaviour. -->
<div class="ob-picker-overlay" role="presentation" onclick={onClose} onkeydown={() => undefined}></div>

<div class="ob-picker" role="dialog" aria-label={title || t("toolbar.chooseBook")}>
	<div class="ob-picker-header">
		{#if onBack}
			<button type="button" class="ob-picker-back" onclick={onBack}>
				<span class="ob-picker-icon" use:lucide={"chevron-left"}></span>
				{#if backLabel}<span class="ob-picker-back-label">{backLabel}</span>{/if}
			</button>
		{/if}

		<div class="ob-picker-titles">
			{#if title}<strong>{title}</strong>{/if}
			{#if subtitle}<span class="ob-picker-subtitle">{subtitle}</span>{/if}
		</div>

		<button
			type="button"
			class="ob-picker-close clickable-icon"
			aria-label={t("bookPicker.close")}
			onclick={onClose}
		>
			<span class="ob-picker-icon" use:lucide={"x"}></span>
		</button>
	</div>

	<div class="ob-picker-body">
		{@render children?.()}
	</div>
</div>

<style>
	.ob-picker-overlay {
		position: absolute;
		inset: 0;
		z-index: 20;
		background: transparent;
	}

	.ob-picker {
		position: absolute;
		z-index: 21;
		top: 3.1rem;
		left: 0.5rem;
		right: 0.5rem;
		max-height: calc(100% - 3.6rem);
		display: flex;
		flex-direction: column;
		background: var(--background-primary);
		border: 1px solid var(--background-modifier-border);
		border-radius: var(--radius-m, 8px);
		box-shadow: var(--shadow-s, 0 6px 24px rgba(0, 0, 0, 0.2));
		overflow: hidden;
	}

	.ob-picker-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.6rem;
		border-bottom: 1px solid var(--background-modifier-border);
		background: var(--background-secondary);
	}

	.ob-picker-titles {
		display: flex;
		flex: 1;
		flex-direction: column;
		gap: 0.1rem;
		min-width: 0;
	}

	.ob-picker-titles strong {
		font-size: var(--font-ui-small);
		color: var(--text-normal);
	}

	.ob-picker-subtitle {
		font-size: var(--font-ui-smaller);
		color: var(--text-muted);
	}

	.ob-picker-back,
	.ob-picker-close {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.2rem 0.4rem;
		border: none;
		border-radius: var(--radius-s, 4px);
		background: transparent;
		color: var(--text-muted);
		cursor: pointer;
		box-shadow: none;
	}

	.ob-picker-back:hover,
	.ob-picker-close:hover {
		background: var(--background-modifier-hover);
		color: var(--text-normal);
	}

	.ob-picker-back-label {
		font-size: var(--font-ui-smaller);
		max-width: 8rem;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.ob-picker-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1rem;
		height: 1rem;
	}

	.ob-picker-body {
		padding: 0.75rem;
		overflow-y: auto;
	}
</style>