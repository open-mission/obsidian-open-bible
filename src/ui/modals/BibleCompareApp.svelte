<script lang="ts">
	import { onMount } from "svelte";
	import { Menu, Notice } from "obsidian";
	import { icon } from "../actions/icon";
	import { t, getLocale } from "../../i18n";
	import type OpenBiblePlugin from "../../main";
	import type { BibleBook, BibleVerse } from "../../models/bible";
	import type { BibleVersion } from "../../models/bibleVersion";
	import type { PassageComparisonData, VersionComparisonItem } from "../../models/comparison";
	import { PassagePickerModal } from "./PassagePickerModal";
	import { formatVerseRange, toSuperscript } from "../../services/verseFormat";
	import { getCanonBook } from "../../bibleCanon";

	interface Props {
		plugin: OpenBiblePlugin;
		initialBookId?: number;
		initialChapter?: number;
		initialVerseNumbers?: number[];
		isWorkspaceView?: boolean;
		onTitleChange?: (title: string) => void;
		onStateChange?: (state: {
			bookId: number;
			chapter: number;
			verseNumbers: number[];
			selectedVersions: string[];
			layout: "columns" | "verses";
		}) => void;
		onClose: () => void;
	}

	let {
		plugin,
		initialBookId,
		initialChapter,
		initialVerseNumbers = [],
		isWorkspaceView = false,
		onTitleChange,
		onStateChange,
		onClose,
	}: Props = $props();

	// State
	let bookId = $state<number>(43);
	let chapter = $state<number>(3);
	let verseNumbers = $state<number[]>([]);

	let installedVersions = $state<BibleVersion[]>([]);
	let selectedVersionPaths = $state<string[]>([]);
	let layout = $state<"columns" | "verses">("columns");
	let loading = $state<boolean>(true);
	let exportingCanvas = $state<boolean>(false);
	let exportingExcalidraw = $state<boolean>(false);
	let comparisonData = $state<PassageComparisonData | null>(null);
	let errorMessage = $state<string | null>(null);

	// Drag and drop state for version ordering
	let draggedIndex = $state<number | null>(null);
	let dragOverIndex = $state<number | null>(null);

	// Load installed versions and initial comparison on mount
	onMount(async () => {
		try {
			bookId = initialBookId ?? 43;
			chapter = initialChapter ?? 3;
			verseNumbers = initialVerseNumbers ? [...initialVerseNumbers] : [];
			loading = true;
			installedVersions = await plugin.bibleVersions.listVersions();

			// Layout preference
			if (plugin.settings.comparePreferredLayout) {
				layout = plugin.settings.comparePreferredLayout;
			}

			// Restore previously selected versions or defaults
			const saved = plugin.settings.compareSelectedVersions || [];
			const validSaved = saved.filter((path) =>
				installedVersions.some((v) => v.filePath === path),
			);

			if (validSaved.length > 0) {
				selectedVersionPaths = validSaved;
			} else {
				// Default to defaultVersionPath and second version, or all if <= 3
				const defPath = plugin.settings.defaultVersionPath;
				if (defPath && installedVersions.some((v) => v.filePath === defPath)) {
					const others = installedVersions.filter((v) => v.filePath !== defPath);
					selectedVersionPaths = [defPath, ...(others[0] ? [others[0].filePath] : [])];
				} else {
					selectedVersionPaths = installedVersions.slice(0, 3).map((v) => v.filePath);
				}
			}

			await loadComparison();
		} catch (err) {
			console.error("OpenBible: failed to initialize comparison app:", err);
			errorMessage = String(err);
		} finally {
			loading = false;
		}
	});

	async function loadComparison() {
		if (selectedVersionPaths.length === 0) {
			comparisonData = null;
			return;
		}

		try {
			loading = true;
			errorMessage = null;
			comparisonData = await plugin.comparisonService.comparePassage(
				bookId,
				chapter,
				verseNumbers,
				selectedVersionPaths,
			);
			if (comparisonData) {
				onTitleChange?.(comparisonData.reference);
			}
			notifyStateChange();
		} catch (err) {
			console.error("OpenBible: error loading comparison:", err);
			errorMessage = t("compare.readingError");
		} finally {
			loading = false;
		}
	}

	function notifyStateChange(): void {
		onStateChange?.({
			bookId,
			chapter,
			verseNumbers,
			selectedVersions: selectedVersionPaths,
			layout,
		});
	}

	async function toggleVersion(versionPath: string) {
		if (selectedVersionPaths.includes(versionPath)) {
			selectedVersionPaths = selectedVersionPaths.filter((p) => p !== versionPath);
		} else {
			selectedVersionPaths = [...selectedVersionPaths, versionPath];
		}

		// Persist preference
		plugin.settings.compareSelectedVersions = selectedVersionPaths;
		void plugin.saveSettings();

		await loadComparison();
	}

	async function selectAllVersions() {
		selectedVersionPaths = installedVersions.map((v) => v.filePath);
		plugin.settings.compareSelectedVersions = selectedVersionPaths;
		void plugin.saveSettings();
		await loadComparison();
	}

	async function clearAllVersions() {
		selectedVersionPaths = [];
		plugin.settings.compareSelectedVersions = [];
		void plugin.saveSettings();
		comparisonData = null;
		notifyStateChange();
	}

	function setLayout(newLayout: "columns" | "verses") {
		layout = newLayout;
		plugin.settings.comparePreferredLayout = newLayout;
		void plugin.saveSettings();
		notifyStateChange();
	}

	function handleChangeReference() {
		new PassagePickerModal(plugin.app, plugin, {
			mode: "openPassage",
			onNavigate: async (data: { book: BibleBook; chapter: number; verse?: number }) => {
				bookId = data.book.id;
				chapter = data.chapter;
				verseNumbers = data.verse ? [data.verse] : [];
				await loadComparison();
			},
		}).open();
	}

	function getFallbackReference(): string {
		const canonBook = getCanonBook(bookId);
		const isPt = getLocale() === "pt";
		const name = (isPt ? canonBook?.namePt : canonBook?.nameEn) || canonBook?.namePt || canonBook?.nameEn || `Book ${bookId}`;
		const vRange = verseNumbers && verseNumbers.length > 0 ? `:${formatVerseRange(verseNumbers)}` : "";
		return `${name} ${chapter}${vRange}`;
	}

	async function handleCopyMarkdown() {
		if (!comparisonData) return;
		const text = plugin.comparisonService.formatSingleBlockComparison(comparisonData);
		await navigator.clipboard.writeText(text);
		new Notice(t("compare.copiedMarkdownNotice"));
	}

	async function handleCopyVersion(ver: VersionComparisonItem) {
		if (!comparisonData) return;
		const text = plugin.comparisonService.formatVersionPassage(comparisonData, ver);
		await navigator.clipboard.writeText(text);
		new Notice(t("compare.copiedVersionNotice") || t("notices.textCopied"));
	}

	async function handleExportCanvas() {
		if (!comparisonData) return;
		try {
			exportingCanvas = true;
			await plugin.comparisonService.exportToJsonCanvasFile(comparisonData);
			new Notice(t("compare.exportedCanvasNotice"));
			onClose();
		} catch (err) {
			console.error("OpenBible: error exporting canvas:", err);
			new Notice(t("compare.exportCanvasError").replace("{error}", String(err)));
		} finally {
			exportingCanvas = false;
		}
	}

	async function handleExportExcalidraw() {
		if (!comparisonData) return;
		try {
			exportingExcalidraw = true;
			const success = await plugin.comparisonService.exportToExcalidraw(comparisonData);
			if (success) {
				new Notice(t("compare.exportedExcalidrawNotice"));
				onClose();
			} else {
				new Notice(t("compare.excalidrawNotInstalledNotice"), 5000);
			}
		} catch (err) {
			console.error("OpenBible: error exporting Excalidraw:", err);
			new Notice(t("compare.exportExcalidrawError").replace("{error}", String(err)));
		} finally {
			exportingExcalidraw = false;
		}
	}

	function handleOpenContextMenu(event: MouseEvent) {
		if (!comparisonData) return;
		const menu = new Menu();

		menu.addItem((item) => {
			item
				.setTitle(t("compare.copyExcalidraw") || "Copiar para Excalidraw (bloco único)")
				.setIcon("copy")
				.onClick(async () => {
					if (!comparisonData) return;
					const text = plugin.comparisonService.formatSingleBlockComparison(comparisonData);
					await navigator.clipboard.writeText(text);
					new Notice(t("compare.copiedExcalidrawNotice") || "Comparação copiada como bloco único para Excalidraw!");
				});
		});

		menu.addItem((item) => {
			item
				.setTitle(t("compare.copyMarkdownFull") || "Copiar comparação em Markdown")
				.setIcon("file-text")
				.onClick(async () => {
					if (!comparisonData) return;
					const text = plugin.comparisonService.formatMarkdownComparison(comparisonData, "columns");
					await navigator.clipboard.writeText(text);
					new Notice(t("compare.copiedMarkdownNotice") || "Comparação copiada em Markdown!");
				});
		});

		menu.addSeparator();

		menu.addItem((item) => {
			item
				.setTitle(t("compare.exportCanvas"))
				.setIcon("layout-grid")
				.setDisabled(exportingCanvas)
				.onClick(() => {
					void handleExportCanvas();
				});
		});

		menu.addItem((item) => {
			item
				.setTitle(t("compare.exportExcalidraw"))
				.setIcon("pen-tool")
				.setDisabled(exportingExcalidraw)
				.onClick(() => {
					void handleExportExcalidraw();
				});
		});

		if (event.clientX !== 0 || event.clientY !== 0) {
			menu.showAtMouseEvent(event);
		} else {
			const target = event.currentTarget as HTMLElement;
			const rect = target.getBoundingClientRect();
			menu.showAtPosition({ x: rect.left, y: rect.bottom + 4 });
		}
	}

	function handleDragStart(index: number, event: DragEvent) {
		draggedIndex = index;
		if (event.dataTransfer) {
			event.dataTransfer.effectAllowed = "move";
			event.dataTransfer.setData("text/plain", String(index));
		}
	}

	function handleDragOver(index: number, event: DragEvent) {
		event.preventDefault();
		if (draggedIndex === null || draggedIndex === index) return;
		dragOverIndex = index;
		if (event.dataTransfer) {
			event.dataTransfer.dropEffect = "move";
		}
	}

	function handleDragLeave(index: number) {
		if (dragOverIndex === index) {
			dragOverIndex = null;
		}
	}

	async function handleDrop(targetIndex: number, event: DragEvent) {
		event.preventDefault();
		if (draggedIndex === null || draggedIndex === targetIndex) {
			draggedIndex = null;
			dragOverIndex = null;
			return;
		}

		const updated = [...selectedVersionPaths];
		const [moved] = updated.splice(draggedIndex, 1);
		updated.splice(targetIndex, 0, moved);

		selectedVersionPaths = updated;
		plugin.settings.compareSelectedVersions = updated;
		void plugin.saveSettings();

		draggedIndex = null;
		dragOverIndex = null;

		await loadComparison();
	}

	function handleDragEnd() {
		draggedIndex = null;
		dragOverIndex = null;
	}
</script>

<div class="open-bible-compare-container" class:is-workspace-view={isWorkspaceView}>
	<!-- Clean Header -->
	<div class="open-bible-compare-header">
		<!-- Top Toolbar Row: Seletor de Referência (left) + Botões / Toggle / Menu (right) -->
		<div class="open-bible-compare-toolbar-top">
			<!-- Seletor de Referência -->
			<button
				type="button"
				class="open-bible-compare-passage-btn"
				onclick={handleChangeReference}
				title={t("compare.changeReference")}
			>
				<span class="open-bible-compare-badge-icon" use:icon={"book-open"}></span>
				<span class="open-bible-compare-badge-text">
					{comparisonData?.reference || getFallbackReference()}
				</span>
				<span class="open-bible-compare-badge-chevron" use:icon={"chevron-down"}></span>
			</button>

			<!-- Right Actions: Botão Copiar + Tabs/toggle (apenas ícones) + ... (menu contexto) -->
			{#if comparisonData && selectedVersionPaths.length > 0}
				<div class="open-bible-compare-toolbar-right">
					<!-- Botão Copiar Comparação -->
					<button
						type="button"
						class="open-bible-compare-action-btn mod-copy"
						onclick={handleCopyMarkdown}
						title={t("compare.copyMarkdown")}
						aria-label={t("compare.copyMarkdown")}
					>
						<span use:icon={"copy"}></span>
						<span class="open-bible-copy-label">{t("compare.copyMarkdown")}</span>
					</button>

					<!-- Tabs/toggle (Coluna/versículo a versículo) - apenas ícone com tooltip -->
					<div class="open-bible-compare-layout-toggle" role="group" aria-label="Layout">
						<button
							type="button"
							class="open-bible-layout-btn"
							class:is-active={layout === "columns"}
							onclick={() => setLayout("columns")}
							title={t("compare.layoutColumns")}
							aria-label={t("compare.layoutColumns")}
						>
							<span use:icon={"columns"}></span>
						</button>
						<button
							type="button"
							class="open-bible-layout-btn"
							class:is-active={layout === "verses"}
							onclick={() => setLayout("verses")}
							title={t("compare.layoutVerses")}
							aria-label={t("compare.layoutVerses")}
						>
							<span use:icon={"list"}></span>
						</button>
					</div>

					<!-- ... (menu contexto: Exportar Canvas, Exportar Excalidraw) -->
					<button
						type="button"
						class="open-bible-compare-action-btn mod-more clickable-icon"
						onclick={handleOpenContextMenu}
						title={t("common.moreOptions") || "Mais opções"}
						aria-label={t("common.moreOptions") || "Mais opções"}
					>
						<span use:icon={"more-horizontal"}></span>
					</button>
				</div>
			{/if}
		</div>

		<!-- Version Selection Strip -->
		<div class="open-bible-compare-versions-strip">
			<span class="open-bible-compare-strip-label">
				{t("compare.selectVersionsPrompt")}
			</span>

			<div class="open-bible-compare-chips-track">
				{#each installedVersions as ver (ver.filePath)}
					{@const isSelected = selectedVersionPaths.includes(ver.filePath)}
					{@const selectedIdx = selectedVersionPaths.indexOf(ver.filePath)}
					<button
						type="button"
						class="open-bible-compare-version-chip"
						class:is-active={isSelected}
						class:is-dragging={isSelected && draggedIndex === selectedIdx}
						class:is-drag-over={isSelected && dragOverIndex === selectedIdx}
						draggable={isSelected}
						ondragstart={(e) => isSelected && handleDragStart(selectedIdx, e)}
						ondragover={(e) => isSelected && handleDragOver(selectedIdx, e)}
						ondragleave={() => isSelected && handleDragLeave(selectedIdx)}
						ondrop={(e) => isSelected && handleDrop(selectedIdx, e)}
						ondragend={handleDragEnd}
						onclick={() => toggleVersion(ver.filePath)}
						aria-pressed={isSelected}
						title={`${ver.name} (${isSelected ? t("compare.dragToReorderChip") : t("compare.clickToSelectChip")})`}
					>
						{#if isSelected}
							<span class="open-bible-chip-grip" use:icon={"grip-vertical"}></span>
						{/if}
						<strong class="open-bible-chip-abbr">{ver.abbreviation}</strong>
					</button>
				{/each}
			</div>

			<div class="open-bible-compare-versions-quick-actions">
				<button
					type="button"
					class="open-bible-compare-text-link"
					onclick={selectAllVersions}
				>
					{t("compare.selectAll")}
				</button>
				<span class="open-bible-compare-separator">•</span>
				<button
					type="button"
					class="open-bible-compare-text-link"
					onclick={clearAllVersions}
				>
					{t("compare.clearAll")}
				</button>
			</div>
		</div>
	</div>

	<!-- Body Content -->
	<div class="open-bible-compare-body">
		{#if loading}
			<div class="open-bible-compare-loading">
				<div class="open-bible-compare-spinner"></div>
				<p>{t("common.loading")}</p>
			</div>
		{:else if errorMessage}
			<div class="open-bible-compare-error">
				<span use:icon={"alert-triangle"}></span>
				<p>{errorMessage}</p>
			</div>
		{:else if selectedVersionPaths.length === 0}
			<div class="open-bible-compare-empty">
				<span class="open-bible-compare-empty-icon" use:icon={"book-open"}></span>
				<h3>{t("compare.noVersionsSelected")}</h3>
				<p>{t("compare.selectAtLeastOneVersion")}</p>
				<button
					type="button"
					class="open-bible-compare-empty-action-btn"
					onclick={selectAllVersions}
				>
					{t("compare.selectAll")}
				</button>
			</div>
		{:else if comparisonData}
			{#if layout === "columns"}
				<!-- Columns Mode: Side-by-side cards per version -->
				<div
					class="open-bible-compare-columns-grid"
					style:--columns-count={comparisonData.versions.length}
				>
					{#each comparisonData.versions as ver, index (ver.versionId)}
						<div
							class="open-bible-compare-version-card"
							class:is-dragging={draggedIndex === index}
							class:is-drag-over={dragOverIndex === index}
							role="region"
							aria-label={ver.versionName}
							draggable="true"
							ondragstart={(e) => handleDragStart(index, e)}
							ondragover={(e) => handleDragOver(index, e)}
							ondragleave={() => handleDragLeave(index)}
							ondrop={(e) => handleDrop(index, e)}
							ondragend={handleDragEnd}
						>
							<div class="open-bible-compare-card-header">
								<span
									class="open-bible-drag-handle"
									use:icon={"grip-vertical"}
									title={t("compare.dragCardToReorder")}
									aria-label={t("compare.dragCardToReorder")}
								></span>
								<span class="open-bible-version-pill">{ver.versionAbbr}</span>
								<span class="open-bible-version-title" title={ver.versionName}>
									{ver.versionName}
								</span>
								<div class="open-bible-card-header-actions">
									<button
										type="button"
										class="open-bible-card-header-copy-btn clickable-icon"
										onclick={(e) => {
											e.stopPropagation();
											void handleCopyVersion(ver);
										}}
										title={t("compare.copyVersion")}
										aria-label={t("compare.copyVersion")}
									>
										<span use:icon={"copy"}></span>
									</button>
									<button
										type="button"
										class="open-bible-card-header-remove-btn clickable-icon"
										onclick={(e) => {
											e.stopPropagation();
											void toggleVersion(ver.versionId);
										}}
										title={t("compare.removeVersion")}
										aria-label={t("compare.removeVersion")}
									>
										<span use:icon={"x"}></span>
									</button>
								</div>
							</div>
							<div class="open-bible-compare-card-body">
								{#if ver.verses.length > 0}
									<p class="open-bible-compare-passage-flow">
										{#each ver.verses as verse (verse.number)}
											<span class="open-bible-compare-verse-token">
												<sup class="open-bible-compare-verse-num">{verse.number}</sup>
												<span class="open-bible-compare-verse-text">{verse.text}</span>
											</span>{' '}
										{/each}
									</p>
								{:else}
									<p class="open-bible-compare-verse-empty">
										{t("compare.verseAbsent")}
									</p>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<!-- Stacked List Mode: Version cards stacked vertically -->
				<div class="open-bible-compare-versions-stack">
					{#each comparisonData.versions as ver, index (ver.versionId)}
						<div
							class="open-bible-compare-version-card mod-stack"
							class:is-dragging={draggedIndex === index}
							class:is-drag-over={dragOverIndex === index}
							role="region"
							aria-label={ver.versionName}
							draggable="true"
							ondragstart={(e) => handleDragStart(index, e)}
							ondragover={(e) => handleDragOver(index, e)}
							ondragleave={() => handleDragLeave(index)}
							ondrop={(e) => handleDrop(index, e)}
							ondragend={handleDragEnd}
						>
							<div class="open-bible-compare-card-header">
								<span
									class="open-bible-drag-handle"
									use:icon={"grip-vertical"}
									title={t("compare.dragCardToReorder")}
									aria-label={t("compare.dragCardToReorder")}
								></span>
								<span class="open-bible-version-pill">{ver.versionAbbr}</span>
								<span class="open-bible-version-title" title={ver.versionName}>
									{ver.versionName}
								</span>
								<div class="open-bible-card-header-actions">
									<button
										type="button"
										class="open-bible-card-header-copy-btn clickable-icon"
										onclick={(e) => {
											e.stopPropagation();
											void handleCopyVersion(ver);
										}}
										title={t("compare.copyVersion")}
										aria-label={t("compare.copyVersion")}
									>
										<span use:icon={"copy"}></span>
									</button>
									<button
										type="button"
										class="open-bible-card-header-remove-btn clickable-icon"
										onclick={(e) => {
											e.stopPropagation();
											void toggleVersion(ver.versionId);
										}}
										title={t("compare.removeVersion")}
										aria-label={t("compare.removeVersion")}
									>
										<span use:icon={"x"}></span>
									</button>
								</div>
							</div>
							<div class="open-bible-compare-card-body">
								{#if ver.verses.length > 0}
									<p class="open-bible-compare-passage-flow">
										{#each ver.verses as verse (verse.number)}
											<span class="open-bible-compare-verse-token">
												<sup class="open-bible-compare-verse-num">{verse.number}</sup>
												<span class="open-bible-compare-verse-text">{verse.text}</span>
											</span>{' '}
										{/each}
									</p>
								{:else}
									<p class="open-bible-compare-verse-empty">
										{t("compare.verseAbsent")}
									</p>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			{/if}
		{/if}
	</div>
</div>

<style>
	.open-bible-compare-container {
		display: flex;
		flex-direction: column;
		width: 100%;
		height: 100%;
		max-height: 100%;
		min-height: 0;
		color: var(--text-normal);
		background-color: var(--background-primary);
		box-sizing: border-box;
		overflow: hidden;
	}

	.open-bible-compare-container.is-workspace-view {
		max-height: none;
		height: 100%;
		min-height: 0;
		width: 100%;
	}

	.open-bible-compare-header {
		display: flex;
		flex-direction: column;
		gap: 8px;
		padding: 10px 16px;
		border-bottom: 1px solid var(--background-modifier-border);
		background-color: var(--background-primary);
		flex-shrink: 0;
		width: 100%;
		box-sizing: border-box;
		z-index: 5;
	}

	.open-bible-compare-toolbar-top {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		box-sizing: border-box;
		flex-wrap: nowrap;
		gap: 12px;
	}

	.open-bible-compare-toolbar-right {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 8px;
		flex-shrink: 0;
		margin-left: auto;
		flex-wrap: nowrap;
	}

	@media (max-width: 650px) {
		.open-bible-copy-label {
			display: none;
		}
		.open-bible-compare-action-btn.mod-copy {
			width: 30px;
			padding: 0;
			justify-content: center;
		}
	}

	.open-bible-compare-passage-btn {
		display: inline-flex;
		align-items: center;
		gap: 7px;
		padding: 4px 10px;
		border-radius: var(--radius-s, 6px);
		background-color: var(--background-modifier-box-shadow, rgba(0, 0, 0, 0.04));
		border: 1px solid var(--background-modifier-border);
		font-weight: 600;
		font-size: 0.88rem;
		color: var(--text-normal);
		cursor: pointer;
		transition: background-color 0.15s ease, border-color 0.15s ease;
		flex-shrink: 0;
	}

	.open-bible-compare-passage-btn:hover {
		background-color: var(--background-modifier-hover);
		border-color: var(--interactive-accent);
	}

	.open-bible-compare-passage-btn:focus-visible {
		outline: 2px solid var(--interactive-accent);
		outline-offset: 2px;
	}

	.open-bible-compare-badge-icon {
		display: flex;
		align-items: center;
		color: var(--interactive-accent);
	}

	.open-bible-compare-badge-chevron {
		display: flex;
		align-items: center;
		color: var(--text-muted);
		opacity: 0.7;
	}

	.open-bible-compare-layout-toggle {
		display: inline-flex;
		align-items: center;
		border-radius: var(--radius-s, 6px);
		background-color: var(--background-primary);
		border: 1px solid var(--background-modifier-border);
		padding: 2px;
		gap: 2px;
		height: 30px;
		box-sizing: border-box;
	}

	.open-bible-layout-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		padding: 0;
		border-radius: var(--radius-s, 4px);
		border: none;
		background: transparent;
		color: var(--text-muted);
		cursor: pointer;
		transition: background-color 0.15s ease, color 0.15s ease;
	}

	.open-bible-layout-btn:hover {
		background-color: var(--background-modifier-hover);
		color: var(--text-normal);
	}

	.open-bible-layout-btn:focus-visible {
		outline: 2px solid var(--interactive-accent);
		outline-offset: 1px;
	}

	.open-bible-layout-btn.is-active {
		background-color: var(--background-secondary);
		color: var(--text-normal);
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.12);
	}

	.open-bible-compare-versions-strip {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-wrap: wrap;
	}

	.open-bible-compare-strip-label {
		font-size: 0.78rem;
		font-weight: 500;
		color: var(--text-muted);
		white-space: nowrap;
		flex-shrink: 0;
	}

	.open-bible-compare-chips-track {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 5px;
	}

	.open-bible-compare-version-chip {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		padding: 2px 8px;
		border-radius: 12px;
		border: 1px solid var(--background-modifier-border);
		background-color: var(--background-primary);
		color: var(--text-muted);
		cursor: pointer;
		font-size: 0.78rem;
		transition: all 0.15s ease;
	}

	.open-bible-compare-version-chip:hover {
		background-color: var(--background-modifier-hover);
		color: var(--text-normal);
	}

	.open-bible-compare-version-chip:focus-visible {
		outline: 2px solid var(--interactive-accent);
		outline-offset: 2px;
	}

	.open-bible-compare-version-chip.is-active {
		background-color: var(--interactive-accent);
		border-color: var(--interactive-accent);
		color: var(--text-on-accent);
	}

	.open-bible-compare-version-chip.is-dragging {
		opacity: 0.4;
		border-style: dashed;
	}

	.open-bible-compare-version-chip.is-drag-over {
		outline: 2px solid var(--interactive-accent);
		outline-offset: 2px;
		transform: scale(1.04);
	}

	.open-bible-chip-grip {
		display: inline-flex;
		align-items: center;
		color: currentColor;
		opacity: 0.7;
		cursor: grab;
		margin-right: -2px;
	}

	.open-bible-chip-abbr {
		font-weight: 700;
		font-variant-numeric: tabular-nums;
	}

	.open-bible-compare-versions-quick-actions {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 0.76rem;
		margin-left: 2px;
	}

	.open-bible-compare-text-link {
		background: none;
		border: none;
		padding: 2px 4px;
		border-radius: var(--radius-s, 3px);
		color: var(--interactive-accent);
		cursor: pointer;
		font-size: 0.76rem;
		transition: opacity 0.15s ease;
	}

	.open-bible-compare-text-link:hover {
		text-decoration: underline;
	}

	.open-bible-compare-text-link:focus-visible {
		outline: 2px solid var(--interactive-accent);
		outline-offset: 1px;
	}

	.open-bible-compare-separator {
		color: var(--text-faint);
		font-size: 0.7rem;
	}

	.open-bible-compare-body {
		flex: 1 1 auto;
		overflow-y: auto;
		padding: 16px 20px;
		min-height: 0;
		scrollbar-width: thin;
		scrollbar-color: var(--scrollbar-thumb-bg) transparent;
	}

	.open-bible-compare-loading,
	.open-bible-compare-empty,
	.open-bible-compare-error {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 48px 20px;
		text-align: center;
		color: var(--text-muted);
		gap: 12px;
	}

	.open-bible-compare-empty-icon {
		font-size: 2.2rem;
		opacity: 0.4;
		color: var(--interactive-accent);
	}

	.open-bible-compare-spinner {
		width: 1.5rem;
		height: 1.5rem;
		border: 2px solid var(--background-modifier-border);
		border-top-color: var(--interactive-accent);
		border-radius: 50%;
		animation: openBibleSpin 0.75s linear infinite;
	}

	@keyframes openBibleSpin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}

	.open-bible-compare-empty-action-btn {
		margin-top: 6px;
		padding: 6px 14px;
		border-radius: var(--radius-s, 6px);
		background-color: var(--interactive-accent);
		color: var(--text-on-accent);
		border: none;
		font-size: 0.82rem;
		font-weight: 600;
		cursor: pointer;
		transition: opacity 0.15s ease;
	}

	.open-bible-compare-empty-action-btn:hover {
		opacity: 0.9;
	}

	.open-bible-compare-columns-grid {
		display: grid;
		grid-template-columns: repeat(var(--columns-count, 1), minmax(300px, 1fr));
		gap: 16px;
		overflow-x: auto;
		padding-bottom: 8px;
		align-items: start;
	}

	@media (max-width: 600px) {
		.open-bible-compare-columns-grid {
			grid-template-columns: repeat(var(--columns-count, 1), minmax(260px, 1fr));
			gap: 12px;
		}
	}

	.open-bible-compare-version-card {
		display: flex;
		flex-direction: column;
		border-radius: var(--radius-m, 8px);
		border: 1px solid var(--background-modifier-border);
		background-color: var(--background-secondary);
		overflow: hidden;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
		transition: transform 0.15s ease, opacity 0.15s ease, outline 0.15s ease, border-color 0.15s ease;
	}

	.open-bible-compare-version-card.is-dragging {
		opacity: 0.35;
		border-style: dashed;
	}

	.open-bible-compare-version-card.is-drag-over {
		outline: 2px solid var(--interactive-accent);
		outline-offset: 2px;
		transform: scale(1.01);
	}

	.open-bible-compare-card-header {
		position: sticky;
		top: 0;
		z-index: 2;
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 10px 14px;
		background-color: var(--background-secondary-alt, var(--background-secondary));
		border-bottom: 1px solid var(--background-modifier-border);
		backdrop-filter: blur(8px);
	}

	.open-bible-drag-handle {
		display: inline-flex;
		align-items: center;
		cursor: grab;
		color: var(--text-faint);
		padding: 2px;
		margin-right: 2px;
		transition: color 0.15s ease;
	}

	.open-bible-drag-handle:hover {
		color: var(--text-normal);
	}

	.open-bible-drag-handle:active {
		cursor: grabbing;
	}

	.open-bible-version-pill {
		font-size: 0.72rem;
		font-weight: 700;
		padding: 2px 7px;
		border-radius: 12px;
		background-color: var(--interactive-accent);
		color: var(--text-on-accent);
		letter-spacing: 0.02em;
	}

	.open-bible-version-title {
		font-weight: 600;
		font-size: 0.88rem;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		flex: 1 1 auto;
		min-width: 0;
	}

	.open-bible-card-header-actions {
		display: flex;
		align-items: center;
		gap: 4px;
		margin-left: auto;
		flex-shrink: 0;
	}

	.open-bible-card-header-copy-btn,
	.open-bible-card-header-remove-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 22px;
		height: 22px;
		border-radius: var(--radius-s, 4px);
		border: none;
		background: transparent;
		color: var(--text-muted);
		cursor: pointer;
		flex-shrink: 0;
		transition: color 0.12s ease, background-color 0.12s ease;
	}

	.open-bible-card-header-copy-btn:hover,
	.open-bible-card-header-remove-btn:hover {
		color: var(--text-normal);
		background-color: var(--background-modifier-hover);
	}

	.open-bible-card-header-copy-btn:focus-visible,
	.open-bible-card-header-remove-btn:focus-visible {
		outline: 2px solid var(--interactive-accent);
		outline-offset: 1px;
	}

	.open-bible-compare-card-body {
		padding: 14px 16px;
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.open-bible-compare-passage-flow {
		margin: 0;
		font-family: var(--font-text, var(--font-text-theme, var(--font-interface)));
		font-size: var(--font-text-size, 1rem);
		line-height: var(--line-height-normal, 1.75);
		color: var(--text-normal);
		word-break: break-word;
	}

	.open-bible-compare-verse-token {
		display: inline;
		border-radius: var(--radius-s, 3px);
		transition: background-color 0.12s ease;
	}

	.open-bible-compare-verse-token:hover {
		background-color: var(--background-modifier-hover);
	}

	.open-bible-compare-verse-num {
		font-size: 0.72em;
		font-weight: var(--font-bold, 700);
		vertical-align: super;
		line-height: 0;
		color: var(--text-accent);
		font-variant-numeric: tabular-nums;
		user-select: none;
		-webkit-user-select: none;
		margin-right: 0.25rem;
		margin-left: 0.2rem;
	}

	.open-bible-compare-verse-token:first-child .open-bible-compare-verse-num {
		margin-left: 0;
	}

	.open-bible-compare-verse-text {
		color: var(--text-normal);
	}

	.open-bible-compare-verse-empty {
		margin: 0;
		font-style: italic;
		color: var(--text-faint);
		font-size: 0.9rem;
	}

	/* Stacked list mode */
	.open-bible-compare-versions-stack {
		display: flex;
		flex-direction: column;
		gap: 14px;
	}

	.open-bible-compare-version-card.mod-stack {
		width: 100%;
	}

	.open-bible-compare-action-btn {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 4px 10px;
		border-radius: var(--radius-s, 6px);
		font-size: 0.8rem;
		font-weight: 500;
		cursor: pointer;
		border: 1px solid var(--background-modifier-border);
		background-color: var(--background-primary);
		color: var(--text-normal);
		transition: all 0.15s ease;
		height: 30px;
		box-sizing: border-box;
		white-space: nowrap;
	}

	.open-bible-compare-action-btn:hover:not(:disabled) {
		background-color: var(--background-modifier-hover);
		border-color: var(--text-muted);
	}

	.open-bible-compare-action-btn:focus-visible {
		outline: 2px solid var(--interactive-accent);
		outline-offset: 2px;
	}

	.open-bible-compare-action-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.open-bible-compare-action-btn.mod-more {
		width: 30px;
		height: 30px;
		padding: 0;
		justify-content: center;
		color: var(--text-muted);
	}

	.open-bible-compare-action-btn.mod-more:hover {
		color: var(--text-normal);
		background-color: var(--background-modifier-hover);
	}
</style>
