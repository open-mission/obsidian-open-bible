<script lang="ts">
	import type { Snippet } from "svelte";
	interface Props {
		message: string;
		hint?: string;
		children?: Snippet;
	}

	let { message, hint, children }: Props = $props();
</script>

<div class="ob-empty">
	<p class="ob-empty-message">{message}</p>
	{#if hint}
		<p class="ob-empty-hint">{hint}</p>
	{/if}
	{#if children}
		<div class="ob-empty-action">
			{@render children()}
		</div>
	{/if}
</div>

<style>
	.ob-empty {
		padding: 16px;
		text-align: center;
		color: var(--text-muted);
		border: 1px dashed var(--background-modifier-border);
		border-radius: 8px;
	}
	.ob-empty-message {
		margin: 0;
		color: var(--text-normal);
	}
	.ob-empty-hint {
		margin: 4px 0 0;
		font-size: var(--font-ui-small);
	}
	.ob-empty-action {
		margin-top: 12px;
	}
</style>
