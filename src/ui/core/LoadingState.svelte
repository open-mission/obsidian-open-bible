<script lang="ts">
	import { t } from "../../i18n";

	interface Props {
		message?: string;
	}

	let { message }: Props = $props();

	// Localized default, kept reactive so the label follows locale changes.
	let label = $derived(message ?? t("common.loading"));
</script>

<div class="ob-loading">{label}</div>

<style>
	.ob-loading {
		padding: 16px;
		text-align: center;
		color: var(--text-muted);
		font-size: var(--font-ui-small);
	}
</style>
