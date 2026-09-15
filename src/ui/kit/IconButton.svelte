<script lang="ts">
	import type { Snippet } from "svelte";
	import { icon } from "../actions/icon";

	interface Props {
		iconName: string;
		active?: boolean;
		danger?: boolean;
		disabled?: boolean;
		title?: string;
		ariaLabel?: string;
		class?: string;
		onclick?: (event: MouseEvent) => void;
		children?: Snippet;
	}

	let {
		iconName,
		active = false,
		danger = false,
		disabled = false,
		title,
		ariaLabel,
		class: className = "",
		onclick,
		children,
	}: Props = $props();
</script>

<button
	type="button"
	class="clickable-icon open-bible-ui-icon-btn {className}"
	class:is-active={active}
	class:is-danger={danger}
	{disabled}
	{title}
	aria-label={ariaLabel ?? title}
	{onclick}
>
	<span use:icon={iconName}></span>
	{@render children?.()}
</button>
