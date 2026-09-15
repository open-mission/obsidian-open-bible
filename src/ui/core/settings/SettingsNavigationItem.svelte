<script lang="ts">
	import type { IconName } from "obsidian";
	import { lucide } from "../icons";

	interface Props {
		title: string;
		description?: string;
		icon?: IconName;
		onClick: () => void;
		ariaLabel?: string;
		disabled?: boolean;
		badge?: string;
	}

	let {
		title,
		description,
		icon,
		onClick,
		ariaLabel,
		disabled = false,
		badge,
	}: Props = $props();

	function handleKeyDown(event: KeyboardEvent): void {
		if (disabled) return;
		if (event.key === "Enter" || event.key === " ") {
			event.preventDefault();
			onClick();
		}
	}
</script>

<button
	type="button"
	class="ob-settings-nav-item"
	class:ob-disabled={disabled}
	aria-label={ariaLabel ?? `${title}${description ? ` — ${description}` : ""}`}
	{disabled}
	onclick={onClick}
	onkeydown={handleKeyDown}
>
	<div class="ob-settings-nav-item-left">
		{#if icon}
			<div class="ob-settings-nav-item-icon" use:lucide={icon} aria-hidden="true"></div>
		{/if}
		<div class="ob-settings-nav-item-text">
			<div class="ob-settings-nav-item-title-row">
				<span class="ob-settings-nav-item-title">{title}</span>
				{#if badge}
					<span class="ob-settings-nav-item-badge">{badge}</span>
				{/if}
			</div>
			{#if description}
				<div class="ob-settings-nav-item-desc">{description}</div>
			{/if}
		</div>
	</div>
	<div class="ob-settings-nav-item-right" aria-hidden="true">
		<span class="ob-settings-nav-item-chevron" use:lucide={"chevron-right"}></span>
	</div>
</button>

<style>
	.ob-settings-nav-item {
		all: unset;
		box-sizing: border-box;
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		padding: 14px 16px;
		cursor: pointer;
		background: transparent;
		transition: background-color 120ms ease;
		border-bottom: 1px solid var(--background-modifier-border);
		text-align: left;
	}

	.ob-settings-nav-item:last-child {
		border-bottom: none;
	}

	.ob-settings-nav-item:hover:not(.ob-disabled) {
		background-color: var(--background-modifier-hover);
	}

	.ob-settings-nav-item:active:not(.ob-disabled) {
		background-color: var(--background-modifier-active-hover, var(--background-modifier-hover));
	}

	.ob-settings-nav-item:focus-visible {
		outline: 2px solid var(--interactive-accent);
		outline-offset: -2px;
	}

	.ob-settings-nav-item.ob-disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.ob-settings-nav-item-left {
		display: flex;
		align-items: center;
		gap: 14px;
		min-width: 0;
		flex: 1;
	}

	.ob-settings-nav-item-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 20px;
		height: 20px;
		color: var(--text-muted);
		flex-shrink: 0;
		transition: color 120ms ease;
	}

	.ob-settings-nav-item:hover:not(.ob-disabled) .ob-settings-nav-item-icon {
		color: var(--text-normal);
	}

	.ob-settings-nav-item-text {
		display: flex;
		flex-direction: column;
		gap: 3px;
		min-width: 0;
	}

	.ob-settings-nav-item-title-row {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.ob-settings-nav-item-title {
		font-size: var(--font-ui-medium);
		font-weight: var(--font-medium, 500);
		color: var(--text-normal);
		line-height: var(--line-height-tight);
	}

	.ob-settings-nav-item-badge {
		font-size: var(--font-ui-smaller);
		padding: 1px 6px;
		border-radius: var(--radius-round, 999px);
		background-color: var(--background-modifier-border);
		color: var(--text-muted);
	}

	.ob-settings-nav-item-desc {
		font-size: var(--font-ui-smaller);
		color: var(--text-muted);
		line-height: var(--line-height-normal);
	}

	.ob-settings-nav-item-right {
		display: flex;
		align-items: center;
		justify-content: center;
		margin-left: 12px;
		flex-shrink: 0;
	}

	.ob-settings-nav-item-chevron {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 16px;
		height: 16px;
		color: var(--text-faint, var(--text-muted));
		transition: transform 120ms ease, color 120ms ease;
	}

	.ob-settings-nav-item:hover:not(.ob-disabled) .ob-settings-nav-item-chevron {
		color: var(--text-muted);
		transform: translateX(2px);
	}
</style>
