<script lang="ts">
	import type { Snippet } from "svelte";
	import Drawer from "../../kit/Drawer.svelte";
	import type { UiDrawerSize } from "../../kit/types";

	interface Props {
		mode: UiDrawerSize;
		onClose: () => void;
		children?: Snippet;
	}

	let { mode, onClose, children }: Props = $props();
</script>

<Drawer size={mode} {onClose}>
	{@render children?.()}
</Drawer>
