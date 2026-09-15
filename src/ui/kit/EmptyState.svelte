<script lang="ts">
	import type { Snippet } from "svelte";
	import { icon } from "../actions/icon";

	interface Props {
		iconName?: string;
		title: string;
		description?: string;
		class?: string;
		children?: Snippet;
	}

	let {
		iconName,
		title,
		description,
		class: className = "",
		children,
	}: Props = $props();
</script>

<div class="open-bible-ui-empty {className}">
	{#if iconName}
		<div class="open-bible-ui-empty__icon" use:icon={iconName}></div>
	{/if}
	<h3 class="open-bible-ui-empty__title">{title}</h3>
	{#if description}
		<p class="open-bible-ui-empty__desc">{description}</p>
	{/if}
	{@render children?.()}
</div>
