<script lang="ts">
	import type { Snippet } from "svelte";
	import SettingsNavigationItem from "./SettingsNavigationItem.svelte";
	import type { SettingsItemDef } from "./types";

	interface Props {
		title?: string;
		subtitle?: string;
		groupTitle?: string;
		sections?: SettingsItemDef[];
		onSelect?: (id: string) => void;
		header?: Snippet;
		children?: Snippet;
	}

	let {
		title,
		subtitle,
		groupTitle,
		sections = [],
		onSelect,
		header,
		children,
	}: Props = $props();
</script>

<div class="ob-settings-root">
	{#if header}
		{@render header()}
	{:else if title || subtitle}
		<div class="ob-settings-root-header">
			{#if title}
				<h2 class="ob-settings-root-title">{title}</h2>
			{/if}
			{#if subtitle}
				<p class="ob-settings-root-subtitle">{subtitle}</p>
			{/if}
		</div>
	{/if}

	<div class="ob-settings-group">
		{#if groupTitle}
			<div class="ob-settings-group-title">{groupTitle}</div>
		{/if}

		<div class="ob-settings-card">
			{#if children}
				{@render children()}
			{:else}
				{#each sections as section (section.id)}
					<SettingsNavigationItem
						title={section.title}
						description={section.description}
						icon={section.icon}
						badge={section.badge}
						disabled={section.disabled}
						onClick={() => onSelect?.(section.id)}
					/>
				{/each}
			{/if}
		</div>
	</div>
</div>

<style>
	.ob-settings-root {
		display: flex;
		flex-direction: column;
		width: 100%;
		animation: ob-fade-in 120ms ease-out;
	}

	.ob-settings-root-header {
		margin-bottom: 16px;
	}

	.ob-settings-root-title {
		margin: 0;
		font-size: var(--font-ui-large, 1.25rem);
		font-weight: var(--font-semibold, 600);
		color: var(--text-normal);
		line-height: var(--line-height-tight);
	}

	.ob-settings-root-subtitle {
		margin: 4px 0 0 0;
		font-size: var(--font-ui-small);
		color: var(--text-muted);
	}

	.ob-settings-group {
		display: flex;
		flex-direction: column;
		width: 100%;
	}

	.ob-settings-group-title {
		font-size: var(--font-ui-smaller);
		font-weight: var(--font-semibold, 600);
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: 8px;
		padding-left: 2px;
	}

	.ob-settings-card {
		display: flex;
		flex-direction: column;
		background-color: var(--background-primary-alt, var(--background-secondary));
		border: 1px solid var(--background-modifier-border);
		border-radius: var(--radius-m, 8px);
		overflow: hidden;
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
		.ob-settings-root {
			animation: none;
		}
	}
</style>
