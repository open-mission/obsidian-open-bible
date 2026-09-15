<script lang="ts">
	import type { CrossReference } from "../../../data/crossRefModel";
	import { t } from "../../../i18n";
	import IconButton from "../../kit/IconButton.svelte";
	import { openThompsonXrefMenu } from "../../resources/openThompsonXrefMenu";

	interface Props {
		refs: CrossReference[];
		onSelectRef: (ref: CrossReference, event: MouseEvent) => void;
	}

	let { refs, onSelectRef }: Props = $props();

	const ariaLabel = $derived(
		refs.length === 1
			? (t("resources.countSingle") || "1 referência")
			: (t("resources.countPlural", { count: refs.length }) || `${refs.length} referências`),
	);
</script>

<div class="open-bible-thompson-margin-gutter">
	<IconButton
		iconName="link-2"
		class="open-bible-thompson-xref-trigger"
		title={ariaLabel}
		ariaLabel={ariaLabel}
		onclick={(event) => openThompsonXrefMenu(event, refs, onSelectRef)}
	/>
</div>
