<script lang="ts">
	import { onMount } from "svelte";
	import { Notice } from "obsidian";
	import { t } from "./i18n";
	import type OpenBiblePlugin from "./main";
	import { LOGO_COMPLETE } from "./assets/logos";
	import { icon } from "./ui/actions/icon";
	import Button from "./ui/kit/Button.svelte";
	import EmptyState from "./ui/kit/EmptyState.svelte";
	import IconButton from "./ui/kit/IconButton.svelte";
	import SearchField from "./ui/kit/SearchField.svelte";
	import {
		GUIDE_CONTEXT_IDS,
		groupGuideCapabilities,
		resolveGuideCapabilities,
		searchGuideCapabilities,
		type GuideAction,
		type GuideCapability,
		type GuideContextFilter,
	} from "./ui/guide/capabilityCatalog";

	interface Props {
		plugin: OpenBiblePlugin;
	}

	let { plugin }: Props = $props();

	let query = $state("");
	let contextFilter = $state<GuideContextFilter>("all");
	let selectedCapabilityId = $state<string | null>(null);
	let searchInputEl = $state<HTMLInputElement | null>(null);
	let guideScrollEl = $state<HTMLElement | null>(null);
	let detailHeadingEl = $state<HTMLHeadingElement | null>(null);
	let returnCapabilityId = "";
	let returnScrollTop = 0;
	let editorRevision = $state(0);
	let versionCount = $state(0);
	let isLoadingVersions = $state(true);
	let isRefreshingVersions = $state(false);
	let versionError = $state<string | null>(null);
	let busyActionId = $state<string | null>(null);
	let actionError = $state<string | null>(null);

	const capabilities = $derived.by(() => {
		editorRevision;
		return resolveGuideCapabilities(plugin, versionCount > 0);
	});
	const filteredCapabilities = $derived(
		searchGuideCapabilities(capabilities, query, contextFilter),
	);
	const groupedCapabilities = $derived(groupGuideCapabilities(filteredCapabilities));
	const selectedCapability = $derived(
		selectedCapabilityId
			? capabilities.find((capability) => capability.id === selectedCapabilityId) ?? null
			: null,
	);
	const isFiltering = $derived(query.trim().length > 0 || contextFilter !== "all");
	const featuredCapabilities = $derived(
		capabilities.filter((capability) => capability.featured).slice(0, 4),
	);
	const setupCapabilities = $derived(
		capabilities.filter((capability) =>
			["bible-versions", "data-folder", "language", "open-reader"].includes(capability.id),
		),
	);
	const relatedCapabilities = $derived(
		selectedCapability
			? selectedCapability.relatedIds
					.map((id) => capabilities.find((capability) => capability.id === id))
					.filter((capability): capability is GuideCapability => Boolean(capability))
			: [],
	);

	async function refreshVersions(showLoading = false): Promise<void> {
		if (showLoading) {
			isLoadingVersions = true;
		} else {
			isRefreshingVersions = true;
		}
		versionError = null;
		try {
			const versions = await plugin.bibleVersions.listVersions();
			versionCount = versions.length;
		} catch (error) {
			console.error("OpenBible: could not list Bible versions for the guide", error);
			versionError = t("guide.errors.loadVersions");
		} finally {
			isLoadingVersions = false;
			isRefreshingVersions = false;
		}
	}

	export function refresh(): Promise<void> {
		return refreshVersions(false);
	}

	onMount(() => {
		void refreshVersions(true);
		const handleWindowFocus = () => void refreshVersions(false);
		const handleEditorContextChange = () => {
			editorRevision += 1;
		};
		const activeLeafRef = plugin.app.workspace.on("active-leaf-change", handleEditorContextChange);
		const layoutRef = plugin.app.workspace.on("layout-change", handleEditorContextChange);
		window.addEventListener("focus", handleWindowFocus);
		return () => {
			window.removeEventListener("focus", handleWindowFocus);
			plugin.app.workspace.offref(activeLeafRef);
			plugin.app.workspace.offref(layoutRef);
		};
	});

	function openCapability(id: string): void {
		if (!selectedCapabilityId) {
			returnCapabilityId = id;
			returnScrollTop = guideScrollEl?.scrollTop ?? 0;
		}
		actionError = null;
		selectedCapabilityId = id;
		requestAnimationFrame(() => {
			guideScrollEl?.scrollTo({ top: 0, behavior: "auto" });
			detailHeadingEl?.focus({ preventScroll: true });
		});
	}

	function closeCapability(): void {
		actionError = null;
		selectedCapabilityId = null;
		requestAnimationFrame(() => {
			const focusTarget = guideScrollEl?.querySelector<HTMLElement>(
				`[data-guide-capability-id="${returnCapabilityId}"]`,
			);
			guideScrollEl?.scrollTo({ top: returnScrollTop, behavior: "auto" });
			focusTarget?.focus({ preventScroll: true });
		});
	}

	function clearFilters(): void {
		query = "";
		contextFilter = "all";
		searchInputEl?.focus();
	}

	async function runAction(action: GuideAction): Promise<void> {
		if (action.disabled) {
			actionError = action.disabledReason ?? t("guide.errors.actionUnavailable");
			return;
		}
		busyActionId = action.id;
		actionError = null;
		try {
			await action.run();
		} catch (error) {
			console.error(`OpenBible: guide action ${action.id} failed`, error);
			actionError = error instanceof Error ? error.message : t("guide.errors.actionFailed");
			new Notice(actionError);
		} finally {
			busyActionId = null;
		}
	}

	function availabilityIcon(capability: GuideCapability): string {
		switch (capability.availability.state) {
			case "ready":
				return "circle-check";
			case "setup":
				return "database-zap";
			case "context":
				return "mouse-pointer-click";
			case "automatic":
				return "sparkles";
		}
	}
</script>

<div class="open-bible-guide">
	<header class="open-bible-guide-header">
		<img class="open-bible-guide-logo" src={LOGO_COMPLETE} alt={t("guide.title")} />
	</header>

	<div class="open-bible-guide-search">
		<SearchField
			bind:value={query}
			bind:inputEl={searchInputEl}
			placeholder={t("guide.searchPlaceholder")}
		/>
		<label class="open-bible-guide-context-filter">
			<span>{t("guide.contextFilterLabel")}</span>
			<select bind:value={contextFilter} aria-label={t("guide.contextFilterLabel")}>
				<option value="all">{t("guide.filters.all")}</option>
				{#each GUIDE_CONTEXT_IDS as contextId (contextId)}
					<option value={contextId}>{t(`guide.contexts.${contextId}`)}</option>
				{/each}
			</select>
		</label>
	</div>

	<div class="open-bible-guide-scroll" bind:this={guideScrollEl}>
		{#if selectedCapability}
			<div class="open-bible-guide-detail-view">
				<div class="open-bible-guide-detail-header">
					<IconButton
						iconName="chevron-left"
						title={t("guide.detail.back")}
						ariaLabel={t("guide.detail.back")}
						onclick={closeCapability}
					/>
					<div class="open-bible-guide-detail-heading">
						<span use:icon={selectedCapability.icon} aria-hidden="true"></span>
						<div>
							<span>{selectedCapability.categoryLabel}</span>
							<h3 bind:this={detailHeadingEl} tabindex="-1">{selectedCapability.title}</h3>
						</div>
					</div>
				</div>

				<div class="open-bible-guide-detail-body">
					<p class="open-bible-guide-detail-summary">{selectedCapability.summary}</p>

					<div class="open-bible-guide-context-list" aria-label={t("guide.detail.contexts")}>
						{#each selectedCapability.contextLabels as contextLabel (contextLabel)}
							<span>{contextLabel}</span>
						{/each}
					</div>

					<div
						class="open-bible-guide-availability"
						data-state={selectedCapability.availability.state}
						role="status"
					>
						<span use:icon={availabilityIcon(selectedCapability)} aria-hidden="true"></span>
						<span>{selectedCapability.availability.label}</span>
					</div>

					<p class="open-bible-guide-detail-copy">{selectedCapability.detail}</p>

					{#if selectedCapability.actions.length > 0}
						<section class="open-bible-guide-detail-section" aria-labelledby="guide-actions-heading">
							<h4 id="guide-actions-heading">{t("guide.detail.actions")}</h4>
							<div class="open-bible-guide-action-list">
								{#each selectedCapability.actions as action (action.id)}
									<Button
										variant={action.tone === "primary" ? "cta" : "default"}
										iconName={action.icon}
										disabled={action.disabled || busyActionId !== null}
										onclick={() => void runAction(action)}
									>
										{busyActionId === action.id ? t("guide.actions.running") : action.label}
									</Button>
								{/each}
							</div>
							{#if actionError}
								<p class="open-bible-guide-action-error" role="alert">{actionError}</p>
							{/if}
						</section>
					{:else}
						<div class="open-bible-guide-information-note">
							<span use:icon={"info"} aria-hidden="true"></span>
							<span>{t("guide.detail.noAction")}</span>
						</div>
					{/if}

					{#if relatedCapabilities.length > 0}
						<section class="open-bible-guide-detail-section" aria-labelledby="guide-related-heading">
							<h4 id="guide-related-heading">{t("guide.detail.related")}</h4>
							<div class="open-bible-guide-related-list">
								{#each relatedCapabilities as related (related.id)}
									<button
										type="button"
										onclick={() => openCapability(related.id)}
									>
										<span class="open-bible-guide-row-icon" use:icon={related.icon} aria-hidden="true"></span>
										<span>
											<strong>{related.title}</strong>
											<small>{related.summary}</small>
										</span>
										<span use:icon={"chevron-right"} aria-hidden="true"></span>
									</button>
								{/each}
							</div>
						</section>
					{/if}
				</div>
			</div>
		{:else if isFiltering}
			<div class="open-bible-guide-results" aria-live="polite">
				<div class="open-bible-guide-section-heading">
					<div>
						<h3>{t("guide.results.title")}</h3>
						<p>{t("guide.results.count", { count: filteredCapabilities.length })}</p>
					</div>
					<button type="button" class="open-bible-guide-clear" onclick={clearFilters}>
						<span use:icon={"rotate-ccw"} aria-hidden="true"></span>
						{t("guide.actions.clearFilters")}
					</button>
				</div>

				{#if filteredCapabilities.length === 0}
					<EmptyState
						iconName="search-x"
						title={t("guide.results.emptyTitle")}
						description={t("guide.results.emptyDescription")}
					/>
				{:else}
					{#each groupedCapabilities as group (group.id)}
						<section class="open-bible-guide-category" aria-labelledby={`guide-group-${group.id}`}>
							<div class="open-bible-guide-category-heading">
								<h4 id={`guide-group-${group.id}`}>{group.label}</h4>
								<span>{group.items.length}</span>
							</div>
							<div class="open-bible-guide-row-list">
								{#each group.items as capability (capability.id)}
									<button
										type="button"
										class="open-bible-guide-row"
										data-guide-capability-id={capability.id}
										onclick={() => openCapability(capability.id)}
									>
										<span class="open-bible-guide-row-icon" use:icon={capability.icon} aria-hidden="true"></span>
										<span class="open-bible-guide-row-copy">
											<strong>{capability.title}</strong>
											<small>{capability.summary}</small>
										</span>
										<span class="open-bible-guide-row-context">{capability.contextLabels[0]}</span>
										<span use:icon={"chevron-right"} aria-hidden="true"></span>
									</button>
								{/each}
							</div>
						</section>
					{/each}
				{/if}
			</div>
		{:else}
			<div class="open-bible-guide-overview">
				<section class="open-bible-guide-start" aria-labelledby="guide-start-heading">
					<div class="open-bible-guide-section-heading">
						<div>
							<h3 id="guide-start-heading">
								{!isLoadingVersions && versionCount === 0
									? t("guide.start.setupTitle")
									: t("guide.start.title")}
							</h3>
							<p>
								{!isLoadingVersions && versionCount === 0
									? t("guide.start.setupDescription")
									: t("guide.start.description")}
							</p>
						</div>
						{#if isRefreshingVersions}
							<span class="open-bible-guide-sync-state">{t("guide.actions.refreshing")}</span>
						{/if}
					</div>

					{#if versionError}
						<div class="open-bible-guide-version-error" role="alert">
							<span use:icon={"triangle-alert"} aria-hidden="true"></span>
							<span>{versionError}</span>
						</div>
					{/if}

					<div class="open-bible-guide-task-list">
						{#each (isLoadingVersions || versionCount > 0 ? featuredCapabilities : setupCapabilities) as capability (capability.id)}
							<button
								type="button"
								class="open-bible-guide-task"
								data-guide-capability-id={capability.id}
								onclick={() => openCapability(capability.id)}
							>
								<span class="open-bible-guide-task-icon" use:icon={capability.icon} aria-hidden="true"></span>
								<span>
									<strong>{capability.title}</strong>
									<small>{capability.summary}</small>
								</span>
								<span use:icon={"arrow-right"} aria-hidden="true"></span>
							</button>
						{/each}
					</div>
				</section>

				<section class="open-bible-guide-reference" aria-labelledby="guide-reference-heading">
					<div class="open-bible-guide-section-heading">
						<div>
							<h3 id="guide-reference-heading">{t("guide.reference.title")}</h3>
							<p>{t("guide.reference.description")}</p>
						</div>
						<span class="open-bible-guide-capability-count">
							{t("guide.reference.count", { count: capabilities.length })}
						</span>
					</div>

					{#each groupGuideCapabilities(capabilities) as group (group.id)}
						<section class="open-bible-guide-category" aria-labelledby={`guide-overview-${group.id}`}>
							<div class="open-bible-guide-category-heading">
								<h4 id={`guide-overview-${group.id}`}>{group.label}</h4>
								<span>{group.items.length}</span>
							</div>
							<div class="open-bible-guide-row-list">
								{#each group.items as capability (capability.id)}
									<button
										type="button"
										class="open-bible-guide-row"
										data-guide-capability-id={capability.id}
										onclick={() => openCapability(capability.id)}
									>
										<span class="open-bible-guide-row-icon" use:icon={capability.icon} aria-hidden="true"></span>
										<span class="open-bible-guide-row-copy">
											<strong>{capability.title}</strong>
											<small>{capability.summary}</small>
										</span>
										<span class="open-bible-guide-row-context">{capability.contextLabels.join(" · ")}</span>
										<span use:icon={"chevron-right"} aria-hidden="true"></span>
									</button>
								{/each}
							</div>
						</section>
					{/each}
				</section>
			</div>
		{/if}
	</div>
</div>
