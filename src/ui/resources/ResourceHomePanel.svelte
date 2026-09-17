<script lang="ts">
	import { onMount } from "svelte";
	import { normalizePath, TFile } from "obsidian";
	import type OpenBiblePlugin from "../../main";
	import type { BibleResourceItem } from "../../models/resource";
	import { t } from "../../i18n";
	import { icon } from "../actions/icon";
	import SearchField from "../kit/SearchField.svelte";
	import EmptyState from "../kit/EmptyState.svelte";
	import IconButton from "../kit/IconButton.svelte";
	import { resolveResourceImageUrl } from "../modals/ResourcePreviewModal";
	import { openNoteInEditor } from "../modals/NotePreviewModal";
	import { CreateResourceModal } from "../modals/CreateResourceModal";

	interface Props {
		plugin: OpenBiblePlugin;
		embedded?: boolean;
		onSelectResource: (resource: BibleResourceItem) => void;
		onOpenInWorkspace?: () => void;
		onClose?: () => void;
		onNavigateToPassage?: (bookName: string, chapter: number, verseNumber?: number, versionAbbr?: string) => void;
	}

	let {
		plugin,
		embedded = false,
		onSelectResource,
		onOpenInWorkspace,
		onClose,
	}: Props = $props();

	let resources = $state<BibleResourceItem[]>([]);
	let searchQuery = $state("");
	let selectedType = $state<string | null>(null);
	let sortBy = $state<"occurrences" | "az" | "za" | "recent">("occurrences");
	let viewLayout = $state<"grouped" | "flat">("grouped");
	let collapsedGroups = $state<Set<string>>(new Set());
	let occurrencesMap = $state<Map<string, number>>(new Map());
	let countsByType = $state<Map<string, number>>(new Map());
	let thumbnails = $state<Map<string, string>>(new Map());

	function loadData() {
		if (!plugin?.resourceService) return;
		const all = plugin.resourceService.getAllResources();
		resources = all;

		const stats = plugin.resourceService.getResourceStats();
		occurrencesMap = stats.occurrencesMap;

		// Count resources per type
		const typeCounts = new Map<string, number>();
		for (const r of all) {
			typeCounts.set(r.resourceType, (typeCounts.get(r.resourceType) ?? 0) + 1);
		}
		countsByType = typeCounts;

		// Resolve image thumbnails
		const thumbMap = new Map<string, string>();
		for (const r of all) {
			if (r.image) {
				const resolved = resolveResourceImageUrl(plugin.app, r.image, r.path);
				if (resolved) {
					thumbMap.set(r.path, resolved);
				}
			} else {
				// Check frontmatter in cache if not already set on item
				const file = plugin.app.vault.getAbstractFileByPath(r.path);
				if (file instanceof TFile) {
					const cache = plugin.app.metadataCache.getFileCache(file);
					const rawImg = cache?.frontmatter?.image || cache?.frontmatter?.cover || cache?.frontmatter?.banner || cache?.frontmatter?.thumbnail;
					if (rawImg) {
						const resolved = resolveResourceImageUrl(plugin.app, String(rawImg), file.path);
						if (resolved) thumbMap.set(r.path, resolved);
					}
				}
			}
		}
		thumbnails = thumbMap;
	}

	onMount(() => {
		loadData();
		const unsub = plugin.resourceService?.subscribe(() => {
			loadData();
		});
		return unsub;
	});

	let resourceTypes = $derived(plugin.resourceService?.getResourceTypes() ?? []);

	let filteredResources = $derived.by(() => {
		let list = resources;
		if (selectedType) {
			list = list.filter((r) => r.resourceType === selectedType);
		}
		const q = searchQuery.trim().toLowerCase();
		if (q) {
			list = list.filter((r) => {
				return (
					r.name.toLowerCase().includes(q) ||
					r.title.toLowerCase().includes(q) ||
					r.path.toLowerCase().includes(q)
				);
			});
		}

		// Sorting
		const sorted = [...list];
		if (sortBy === "occurrences") {
			sorted.sort((a, b) => {
				const countA = occurrencesMap.get(normalizePath(a.path)) ?? 0;
				const countB = occurrencesMap.get(normalizePath(b.path)) ?? 0;
				if (countB !== countA) return countB - countA;
				return a.name.localeCompare(b.name, "pt-BR");
			});
		} else if (sortBy === "az") {
			sorted.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
		} else if (sortBy === "za") {
			sorted.sort((a, b) => b.name.localeCompare(a.name, "pt-BR"));
		} else if (sortBy === "recent") {
			sorted.sort((a, b) => (b.mtime ?? 0) - (a.mtime ?? 0));
		}
		return sorted;
	});

	interface ResourceGroup {
		typeId: string;
		label: string;
		icon: string;
		color: string;
		items: BibleResourceItem[];
	}

	let groupedResources = $derived.by<ResourceGroup[]>(() => {
		if (filteredResources.length === 0) return [];
		const groups: ResourceGroup[] = [];
		const seenTypes = new Set<string>();

		for (const resType of resourceTypes) {
			if (selectedType && resType.id !== selectedType) continue;
			const items = filteredResources.filter((r) => r.resourceType === resType.id);
			if (items.length > 0) {
				groups.push({
					typeId: resType.id,
					label: resType.label,
					icon: resType.icon,
					color: resType.color,
					items,
				});
				seenTypes.add(resType.id);
			}
		}

		for (const item of filteredResources) {
			if (!seenTypes.has(item.resourceType)) {
				const items = filteredResources.filter((r) => r.resourceType === item.resourceType);
				groups.push({
					typeId: item.resourceType,
					label: item.resourceType,
					icon: "link",
					color: "var(--interactive-accent)",
					items,
				});
				seenTypes.add(item.resourceType);
			}
		}

		return groups;
	});

	function getTypeConfig(typeId: string) {
		return resourceTypes.find((r) => r.id === typeId);
	}

	function handleCreateResource(typeId?: string) {
		new CreateResourceModal(
			plugin.app,
			plugin,
			(created) => {
				loadData();
				onSelectResource(created);
			},
			typeId ?? selectedType ?? undefined,
		).open();
	}

	function handleOpenEditor(e: MouseEvent, item: BibleResourceItem) {
		e.stopPropagation();
		void openNoteInEditor(plugin.app, item.path);
	}

	function toggleGroupCollapse(typeId: string) {
		const next = new Set(collapsedGroups);
		if (next.has(typeId)) {
			next.delete(typeId);
		} else {
			next.add(typeId);
		}
		collapsedGroups = next;
	}

	function toggleAllGroups() {
		if (collapsedGroups.size > 0) {
			collapsedGroups = new Set();
		} else {
			collapsedGroups = new Set(groupedResources.map((g) => g.typeId));
		}
	}
</script>

<div class="open-bible-resource-hub-panel" class:is-embedded={embedded}>
	<!-- Header -->
	<div class="open-bible-resource-hub-header">
		<div class="open-bible-resource-hub-header-main">
			<div class="open-bible-resource-hub-header-icon" use:icon={"layout-grid"}></div>
			<div class="open-bible-resource-hub-header-text">
				<h2 class="open-bible-resource-hub-title">{t("resources.hubTitle") || "Central de Recursos"}</h2>
				<span class="open-bible-resource-hub-subtitle">
					{#if resources.length === 1}
						{t("resources.hubSubtitleSingle", { count: 1 }) || "1 recurso cadastrado"}
					{:else}
						{t("resources.hubSubtitlePlural", { count: resources.length, types: resourceTypes.length }) || `${resources.length} recursos em ${resourceTypes.length} categorias`}
					{/if}
				</span>
			</div>
		</div>

		<div class="open-bible-resource-hub-actions">
			<button
				type="button"
				class="open-bible-ui-btn is-small is-primary open-bible-hub-create-btn"
				onclick={() => handleCreateResource()}
				title={t("resources.hubCreateResourceBtn") || "Novo recurso"}
			>
				<span use:icon={"plus"}></span>
				<span class="open-bible-btn-text">{t("resources.hubCreateResourceBtn") || "Novo recurso"}</span>
			</button>

			{#if embedded && onOpenInWorkspace}
				<button
					type="button"
					class="clickable-icon open-bible-secondary-action-btn"
					aria-label={t("resources.openInWorkspaceTab") || "Abrir em aba separada"}
					title={t("resources.openInWorkspaceTab") || "Abrir em aba separada"}
					onclick={onOpenInWorkspace}
				>
					<span use:icon={"external-link"}></span>
				</button>
			{/if}

			{#if onClose}
				<button
					type="button"
					class="clickable-icon open-bible-secondary-action-btn mod-close"
					aria-label={t("resources.closeSecondaryPanel") || "Fechar painel"}
					title={t("resources.closeSecondaryPanel") || "Fechar painel"}
					onclick={onClose}
				>
					<span use:icon={"x"}></span>
				</button>
			{/if}
		</div>
	</div>

	<!-- Controls: Search + Chips + Sort -->
	<div class="open-bible-resource-hub-controls">
		<!-- Search Field -->
		<div class="open-bible-resource-hub-search">
			<SearchField
				placeholder={t("resources.hubSearchPlaceholder") || "Buscar por nome, título ou tags..."}
				bind:value={searchQuery}
			/>
		</div>

		<!-- Category Chips -->
		<div class="open-bible-resource-hub-chips" role="toolbar" aria-label="Filtro por tipo de recurso">
			<button
				type="button"
				class="open-bible-hub-chip"
				class:is-active={selectedType === null}
				onclick={() => (selectedType = null)}
			>
				<span>{t("resources.hubAllTypes") || "Todos"}</span>
				<span class="open-bible-hub-chip-count">{resources.length}</span>
			</button>

			{#each resourceTypes as resType (resType.id)}
				{@const count = countsByType.get(resType.id) ?? 0}
				<button
					type="button"
					class="open-bible-hub-chip"
					class:is-active={selectedType === resType.id}
					onclick={() => {
						selectedType = selectedType === resType.id ? null : resType.id;
					}}
				>
					<span class="open-bible-hub-chip-dot" style:background-color={resType.color}></span>
					<span use:icon={resType.icon}></span>
					<span>{resType.label}</span>
					<span class="open-bible-hub-chip-count">{count}</span>
				</button>
			{/each}
		</div>

		<!-- Sort Bar & View Layout Toggle -->
		<div class="open-bible-resource-hub-sort-row">
			<span class="open-bible-resource-hub-sort-label">
				<span use:icon={"arrow-up-down"}></span>
				<span>{filteredResources.length} {filteredResources.length === 1 ? "recurso" : "recursos"}</span>
			</span>

			<div class="open-bible-resource-hub-sort-actions">
				<div class="open-bible-resource-hub-sort-select-wrap">
					<select
						class="dropdown open-bible-resource-hub-sort-select"
						bind:value={sortBy}
						aria-label="Ordenar recursos"
					>
						<option value="occurrences">{t("resources.hubSortOccurrences") || "Mais citados na Bíblia"}</option>
						<option value="az">{t("resources.hubSortAz") || "Nome (A-Z)"}</option>
						<option value="za">{t("resources.hubSortZa") || "Nome (Z-A)"}</option>
						<option value="recent">{t("resources.hubSortRecent") || "Atualizados recentemente"}</option>
					</select>
				</div>

				<div class="open-bible-hub-layout-toggle" role="group" aria-label="Modo de visualização">
					<button
						type="button"
						class="open-bible-hub-layout-btn"
						class:is-active={viewLayout === "grouped"}
						title={t("resources.hubViewGrouped") || "Agrupado por categoria"}
						aria-label={t("resources.hubViewGrouped") || "Agrupado por categoria"}
						onclick={() => (viewLayout = "grouped")}
					>
						<span use:icon={"layers"}></span>
					</button>
					<button
						type="button"
						class="open-bible-hub-layout-btn"
						class:is-active={viewLayout === "flat"}
						title={t("resources.hubViewFlat") || "Grade contínua"}
						aria-label={t("resources.hubViewFlat") || "Grade contínua"}
						onclick={() => (viewLayout = "flat")}
					>
						<span use:icon={"layout-grid"}></span>
					</button>
				</div>

				{#if viewLayout === "grouped"}
					<button
						type="button"
						class="clickable-icon open-bible-hub-collapse-all-btn"
						title={collapsedGroups.size > 0 ? (t("resources.expandAll") || "Expandir todos") : (t("resources.collapseAll") || "Recolher todos")}
						aria-label={collapsedGroups.size > 0 ? (t("resources.expandAll") || "Expandir todos") : (t("resources.collapseAll") || "Recolher todos")}
						onclick={toggleAllGroups}
					>
						<span use:icon={collapsedGroups.size > 0 ? "chevrons-down-up" : "chevrons-up-down"}></span>
					</button>
				{/if}
			</div>
		</div>
	</div>

	<!-- Reusable Resource Card Snippet -->
	{#snippet resourceCard(item: BibleResourceItem)}
		{@const typeConfig = getTypeConfig(item.resourceType)}
		{@const thumbUrl = thumbnails.get(item.path)}
		{@const occCount = occurrencesMap.get(normalizePath(item.path)) ?? 0}
		{@const typeColor = typeConfig?.color || "var(--interactive-accent)"}
		{@const typeIcon = typeConfig?.icon || "link"}

		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<div
			class="open-bible-resource-hub-card"
			role="button"
			tabindex="0"
			onclick={() => onSelectResource(item)}
			onkeydown={(e) => {
				if (e.key === "Enter" || e.key === " ") {
					e.preventDefault();
					onSelectResource(item);
				}
			}}
		>
			<!-- Media / Avatar -->
			<div class="open-bible-resource-hub-card-media">
				{#if thumbUrl}
					<img
						src={thumbUrl}
						alt={item.name}
						class="open-bible-resource-hub-card-img"
						loading="lazy"
					/>
					<div class="open-bible-resource-hub-card-img-overlay"></div>
				{:else}
					<div
						class="open-bible-resource-hub-card-placeholder"
						style="--card-color: {typeColor};"
					>
						<span use:icon={typeIcon}></span>
					</div>
				{/if}

				<div
					class="open-bible-resource-hub-card-type-badge"
					style="--badge-color: {typeColor};"
					title={typeConfig?.label || item.resourceType}
				>
					<span use:icon={typeIcon}></span>
					<span>{typeConfig?.label || item.resourceType}</span>
				</div>
			</div>

			<!-- Content -->
			<div class="open-bible-resource-hub-card-body">
				<h4 class="open-bible-resource-hub-card-name" title={item.name}>
					{item.name}
				</h4>

				<div class="open-bible-resource-hub-card-meta">
					<span class="open-bible-resource-hub-card-occ">
						<span use:icon={"book-open"}></span>
						{#if occCount === 1}
							<span>{t("resources.hubOccurrencesCountSingle") || "1 passagem"}</span>
						{:else if occCount > 1}
							<span>{t("resources.hubOccurrencesCountPlural", { count: occCount }) || `${occCount} passagens`}</span>
						{:else}
							<span class="is-zero">{t("resources.hubNoOccurrencesYet") || "Sem vínculos"}</span>
						{/if}
					</span>
				</div>
			</div>

			<!-- Quick Editor Link -->
			<div class="open-bible-resource-hub-card-actions">
				<IconButton
					iconName="file-text"
					class="open-bible-resource-hub-card-btn"
					title={t("note.openInEditor") || "Abrir nota"}
					ariaLabel={t("note.openInEditor") || "Abrir nota"}
					onclick={(e: MouseEvent) => handleOpenEditor(e, item)}
				/>
			</div>
		</div>
	{/snippet}

	<!-- Scrollable Cards Body -->
	<div class="open-bible-resource-hub-scrollable">
		{#if resources.length === 0}
			<div class="open-bible-resource-hub-empty">
				<EmptyState
					iconName="layout-grid"
					title={t("resources.hubEmptyTitle") || "Nenhum recurso de estudo criado"}
					description={t("resources.hubEmptyDesc") || "Cadastre pessoas, lugares ou tópicos bíblicos para enriquecer seu estudo da Palavra."}
				/>
				<button
					type="button"
					class="open-bible-ui-btn is-primary open-bible-hub-empty-action"
					onclick={() => handleCreateResource()}
				>
					<span use:icon={"plus"}></span>
					<span>{t("resources.hubCreateResourceBtn") || "Criar primeiro recurso"}</span>
				</button>
			</div>
		{:else if filteredResources.length === 0}
			<div class="open-bible-resource-hub-no-results">
				<p>{t("resources.hubNoResults") || "Nenhum recurso encontrado para esta busca."}</p>
			</div>
		{:else if viewLayout === "grouped"}
			<div class="open-bible-resource-hub-groups">
				{#each groupedResources as group (group.typeId)}
					{@const isCollapsed = collapsedGroups.has(group.typeId)}
					<div class="open-bible-resource-hub-group" class:is-collapsed={isCollapsed}>
						<div
							class="open-bible-resource-hub-group-header"
							role="button"
							tabindex="0"
							aria-expanded={!isCollapsed}
							onclick={() => toggleGroupCollapse(group.typeId)}
							onkeydown={(e) => {
								if (e.key === "Enter" || e.key === " ") {
									e.preventDefault();
									toggleGroupCollapse(group.typeId);
								}
							}}
						>
							<div class="open-bible-resource-hub-group-title">
								<span
									class="open-bible-resource-hub-group-chevron"
									class:is-collapsed={isCollapsed}
									use:icon={"chevron-down"}
								></span>
								<span class="open-bible-resource-hub-group-dot" style:background-color={group.color}></span>
								<span class="open-bible-resource-hub-group-icon" style:color={group.color} use:icon={group.icon}></span>
								<h3 class="open-bible-resource-hub-group-name">{group.label}</h3>
								<span class="open-bible-resource-hub-group-badge">{group.items.length}</span>
							</div>

							<button
								type="button"
								class="open-bible-resource-hub-group-add-btn"
								title={t("resources.hubAddType", { type: group.label }) || `Adicionar ${group.label}`}
								onclick={(e: MouseEvent) => {
									e.stopPropagation();
									handleCreateResource(group.typeId);
								}}
							>
								<span use:icon={"plus"}></span>
								<span>{t("resources.hubCreateResourceBtn") || "Adicionar"}</span>
							</button>
						</div>

						{#if !isCollapsed}
							<div class="open-bible-resource-hub-grid" role="list">
								{#each group.items as item (item.path)}
									{@render resourceCard(item)}
								{/each}
							</div>
						{/if}
					</div>
				{/each}
			</div>
		{:else}
			<div class="open-bible-resource-hub-grid" role="list">
				{#each filteredResources as item (item.path)}
					{@render resourceCard(item)}
				{/each}
			</div>
		{/if}
	</div>
</div>
