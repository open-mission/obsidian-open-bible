<script lang="ts">
	import { ToggleComponent } from "obsidian";

	interface Props {
		checked: boolean;
		disabled?: boolean;
		ariaLabel?: string;
		onchange: (checked: boolean) => void;
	}

	interface ToggleParams {
		checked: boolean;
		disabled?: boolean;
		ariaLabel?: string;
	}

	let props: Props = $props();

	function mountToggle(node: HTMLElement, initialParams: ToggleParams) {
		const toggle = new ToggleComponent(node);
		toggle.setValue(initialParams.checked);
		toggle.setDisabled(Boolean(initialParams.disabled));
		if (initialParams.ariaLabel) {
			toggle.toggleEl.setAttribute("aria-label", initialParams.ariaLabel);
		}
		toggle.onChange((val) => {
			props.onchange(val);
		});

		return {
			update(newParams: ToggleParams) {
				if (toggle.getValue() !== newParams.checked) {
					toggle.setValue(newParams.checked);
				}
				toggle.setDisabled(Boolean(newParams.disabled));
				if (newParams.ariaLabel) {
					toggle.toggleEl.setAttribute("aria-label", newParams.ariaLabel);
				}
			},
		};
	}
</script>

<span
	class="open-bible-toggle-host"
	use:mountToggle={{ checked: props.checked, disabled: props.disabled, ariaLabel: props.ariaLabel }}
></span>

<style>
	.open-bible-toggle-host {
		display: inline-flex;
		align-items: center;
	}
</style>
