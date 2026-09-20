<script lang="ts">
	import { onMount } from "svelte";
	import { Menu, Platform } from "obsidian";
	import { icon } from "../actions/icon";
	import { t } from "../../i18n";
	import type { HighlightConfig, ResourceTypeConfig } from "../../settings";
	import { resolveHighlightCssColor } from "../reader/highlightStyles";
	import HighlightsDrawer from "../reader/components/HighlightsDrawer.svelte";

	interface Props {
		reference: string;
		selectedCount: number;
		selectedSnippet?: string;
		configuredHighlights: HighlightConfig[];
		configuredNotes?: HighlightConfig[];
		configuredResources?: ResourceTypeConfig[];
		currentColor?: string | null;
		onCopyReference: () => void;
		onCopyText: () => void;
		onCreateNote: (colorId?: string) => void;
		onHighlightColor?: (color: string) => void;
		onRemoveHighlight?: () => void;
		onOpenConfigureHighlights?: () => void;
		onLinkResource?: (typeId: string) => void;
		onCompare?: () => void;
		onClose: () => void;
	}

	let {
		reference,
		selectedCount,
		selectedSnippet,
		configuredHighlights,
		configuredNotes = [],
		configuredResources = [],
		currentColor = null,
		onCopyReference,
		onCopyText,
		onCreateNote,
		onHighlightColor,
		onRemoveHighlight,
		onOpenConfigureHighlights,
		onLinkResource,
		onCompare,
		onClose,
	}: Props = $props();

	let mobileBottomOffset = $state<number>(0);
	let isMobileDocked = $state<boolean>(false);
	let isMobile = $state<boolean>(false);
	let showMobileDrawer = $state<boolean>(false);

	function updateMobileOffset() {
		if (typeof window === "undefined" || typeof document === "undefined") return;

		const isPhone = Platform.isPhone || document.body.classList.contains("is-phone");
		const isMob = Platform.isMobile || document.body.classList.contains("is-mobile") || window.innerWidth < 768;
		isMobile = isMob;

		if (!isPhone && !isMob) {
			mobileBottomOffset = 0;
			isMobileDocked = false;
			return;
		}

		const navbar = document.querySelector(
			".mobile-navbar, .mobile-navbar-actions, .mobile-toolbar"
		) as HTMLElement | null;

		if (navbar && navbar.offsetParent !== null) {
			const rect = navbar.getBoundingClientRect();
			const offset = Math.max(0, Math.round(window.innerHeight - rect.top));
			mobileBottomOffset = offset > 0 ? offset : isPhone ? 48 : 0;
			isMobileDocked = true;
		} else if (isPhone) {
			mobileBottomOffset = 48;
			isMobileDocked = true;
		} else if (window.innerWidth < 768) {
			mobileBottomOffset = 0;
			isMobileDocked = true;
		} else {
			mobileBottomOffset = 0;
			isMobileDocked = false;
		}
	}

	onMount(() => {
		updateMobileOffset();
		const rafId = requestAnimationFrame(updateMobileOffset);

		window.addEventListener("resize", updateMobileOffset);
		window.addEventListener("orientationchange", updateMobileOffset);

		let observer: MutationObserver | null = null;
		const navbar = document.querySelector(".mobile-navbar, .mobile-navbar-actions, .mobile-toolbar");
		if (navbar) {
			observer = new MutationObserver(() => {
				updateMobileOffset();
			});
			observer.observe(navbar, { attributes: true, attributeFilter: ["style", "class"] });
		}

		function onKeyDown(e: KeyboardEvent) {
			if (e.key === "Escape") {
				e.preventDefault();
				onClose();
			}
		}

		window.addEventListener("keydown", onKeyDown);
		return () => {
			cancelAnimationFrame(rafId);
			if (observer) {
				observer.disconnect();
			}
			window.removeEventListener("resize", updateMobileOffset);
			window.removeEventListener("orientationchange", updateMobileOffset);
			window.removeEventListener("keydown", onKeyDown);
		};
	});

	function handleCreateNoteClick(event: MouseEvent) {
		const noteList = configuredNotes && configuredNotes.length > 0 ? configuredNotes : [];
		if (noteList.length <= 1) {
			onCreateNote(noteList[0]?.id);
			return;
		}

		const menu = new Menu();
		for (const noteCfg of noteList) {
			menu.addItem((item) => {
				item
					.setTitle(noteCfg.label)
					.setIcon("file-text")
					.onClick(() => {
						onCreateNote(noteCfg.id);
					});
			});
		}
		menu.showAtMouseEvent(event);
	}

	function handleLinkResourceClick(event: MouseEvent) {
		if (!onLinkResource) return;
		if (!configuredResources || configuredResources.length === 0) return;
		if (configuredResources.length === 1) {
			onLinkResource(configuredResources[0].id);
			return;
		}
		const menu = new Menu();
		for (const resType of configuredResources) {
			menu.addItem((item) => {
				item
					.setTitle(resType.label)
					.setIcon(resType.icon as never)
					.onClick(() => {
						onLinkResource(resType.id);
					});
			});
		}
		menu.showAtMouseEvent(event);
	}
</script>

<div
	class="open-bible-verse-action-bar-container"
	class:is-mobile-docked={isMobileDocked}
	style:--mobile-bottom-offset={mobileBottomOffset > 0 ? `${mobileBottomOffset}px` : undefined}
	role="toolbar"
	aria-label="Ações de versículo"
>
	<div class="open-bible-verse-action-bar">
		<div
			class="open-bible-action-bar-scroll-track"
			onwheel={(e) => {
				if (e.deltaY !== 0 && e.currentTarget.scrollWidth > e.currentTarget.clientWidth) {
					e.currentTarget.scrollLeft += e.deltaY;
				}
			}}
		>
			<!-- Reference Badge -->
			<div
				class="open-bible-action-bar-badge"
				title={selectedSnippet ? `${reference} ("${selectedSnippet}")` : `${reference} (${selectedCount})`}
			>
				<span class="open-bible-action-bar-badge-icon" use:icon={"book-open"}></span>
				<span class="open-bible-action-bar-badge-text">
					{reference}
					{#if selectedSnippet}
						<em>("{selectedSnippet}")</em>
					{/if}
				</span>
				{#if selectedCount > 1 && !selectedSnippet}
					<span class="open-bible-action-bar-badge-count">({selectedCount})</span>
				{/if}
			</div>

			<div class="open-bible-action-bar-divider" aria-hidden="true"></div>

			<!-- Highlight Button for Mobile OR Color Dots for Desktop -->
			{#if isMobile}
				<button
					type="button"
					class="open-bible-action-bar-btn"
					class:is-highlighted={Boolean(currentColor)}
					onclick={() => (showMobileDrawer = true)}
					aria-label={t("popover.highlights")}
					title={t("popover.highlights")}
				>
					<span class="open-bible-action-bar-icon" use:icon={"highlighter"}></span>
					<span class="open-bible-action-bar-label">{t("popover.highlights")}</span>
					{#if currentColor}
						<span
							class="open-bible-mobile-current-color-dot"
							style:background-color={resolveHighlightCssColor(currentColor)}
						></span>
					{/if}
				</button>
			{:else}
				<div class="open-bible-action-bar-palette" role="group" aria-label="Cores de destaque">
					{#each configuredHighlights as colorItem (colorItem.id)}
						{@const isSelected = currentColor === colorItem.id || currentColor === colorItem.color}
						{@const cssColor = resolveHighlightCssColor(colorItem.color)}
						<button
							type="button"
							class="open-bible-action-bar-color-dot"
							class:is-active={isSelected}
							style:background-color={cssColor}
							style:--dot-color={cssColor}
							aria-label={`${colorItem.label}`}
							title={`${colorItem.label}`}
							onclick={() => onHighlightColor?.(colorItem.id)}
						>
							{#if isSelected}
								<span class="open-bible-color-dot-check" use:icon={"check"}></span>
							{/if}
						</button>
					{/each}

					{#if currentColor && onRemoveHighlight}
						<button
							type="button"
							class="open-bible-action-bar-remove-hl"
							aria-label={t("popover.removeHighlight")}
							title={t("popover.removeHighlight")}
							onclick={onRemoveHighlight}
						>
							<span use:icon={"trash-2"}></span>
						</button>
					{/if}

					{#if onOpenConfigureHighlights}
						<button
							type="button"
							class="open-bible-action-bar-config-btn"
							aria-label={t("popover.configureHighlights")}
							title={t("popover.configureHighlights")}
							onclick={onOpenConfigureHighlights}
						>
							<span use:icon={"settings"}></span>
						</button>
					{/if}
				</div>
			{/if}

			<div class="open-bible-action-bar-divider" aria-hidden="true"></div>

			<!-- Copy Reference -->
			<button
				type="button"
				class="open-bible-action-bar-btn"
				aria-label={t("popover.copyReference")}
				title={t("popover.copyReference")}
				onclick={onCopyReference}
			>
				<span class="open-bible-action-bar-icon" use:icon={"copy"}></span>
				<span class="open-bible-action-bar-label">{t("popover.copyReference")}</span>
			</button>

			<!-- Copy Text -->
			<button
				type="button"
				class="open-bible-action-bar-btn"
				aria-label={t("popover.copyText")}
				title={t("popover.copyText")}
				onclick={onCopyText}
			>
				<span class="open-bible-action-bar-icon" use:icon={"quote"}></span>
				<span class="open-bible-action-bar-label">{t("popover.copyText")}</span>
			</button>

			<!-- Create Note -->
			<button
				type="button"
				class="open-bible-action-bar-btn mod-cta"
				aria-label={t("popover.createNote")}
				title={t("popover.createNote")}
				onclick={handleCreateNoteClick}
			>
				<span class="open-bible-action-bar-icon" use:icon={"file-plus"}></span>
				<span class="open-bible-action-bar-label">{t("popover.createNote")}</span>
			</button>

			{#if onLinkResource && configuredResources.length > 0}
				<!-- Link Resource -->
				<button
					type="button"
					class="open-bible-action-bar-btn"
					aria-label={t("popover.linkResource")}
					title={t("popover.selectResourceType")}
					onclick={handleLinkResourceClick}
				>
					<span class="open-bible-action-bar-icon" use:icon={"link"}></span>
					<span class="open-bible-action-bar-label">{t("popover.linkResource")}</span>
				</button>
			{/if}

			{#if onCompare}
				<!-- Compare Translations -->
				<button
					type="button"
					class="open-bible-action-bar-btn"
					aria-label={t("popover.compare")}
					title={t("popover.compare")}
					onclick={onCompare}
				>
					<span class="open-bible-action-bar-icon" use:icon={"columns"}></span>
					<span class="open-bible-action-bar-label">{t("popover.compare")}</span>
				</button>
			{/if}
		</div>

		<!-- Pinned Close Button -->
		<div class="open-bible-action-bar-pinned-end">
			<button
				type="button"
				class="open-bible-action-bar-close"
				aria-label={t("popover.close")}
				title={t("popover.close")}
				onclick={onClose}
			>
				<span use:icon={"x"}></span>
			</button>
		</div>
	</div>
</div>

{#if showMobileDrawer}
	<HighlightsDrawer
		{reference}
		highlights={configuredHighlights}
		{currentColor}
		onSelectHighlight={(colorId) => onHighlightColor?.(colorId)}
		{onRemoveHighlight}
		onOpenSettings={onOpenConfigureHighlights}
		onClose={() => (showMobileDrawer = false)}
	/>
{/if}
