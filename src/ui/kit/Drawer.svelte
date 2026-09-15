<script lang="ts">
	import { onMount } from "svelte";
	import type { Snippet } from "svelte";
	import { portal } from "../actions/portal";
	import type { UiDrawerSize } from "./types";

	interface Props {
		size: UiDrawerSize;
		onClose: () => void;
		ignoreCloseSelector?: string;
		children?: Snippet;
	}

	let {
		size,
		onClose,
		ignoreCloseSelector = ".open-bible-reader-pill-btn",
		children,
	}: Props = $props();

	let containerEl = $state<HTMLElement | undefined>();
	let touchStartY = 0;
	let isDraggingDrawer = false;

	function handleTouchStart(e: TouchEvent) {
		const target = e.target as HTMLElement | null;
		if (
			target?.closest(".open-bible-drawer-handle") ||
			target?.closest(".open-bible-picker-header")
		) {
			touchStartY = e.touches[0].clientY;
			isDraggingDrawer = true;
		}
	}

	function handleTouchMove(e: TouchEvent) {
		if (!isDraggingDrawer || !containerEl) return;
		const currentY = e.touches[0].clientY;
		const deltaY = currentY - touchStartY;
		if (deltaY > 0) {
			containerEl.style.transform = `translateY(${deltaY}px)`;
			containerEl.style.transition = "none";
		}
	}

	function handleTouchEnd(e: TouchEvent) {
		if (!isDraggingDrawer || !containerEl) return;
		isDraggingDrawer = false;
		const currentY = e.changedTouches[0].clientY;
		const deltaY = currentY - touchStartY;
		if (deltaY > 50) {
			onClose();
		} else {
			containerEl.style.transition = "transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)";
			containerEl.style.transform = "";
		}
	}

	onMount(() => {
		function onKeyDown(e: KeyboardEvent) {
			if (e.key === "Escape") {
				e.preventDefault();
				onClose();
			}
		}

		function onClickOutside(e: MouseEvent) {
			const target = e.target as Node | null;
			if (!target) return;
			if (containerEl?.contains(target)) return;
			if (ignoreCloseSelector && (target as HTMLElement).closest?.(ignoreCloseSelector)) {
				return;
			}
			onClose();
		}

		window.addEventListener("keydown", onKeyDown);
		const timeoutId = setTimeout(() => {
			window.addEventListener("click", onClickOutside);
		}, 20);

		return () => {
			window.removeEventListener("keydown", onKeyDown);
			window.removeEventListener("click", onClickOutside);
			clearTimeout(timeoutId);
		};
	});
</script>

<div use:portal class="open-bible-picker-overlay">
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<div
		class="open-bible-picker-backdrop"
		role="presentation"
		onclick={onClose}
		ontouchmove={(e) => e.preventDefault()}
	></div>

	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<div
		bind:this={containerEl}
		class="open-bible-picker-popover is-mode-{size}"
		role="dialog"
		tabindex="-1"
		onclick={(e) => e.stopPropagation()}
		ontouchstart={handleTouchStart}
		ontouchmove={handleTouchMove}
		ontouchend={handleTouchEnd}
	>
		<div class="open-bible-drawer-handle"></div>
		{@render children?.()}
	</div>
</div>
