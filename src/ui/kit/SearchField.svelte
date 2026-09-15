<script lang="ts">
	import { icon } from "../actions/icon";

	interface Props {
		value?: string;
		placeholder?: string;
		inputEl?: HTMLInputElement | null;
	}

	let {
		value = $bindable(""),
		placeholder = "",
		inputEl = $bindable<HTMLInputElement | null>(null),
	}: Props = $props();
</script>

<div class="search-input-container open-bible-ui-search open-bible-search-input-container">
	<input
		type="search"
		{placeholder}
		bind:value
		bind:this={inputEl}
	/>
	{#if value}
		<button
			type="button"
			class="search-input-clear-button"
			onclick={() => (value = "")}
			aria-label="Clear"
		>
			<span use:icon={"x"}></span>
		</button>
	{/if}
</div>
