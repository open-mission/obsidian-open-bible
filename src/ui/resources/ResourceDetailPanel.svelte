<script lang="ts">
	import { onMount, tick } from "svelte";
	import { MarkdownRenderer, TFile, Notice } from "obsidian";
	import type OpenBiblePlugin from "../../main";
	import type { BibleResourceLink } from "../../models/resource";
	import { stripFrontmatter } from "../../services/NoteService";
	import { resolveResourceImageUrl } from "../modals/ResourcePreviewModal";
	import { openNoteInEditor } from "../modals/NotePreviewModal";
	import { icon } from "../actions/icon";
	import { t } from "../../i18n";
	import EmptyState from "../kit/EmptyState.svelte";

	interface Props {
		plugin?: OpenBiblePlugin;
		link: BibleResourceLink | null;
		embedded?: boolean;
		onNavigate?: (bookName: string, chapter: number, verseNumber?: number, versionAbbr?: string) => void;
		onClose?: () => void;
		onOpenInWorkspace?: () => void;
		onUnlink?: (linkPath: string) => void;
		onBackToHub?: () => void;
	}

	let {
		plugin,
		link = $bindable(),
		embedded = false,
		onNavigate,
		onClose,
		onOpenInWorkspace,
		onUnlink,
		onBackToHub,
	}: Props = $props();

	let markdownContainerEl = $state<HTMLElement | undefined>();
	let imageUrl = $state<string | null>(null);
	let rawContent = $state<string>("");
	let otherOccurrences = $state<BibleResourceLink[]>([]);
	let isUnlinking = $state(false);

	let resourceType = $derived(
		link && plugin?.resourceService ? plugin.resourceService.getResourceType(link.resourceType) : undefined
	);
	let typeLabel = $derived(resourceType?.label || link?.resourceType || "");
	let typeColor = $derived(resourceType?.color || "var(--interactive-accent)");
	let typeIcon = $derived(resourceType?.icon || "link");

	async function loadResourceData(targetLink: BibleResourceLink | null) {
		if (!targetLink || !plugin) {
			rawContent = "";
			imageUrl = null;
			otherOccurrences = [];
			return;
		}

		const file = plugin.app.vault.getAbstractFileByPath(targetLink.resourcePath);
		if (file instanceof TFile) {
			const cache = plugin.app.metadataCache.getFileCache(file);
			const fm = cache?.frontmatter;
			const rawImage = (fm?.image || fm?.cover || fm?.banner || fm?.thumbnail) as string | undefined;
			if (rawImage) {
				imageUrl = resolveResourceImageUrl(plugin.app, rawImage, file.path);
			} else {
				imageUrl = null;
			}

			try {
				const raw = await plugin.app.vault.cachedRead(file);
				rawContent = stripFrontmatter(raw, plugin.app, file).trim();
			} catch (err) {
				console.error("OpenBible: error reading resource file", err);
				rawContent = "";
			}
		} else {
			rawContent = "";
			imageUrl = null;
		}

		// Query all passages linked to this resource across the Bible
		try {
			otherOccurrences = plugin.resourceService.getLinksForResource(targetLink.resourcePath);
		} catch {
			otherOccurrences = [];
		}

		await tick();
		renderMarkdown(file instanceof TFile ? file.path : targetLink.resourcePath);
	}

	async function renderMarkdown(sourcePath: string) {
		if (!markdownContainerEl || !plugin) return;
		markdownContainerEl.empty();

		if (rawContent) {
			await MarkdownRenderer.render(
				plugin.app,
				rawContent,
				markdownContainerEl,
				sourcePath,
				plugin
			);
		} else {
			markdownContainerEl.createEl("p", {
				cls: "open-bible-secondary-panel-empty-text",
				text: t("common.empty") || "Nenhum conteúdo adicional nesta nota.",
			});
		}
	}

	$effect(() => {
		const targetLink = link;
		void loadResourceData(targetLink);
	});

	onMount(() => {
		if (!plugin?.resourceService) return;
		const unsub = plugin.resourceService.subscribe(() => {
			void loadResourceData(link);
		});
		return unsub;
	});

	async function handleOpenEditor() {
		if (!plugin || !link?.resourcePath) return;
		await openNoteInEditor(plugin.app, link.resourcePath);
	}

	async function handleUnlink() {
		if (!link?.path || !onUnlink || isUnlinking) return;
		isUnlinking = true;
		try {
			onUnlink(link.path);
		} finally {
			isUnlinking = false;
		}
	}

	function handleNavigateToOccurrence(occ: BibleResourceLink) {
		const firstVerse = occ.verses.length > 0 ? occ.verses[0] : 1;
		onNavigate?.(occ.book, occ.chapter, firstVerse, occ.version);
	}
</script>

<div class="open-bible-secondary-panel" class:is-embedded={embedded}>
	{#if !link}
		<div class="open-bible-secondary-panel-empty">
			<EmptyState
				iconName="book-open-check"
				title={t("resources.noResourceSelected") || "Nenhum recurso selecionado"}
				description={t("resources.noResourceSelectedDesc") || "Clique em um recurso no leitor para visualizar seus detalhes e notas aqui."}
			/>
		</div>
	{:else}
		<!-- Header with badges and actions -->
		<div class="open-bible-secondary-panel-header">
			<div class="open-bible-secondary-panel-header-main">
				{#if onBackToHub}
					<button
						type="button"
						class="clickable-icon open-bible-secondary-action-btn mod-back"
						aria-label={t("resources.backToHub") || "Voltar à Central"}
						title={t("resources.backToHub") || "Voltar à Central"}
						onclick={onBackToHub}
					>
						<span use:icon={"arrow-left"}></span>
					</button>
				{/if}
				<div class="open-bible-resource-type-badge" style="--badge-color: {typeColor};">
					<span class="open-bible-resource-type-badge-icon" use:icon={typeIcon}></span>
					<span class="open-bible-resource-type-badge-label">{typeLabel}</span>
				</div>
				<h2 class="open-bible-secondary-panel-title" title={link.resourceName}>
					{link.resourceName}
				</h2>
			</div>

			<div class="open-bible-secondary-panel-actions">
				<button
					type="button"
					class="clickable-icon open-bible-secondary-action-btn"
					aria-label={t("note.openInEditor") || "Abrir no editor"}
					title={t("note.openInEditor") || "Abrir no editor"}
					onclick={handleOpenEditor}
				>
					<span use:icon={"file-text"}></span>
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

		<!-- Scrollable Body -->
		<div class="open-bible-secondary-panel-scrollable">
			<!-- Hero Image Banner -->
			{#if imageUrl}
				<div class="open-bible-secondary-panel-hero">
					<img
						class="open-bible-secondary-panel-hero-img"
						src={imageUrl}
						alt={link.resourceName}
						onerror={() => {
							imageUrl = null;
						}}
					/>
					<div class="open-bible-secondary-panel-hero-overlay"></div>
				</div>
			{/if}

			<!-- Rendered Markdown of the Note -->
			<div
				bind:this={markdownContainerEl}
				class="open-bible-secondary-panel-markdown markdown-rendered"
			></div>

			<!-- Linked Context Card (active passage clicked) -->
			{#if link.reference}
				<div
					class="open-bible-secondary-passage-card is-clickable"
					role="button"
					tabindex="0"
					onclick={() => handleNavigateToOccurrence(link)}
					onkeydown={(e) => {
						if (e.key === "Enter" || e.key === " ") {
							e.preventDefault();
							handleNavigateToOccurrence(link);
						}
					}}
				>
					<div class="open-bible-secondary-passage-header">
						<span class="open-bible-secondary-passage-icon" use:icon={"book-open"}></span>
						<span class="open-bible-secondary-passage-title">
							{t("resourcesPanel.linkedPassage") || "Passagem vinculada"}: {link.reference}
						</span>
					</div>
					{#if link.selectedText}
						<blockquote class="open-bible-secondary-passage-quote">
							“{link.selectedText}”
						</blockquote>
					{/if}
				</div>
			{/if}

			<!-- All Biblical Occurrences Linked to this Resource -->
			{#if otherOccurrences.length > 0}
				<div class="open-bible-secondary-occurrences-section">
					<div class="open-bible-secondary-occurrences-title">
						<span use:icon={"layers"}></span>
						<span>{t("resources.allOccurrences") || "Passagens bíblicas vinculadas"} ({otherOccurrences.length})</span>
					</div>

					<div class="open-bible-secondary-occurrences-list">
						{#each otherOccurrences as occ (occ.path)}
							<div
								class="open-bible-secondary-occurrence-item"
								class:is-active={occ.path === link.path}
								role="button"
								tabindex="0"
								onclick={() => handleNavigateToOccurrence(occ)}
								onkeydown={(e) => {
									if (e.key === "Enter" || e.key === " ") {
										e.preventDefault();
										handleNavigateToOccurrence(occ);
									}
								}}
							>
								<div class="open-bible-secondary-occurrence-header">
									<span class="open-bible-secondary-occurrence-ref">{occ.reference}</span>
									{#if occ.version}
										<span class="open-bible-secondary-occurrence-version">{occ.version}</span>
									{/if}
								</div>
								{#if occ.selectedText}
									<div class="open-bible-secondary-occurrence-snippet">“{occ.selectedText}”</div>
								{/if}
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>

		<!-- Footer actions -->
		{#if link.path && onUnlink}
			<div class="open-bible-secondary-panel-footer">
				<button
					type="button"
					class="open-bible-ui-btn is-ghost is-small mod-destructive"
					onclick={handleUnlink}
					disabled={isUnlinking}
				>
					<span use:icon={"unlink"}></span>
					<span>{t("resourcesPanel.unlinkTooltip") || "Desvincular deste versículo"}</span>
				</button>
			</div>
		{/if}
	{/if}
</div>
