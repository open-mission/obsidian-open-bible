<script lang="ts">
	import type { App } from "obsidian";
	import { t } from "./i18n";

	interface Props {
		defaultReference: string;
		app?: App;
	}

	let { defaultReference, app }: Props = $props();

	// Reactive state (Svelte 5 runes).
	// Initialized empty and synchronized via $effect to avoid capturing initial prop locally.
	let reference = $state("");
	let searched = $state<string | null>(null);
	let history = $state<string[]>([]);
	let count = $state(0);

	// Derived from rune state: the message follows new searches and locale changes.
	let result = $derived(searched ? t("view.searchResult", { reference: searched, count }) : null);

	// Synchronize when setting updates outside the component
	$effect(() => {
		reference = defaultReference;
	});

	function buscar() {
		const ref = reference.trim();
		if (!ref) return;
		count += 1;
		// Placeholder: real search implementation goes here (local API/file).
		searched = ref;
		if (!history.includes(ref)) {
			history = [ref, ...history].slice(0, 10);
		}
	}

	function selecionar(ref: string) {
		reference = ref;
		buscar();
	}

	export function increment() {
		count += 1;
	}
</script>

<div class="open-bible-app">
	<header class="open-bible-header">
		<h4>OpenBible</h4>
		<p class="open-bible-subtitle">{t("view.subtitle")}</p>
	</header>

	<div class="open-bible-search">
		<input
			type="text"
			placeholder={t("view.referencePlaceholder")}
			bind:value={reference}
			onkeydown={(e) => e.key === "Enter" && buscar()}
			aria-label={t("view.referenceAria")}
		/>
		<button onclick={buscar}>{t("common.search")}</button>
	</div>

	{#if result}
		<div class="open-bible-result">{result}</div>
	{:else}
		<div class="open-bible-empty">
			{t("view.searchHint")}
		</div>
	{/if}

	{#if history.length > 0}
		<div class="open-bible-history">
			<span class="open-bible-history-title">{t("common.recent")}</span>
			<div class="open-bible-chips">
				{#each history as item (item)}
					<button class="open-bible-chip" onclick={() => selecionar(item)}>
						{item}
					</button>
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>
	.open-bible-app {
		display: flex;
		flex-direction: column;
		gap: 12px;
		padding: 12px;
		color: var(--text-normal);
	}
	.open-bible-header h4 {
		margin: 0;
	}
	.open-bible-subtitle {
		margin: 2px 0 0;
		font-size: var(--font-ui-small);
		color: var(--text-muted);
	}
	.open-bible-search {
		display: flex;
		gap: 8px;
	}
	.open-bible-search input {
		flex: 1;
	}
	.open-bible-result {
		padding: 10px;
		border: 1px solid var(--background-modifier-border);
		border-radius: 8px;
		background: var(--background-secondary);
	}
	.open-bible-empty {
		color: var(--text-muted);
		font-size: var(--font-ui-small);
	}
	.open-bible-history-title {
		font-size: var(--font-ui-small);
		color: var(--text-muted);
	}
	.open-bible-chips {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		margin-top: 6px;
	}
	.open-bible-chip {
		border: 1px solid var(--background-modifier-border);
		border-radius: 999px;
		padding: 2px 10px;
		font-size: var(--font-ui-small);
		cursor: pointer;
	}
</style>
