<script lang="ts">
	import { Notice } from "obsidian";
	import { t } from "../../../i18n";
	import type { SectionContext } from "../types";
	import {
		DEFAULT_RESOURCE_TYPES,
		type ResourceDisplayStyle,
		type ResourceHoverModifier,
		type ResourceOpenMode,
		type ResourceWorkspaceSplit,
		type ResourceTypeConfig,
	} from "../../../settings";
	import { ALL_RESOURCE_ICONS, RESOURCE_ICON_GROUPS } from "../resourceIcons";
	import { icon } from "../../actions/icon";
	import Toggle from "../../kit/Toggle.svelte";

	let { settings, updateGeneral }: SectionContext = $props();

	let resourceTypes = $state<ResourceTypeConfig[]>([]);

	$effect(() => {
		resourceTypes =
			settings.configuredResources && settings.configuredResources.length > 0
				? [...settings.configuredResources]
				: [...DEFAULT_RESOURCE_TYPES];
	});

	function slugify(label: string): string {
		return (
			label
				.trim()
				.toLowerCase()
				.normalize("NFD")
				.replace(/[\u0300-\u036f]/g, "")
				.replace(/[^a-z0-9]+/g, "_")
				.replace(/^_+|_+$/g, "")
				.slice(0, 40) || `res_${Date.now().toString(36)}`
		);
	}

	async function handleAddType() {
		const label = t("settings.newResourceTypeDefaultLabel");
		let id = slugify(label);
		let counter = 1;
		while (resourceTypes.some((r) => r.id === id)) {
			id = `${slugify(label)}_${counter++}`;
		}
		const next: ResourceTypeConfig = {
			id,
			label,
			folder: `OpenBible/resources/${id}`,
			icon: "link",
			color: "#8b5cf6",
		};
		resourceTypes = [...resourceTypes, next];
		await updateGeneral({ configuredResources: resourceTypes });
		new Notice(t("settings.resourceAddedNotice"));
	}

	async function handleUpdate(id: string, patch: Partial<ResourceTypeConfig>) {
		resourceTypes = resourceTypes.map((r) => (r.id === id ? { ...r, ...patch } : r));
		await updateGeneral({ configuredResources: resourceTypes });
	}

	async function handleDelete(id: string) {
		if (resourceTypes.length <= 1) {
			new Notice(t("settings.cannotDeleteLastResourceType"));
			return;
		}
		resourceTypes = resourceTypes.filter((r) => r.id !== id);
		await updateGeneral({ configuredResources: resourceTypes });
		new Notice(t("settings.resourceRemovedNotice"));
	}

	async function handleResetDefaults() {
		resourceTypes = [...DEFAULT_RESOURCE_TYPES];
		await updateGeneral({ configuredResources: resourceTypes });
		new Notice(t("settings.resourcesResetNotice"));
	}
</script>

<div class="open-bible-settings-notes-section">
	<div class="setting-item">
		<div class="setting-item-info">
			<div class="setting-item-name">{t("settings.resourceOpenModeName")}</div>
			<div class="setting-item-description">{t("settings.resourceOpenModeDesc")}</div>
		</div>
		<div class="setting-item-control">
			<select
				class="dropdown"
				value={settings.resourceOpenMode ?? "reader"}
				aria-label={t("settings.resourceOpenModeName")}
				onchange={(e) =>
					void updateGeneral({ resourceOpenMode: e.currentTarget.value as ResourceOpenMode })}
			>
				<option value="reader">{t("settings.resourceOpenModeReader")}</option>
				<option value="workspace">{t("settings.resourceOpenModeWorkspace")}</option>
				<option value="modal">{t("settings.resourceOpenModeModal")}</option>
			</select>
		</div>
	</div>

	{#if (settings.resourceOpenMode ?? "reader") === "workspace"}
		<div class="setting-item">
			<div class="setting-item-info">
				<div class="setting-item-name">{t("settings.resourceWorkspaceSplitName")}</div>
				<div class="setting-item-description">{t("settings.resourceWorkspaceSplitDesc")}</div>
			</div>
			<div class="setting-item-control">
				<select
					class="dropdown"
					value={settings.resourceWorkspaceSplit ?? "right"}
					aria-label={t("settings.resourceWorkspaceSplitName")}
					onchange={(e) =>
						void updateGeneral({ resourceWorkspaceSplit: e.currentTarget.value as ResourceWorkspaceSplit })}
				>
					<option value="right">{t("settings.resourceWorkspaceSplitRight")}</option>
					<option value="split">{t("settings.resourceWorkspaceSplitSplit")}</option>
					<option value="tab">{t("settings.resourceWorkspaceSplitTab")}</option>
				</select>
			</div>
		</div>
	{/if}

	<div class="setting-item">
		<div class="setting-item-info">
			<div class="setting-item-name">{t("settings.resourceDisplayStyleName")}</div>
			<div class="setting-item-description">{t("settings.resourceDisplayStyleDesc")}</div>
		</div>
		<div class="setting-item-control">
			<select
				class="dropdown"
				value={settings.resourceDisplayStyle ?? "icon"}
				aria-label={t("settings.resourceDisplayStyleName")}
				onchange={(e) =>
					void updateGeneral({ resourceDisplayStyle: e.currentTarget.value as ResourceDisplayStyle })}
			>
				<option value="icon">{t("settings.resourceDisplayIcon")}</option>
				<option value="underline">{t("settings.resourceDisplayUnderline")}</option>
				<option value="both">{t("settings.resourceDisplayBoth")}</option>
			</select>
		</div>
	</div>

	<div class="setting-item">
		<div class="setting-item-info">
			<div class="setting-item-name">{t("settings.resourceHoverModifierName")}</div>
			<div class="setting-item-description">{t("settings.resourceHoverModifierDesc")}</div>
		</div>
		<div class="setting-item-control">
			<select
				class="dropdown"
				value={settings.resourceHoverModifier ?? "shift"}
				aria-label={t("settings.resourceHoverModifierName")}
				onchange={(e) =>
					void updateGeneral({ resourceHoverModifier: e.currentTarget.value as ResourceHoverModifier })}
			>
				<option value="shift">{t("settings.verseHoverModifierShift")}</option>
				<option value="ctrlCmd">{t("settings.verseHoverModifierCtrlCmd")}</option>
				<option value="alt">{t("settings.verseHoverModifierAlt")}</option>
				<option value="none">{t("settings.verseHoverModifierNone")}</option>
			</select>
		</div>
	</div>

	<div class="setting-item">
		<div class="setting-item-info">
			<div class="setting-item-name">{t("settings.resourceColorizeName")}</div>
			<div class="setting-item-description">{t("settings.resourceColorizeDesc")}</div>
		</div>
		<div class="setting-item-control">
			<Toggle
				checked={settings.resourceColorize ?? true}
				onchange={(val) => void updateGeneral({ resourceColorize: val })}
			/>
		</div>
	</div>

	<div class="setting-item-heading">
		<div class="setting-item-name">{t("settings.resourceTypesHeading")}</div>
		<div class="setting-item-description">{t("settings.resourceTypesDesc")}</div>
	</div>

	<div class="open-bible-settings-highlights-list">
		{#each resourceTypes as resType (resType.id)}
			<div class="open-bible-settings-highlight-row open-bible-settings-resource-row">
				<div class="open-bible-settings-color-wrapper">
					<span class="open-bible-settings-color-preview" style:background-color={resType.color}></span>
					<input
						type="color"
						class="open-bible-settings-color-input"
						value={resType.color.startsWith("#") ? resType.color : "#8b5cf6"}
						title={t("settings.chooseColor")}
						onchange={(e) => handleUpdate(resType.id, { color: (e.target as HTMLInputElement).value })}
					/>
				</div>

				<input
					type="text"
					class="text-input open-bible-settings-label-input"
					value={resType.label}
					placeholder={t("settings.resourceLabelPlaceholder")}
					onchange={(e) => handleUpdate(resType.id, { label: (e.target as HTMLInputElement).value })}
				/>

				<input
					type="text"
					class="text-input open-bible-settings-label-input"
					value={resType.folder}
					placeholder={t("settings.resourceFolderPlaceholder")}
					title={t("settings.resourceFolderPlaceholder")}
					onchange={(e) => handleUpdate(resType.id, { folder: (e.target as HTMLInputElement).value })}
				/>

				<div class="open-bible-settings-icon-select-wrap" title={t("settings.resourceIconPlaceholder")}>
					<span class="open-bible-settings-icon-preview" use:icon={resType.icon}></span>
					<select
						class="dropdown open-bible-settings-icon-select"
						value={ALL_RESOURCE_ICONS.includes(resType.icon) ? resType.icon : ""}
						aria-label={t("settings.resourceIconPlaceholder")}
						onchange={(e) => {
							const val = (e.target as HTMLSelectElement).value;
							if (val) handleUpdate(resType.id, { icon: val });
						}}
					>
						{#if !ALL_RESOURCE_ICONS.includes(resType.icon)}
							<option value="" selected>{resType.icon} ({t("settings.resourceIconPlaceholder")})</option>
						{/if}
						{#each RESOURCE_ICON_GROUPS as group (group.group)}
							<optgroup label={group.group}>
								{#each group.icons as opt (opt.value)}
									<option value={opt.value}>{opt.label}</option>
								{/each}
							</optgroup>
						{/each}
					</select>
				</div>

				<button
					type="button"
					class="clickable-icon open-bible-settings-delete-btn"
					aria-label={t("common.delete")}
					title={t("common.delete")}
					onclick={() => handleDelete(resType.id)}
				>
					<span use:icon={"trash-2"}></span>
				</button>
			</div>
			<div class="open-bible-settings-resource-id">id: {resType.id}</div>
		{/each}
	</div>

	<div class="open-bible-settings-actions-row">
		<button type="button" class="open-bible-ui-btn mod-cta is-small" onclick={handleAddType}>
			<span use:icon={"plus"}></span>
			<span>{t("settings.addResourceTypeBtn")}</span>
		</button>
		<button type="button" class="open-bible-ui-btn is-ghost is-small" onclick={handleResetDefaults}>
			<span use:icon={"rotate-ccw"}></span>
			<span>{t("settings.resetResourceTypesBtn")}</span>
		</button>
	</div>
</div>
