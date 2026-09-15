<script lang="ts">
	import type { Snippet } from "svelte";
	import { icon } from "../actions/icon";
	import { uiButtonClass } from "./dom";
	import type { UiButtonSize, UiButtonVariant } from "./types";

	interface Props {
		variant?: UiButtonVariant;
		size?: UiButtonSize;
		iconName?: string;
		disabled?: boolean;
		title?: string;
		ariaLabel?: string;
		type?: "button" | "submit";
		onclick?: (event: MouseEvent) => void;
		children?: Snippet;
	}

	let {
		variant = "default",
		size = "md",
		iconName,
		disabled = false,
		title,
		ariaLabel,
		type = "button",
		onclick,
		children,
	}: Props = $props();
</script>

<button
	{type}
	class={uiButtonClass(variant, size)}
	{disabled}
	{title}
	aria-label={ariaLabel}
	{onclick}
>
	{#if iconName}
		<span class="open-bible-ui-btn__icon" use:icon={iconName}></span>
	{/if}
	{@render children?.()}
</button>
