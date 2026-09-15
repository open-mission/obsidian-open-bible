<script lang="ts">
	import type { Snippet } from "svelte";

	interface Props {
		class?: string;
		children?: Snippet;
	}

	let { class: className = "", children }: Props = $props();
</script>

<div class="ob-settings-layout {className}">
	{@render children?.()}
</div>

<style>
	.ob-settings-layout {
		display: flex;
		flex-direction: column;
		width: 100%;
		color: var(--text-normal);
		font-family: var(--font-interface);
	}
</style>
