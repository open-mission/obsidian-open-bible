<script lang="ts">
	import type { SectionContext, SectionDef } from "./types";
	import {
		SettingsLayout,
		SettingsRoot,
		SettingsSectionPage,
	} from "../core/settings";
	import { t } from "../../i18n";
	import type { OpenBibleSettings } from "../../settings";
	import DataSection from "./sections/DataSection.svelte";
	import GeneralSection from "./sections/GeneralSection.svelte";
	import LanguageSection from "./sections/LanguageSection.svelte";
	import ReaderSection from "./sections/ReaderSection.svelte";
	import StudySection from "./sections/StudySection.svelte";
	import NotesHighlightsSection from "./sections/NotesHighlightsSection.svelte";
	import ResourcesSection from "./sections/ResourcesSection.svelte";
	import AboutSection from "./sections/AboutSection.svelte";

	interface Props extends SectionContext {
		initialSectionId?: string | null;
	}

	let { initialSectionId = null, ...context }: Props = $props();

	// Reactive proxy for settings so Svelte 5 tracks mutations and triggers UI updates across all sections
	// svelte-ignore state_referenced_locally
	let settingsState = $state<OpenBibleSettings>({ ...context.settings });

	$effect(() => {
		Object.assign(settingsState, context.settings);
	});

	async function updateGeneral(patch: Partial<OpenBibleSettings>): Promise<void> {
		Object.assign(settingsState, patch);
		await context.updateGeneral(patch);
	}

	async function updateDataFolder(value: string): Promise<string> {
		const result = await context.updateDataFolder(value);
		settingsState.dataFolder = result;
		return result;
	}

	const sectionContext: SectionContext = $derived({
		app: context.app,
		service: context.service,
		settings: settingsState,
		updateDataFolder,
		updateGeneral,
	});

	// Derived (not a constant) so section titles and descriptions follow locale changes.
	const sections: SectionDef[] = $derived.by(() => [
		{
			id: "general",
			title: t("settings.generalHeading"),
			description: t("settings.generalDesc"),
			icon: "settings",
			component: GeneralSection,
		},
		{
			id: "data",
			title: t("settings.databasesHeading"),
			description: t("settings.databasesDesc"),
			icon: "database",
			component: DataSection,
		},
		{
			id: "reader",
			title: t("settings.pageReaderAppearance"),
			description: t("settings.pageReaderAppearanceDesc"),
			icon: "book-open",
			component: ReaderSection,
		},
		{
			id: "study",
			title: t("settings.pageResources"),
			description: t("settings.pageResourcesDesc"),
			icon: "glasses",
			component: StudySection,
		},
		{
			id: "notes-highlights",
			title: t("settings.pageNotesHighlights"),
			description: t("settings.pageNotesHighlightsDesc"),
			icon: "highlighter",
			component: NotesHighlightsSection,
		},
		{
			id: "study-resources",
			title: t("settings.pageStudyResources"),
			description: t("settings.pageStudyResourcesDesc"),
			icon: "link",
			component: ResourcesSection,
		},
		{
			id: "language",
			title: t("settings.languageSettingName"),
			description: t("settings.languageSettingDesc"),
			icon: "languages",
			component: LanguageSection,
		},
		{
			id: "about",
			title: t("settings.pageAbout"),
			description: t("settings.pageAboutDesc"),
			icon: "info",
			component: AboutSection,
		},
	]);

	let currentSectionId = $state<string | null>(null);

	$effect(() => {
		if (initialSectionId) {
			currentSectionId = initialSectionId;
		}
	});
	let activeSection = $derived(
		currentSectionId ? (sections.find((s) => s.id === currentSectionId) ?? null) : null,
	);
	let ActiveComponent = $derived(activeSection ? activeSection.component : null);
</script>

<SettingsLayout>
	{#if currentSectionId === null || !activeSection || !ActiveComponent}
		<SettingsRoot
			groupTitle={t("settings.groupConfiguration")}
			{sections}
			onSelect={(id) => {
				currentSectionId = id;
			}}
		/>
	{:else}
		<SettingsSectionPage
			title={activeSection.title}
			onBack={() => {
				currentSectionId = null;
			}}
		>
			<ActiveComponent {...sectionContext} />
		</SettingsSectionPage>
	{/if}
</SettingsLayout>
