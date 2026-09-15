<script lang="ts">
	import { t } from "../../../i18n";
	import type { SectionContext } from "../types";
	import EmptyState from "../../core/EmptyState.svelte";

	let _context: SectionContext = $props();
</script>

<div class="ob-section-placeholder">
	<EmptyState
		message={t("settings.studySectionPlaceholder")}
		hint={t("settings.studySectionPlaceholderDesc")}
	/>
</div>

<style>
	.ob-section-placeholder {
		padding: 16px 0;
	}
</style>
