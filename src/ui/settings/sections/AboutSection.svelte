<script lang="ts">
	import { t } from "../../../i18n";
	import type { SectionContext } from "../types";
	import { LOGO_COMPLETE, LOGO_MINIMAL, LOGO_OPEN_MISSION } from "../../../assets/logos";
	import { lucide } from "../../core/icons";
	import manifest from "../../../../manifest.json";

	let _context: SectionContext = $props();

	const version = manifest.version;
</script>

<div class="ob-about-container">
	<!-- Hero header -->
	<div class="ob-about-hero">
		<img src={LOGO_COMPLETE} alt="OpenBible Logo" class="ob-about-logo-main" />
		<div class="ob-about-hero-text">
			<div class="ob-about-title-row">
				<h2 class="ob-about-app-name">OpenBible</h2>
				<span class="ob-about-version-badge">v{version}</span>
			</div>
			<p class="ob-about-tagline">
				{t("about.tagline")}
			</p>
		</div>
	</div>

	<!-- Dedication note -->
	<div class="ob-about-callout">
		<p class="ob-about-callout-text">
			{t("settings.creditsDesc")}
		</p>
	</div>

	<!-- Project & Organization entities -->
	<div class="ob-about-card-group">
		<div class="ob-about-group-title">{t("about.organizationHeading")}</div>

		<div class="ob-about-card">
			<div class="ob-about-entity">
				<img src={LOGO_MINIMAL} alt="OpenBible Minimal Logo" class="ob-about-entity-logo" />
				<div class="ob-about-entity-content">
					<div class="ob-about-entity-title">OpenBible</div>
					<div class="ob-about-entity-desc">
						{t("settings.creditsOpenBibleDesc")}
					</div>
					<a
						href="https://github.com/open-mission/obsidian-open-bible"
						target="_blank"
						rel="noopener noreferrer"
						class="ob-about-link"
					>
						<span class="ob-about-link-icon" use:lucide={"github"}></span>
						github.com/open-mission/obsidian-open-bible
					</a>
				</div>
			</div>

			<div class="ob-about-divider"></div>

			<div class="ob-about-entity">
				<img src={LOGO_OPEN_MISSION} alt="Open Mission Logo" class="ob-about-entity-logo" />
				<div class="ob-about-entity-content">
					<div class="ob-about-entity-title">Open Mission</div>
					<div class="ob-about-entity-desc">
						{t("settings.creditsOpenMissionDesc")}
					</div>
					<a
						href="https://github.com/open-mission"
						target="_blank"
						rel="noopener noreferrer"
						class="ob-about-link"
					>
						<span class="ob-about-link-icon" use:lucide={"globe"}></span>
						github.com/open-mission
					</a>
				</div>
			</div>
		</div>
	</div>

	<!-- Links & Community -->
	<div class="ob-about-card-group">
		<div class="ob-about-group-title">{t("about.linksHeading")}</div>

		<div class="ob-about-card">
			<a
				href="https://github.com/open-mission/obsidian-open-bible"
				target="_blank"
				rel="noopener noreferrer"
				class="ob-about-nav-link"
			>
				<div class="ob-about-nav-link-left">
					<span class="ob-about-nav-icon" use:lucide={"github"}></span>
					<div class="ob-about-nav-text">
						<div class="ob-about-nav-name">{t("about.sourceCodeName")}</div>
						<div class="ob-about-nav-sub">{t("about.sourceCodeDesc")}</div>
					</div>
				</div>
				<span class="ob-about-nav-chevron" use:lucide={"external-link"}></span>
			</a>

			<div class="ob-about-divider"></div>

			<a
				href="https://github.com/open-mission/obsidian-open-bible/issues"
				target="_blank"
				rel="noopener noreferrer"
				class="ob-about-nav-link"
			>
				<div class="ob-about-nav-link-left">
					<span class="ob-about-nav-icon" use:lucide={"bug"}></span>
					<div class="ob-about-nav-text">
						<div class="ob-about-nav-name">{t("about.reportIssueName")}</div>
						<div class="ob-about-nav-sub">{t("about.reportIssueDesc")}</div>
					</div>
				</div>
				<span class="ob-about-nav-chevron" use:lucide={"external-link"}></span>
			</a>

			<div class="ob-about-divider"></div>

			<a
				href="https://github.com/sponsors/open-mission"
				target="_blank"
				rel="noopener noreferrer"
				class="ob-about-nav-link"
			>
				<div class="ob-about-nav-link-left">
					<span class="ob-about-nav-icon ob-sponsor-icon" use:lucide={"heart"}></span>
					<div class="ob-about-nav-text">
						<div class="ob-about-nav-name">{t("about.sponsorName")}</div>
						<div class="ob-about-nav-sub">{t("about.sponsorDesc")}</div>
					</div>
				</div>
				<span class="ob-about-nav-chevron" use:lucide={"external-link"}></span>
			</a>
		</div>
	</div>

	<!-- Credits & Acknowledgments -->
	<div class="ob-about-card-group">
		<div class="ob-about-group-title">{t("settings.creditsHeading")}</div>
		<div class="ob-about-card ob-about-credits-card">
			<p class="ob-about-credit-text">
				{t("about.creditsCrossRefs")}
			</p>
			<p class="ob-about-credit-text">
				{t("about.creditsTech")}
			</p>
		</div>
	</div>
</div>

<style>
	.ob-about-container {
		display: flex;
		flex-direction: column;
		gap: 20px;
		width: 100%;
		padding-bottom: 24px;
	}

	.ob-about-hero {
		display: flex;
		align-items: center;
		gap: 20px;
		padding: 16px;
		border: 1px solid var(--background-modifier-border);
		border-radius: var(--radius-m, 8px);
		background-color: var(--background-primary-alt, var(--background-secondary));
	}

	.ob-about-logo-main {
		height: 64px;
		width: auto;
		object-fit: contain;
		flex-shrink: 0;
	}

	.ob-about-hero-text {
		display: flex;
		flex-direction: column;
		gap: 4px;
		min-width: 0;
	}

	.ob-about-title-row {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.ob-about-app-name {
		margin: 0;
		font-size: var(--font-ui-large, 1.25rem);
		font-weight: var(--font-semibold, 600);
		color: var(--text-normal);
		line-height: var(--line-height-tight);
	}

	.ob-about-version-badge {
		font-size: var(--font-ui-smaller);
		padding: 2px 8px;
		border-radius: var(--radius-round, 999px);
		background-color: var(--background-modifier-border);
		color: var(--text-accent);
		font-weight: var(--font-medium, 500);
	}

	.ob-about-tagline {
		margin: 0;
		font-size: var(--font-ui-small);
		color: var(--text-muted);
		line-height: var(--line-height-normal);
	}

	.ob-about-callout {
		padding: 12px 16px;
		border-radius: var(--radius-m, 8px);
		background-color: var(--background-secondary);
		border-left: 3px solid var(--interactive-accent);
	}

	.ob-about-callout-text {
		margin: 0;
		font-size: var(--font-ui-small);
		color: var(--text-normal);
	}

	.ob-about-card-group {
		display: flex;
		flex-direction: column;
		gap: 8px;
		width: 100%;
	}

	.ob-about-group-title {
		font-size: var(--font-ui-smaller);
		font-weight: var(--font-semibold, 600);
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		padding-left: 2px;
	}

	.ob-about-card {
		display: flex;
		flex-direction: column;
		background-color: var(--background-primary-alt, var(--background-secondary));
		border: 1px solid var(--background-modifier-border);
		border-radius: var(--radius-m, 8px);
		overflow: hidden;
	}

	.ob-about-divider {
		height: 1px;
		background-color: var(--background-modifier-border);
		width: 100%;
	}

	.ob-about-entity {
		display: flex;
		align-items: flex-start;
		gap: 16px;
		padding: 16px;
	}

	.ob-about-entity-logo {
		height: 48px;
		width: 48px;
		object-fit: contain;
		flex-shrink: 0;
		border-radius: var(--radius-s, 4px);
	}

	.ob-about-entity-content {
		display: flex;
		flex-direction: column;
		gap: 4px;
		min-width: 0;
	}

	.ob-about-entity-title {
		font-size: var(--font-ui-medium);
		font-weight: var(--font-semibold, 600);
		color: var(--text-normal);
	}

	.ob-about-entity-desc {
		font-size: var(--font-ui-smaller);
		color: var(--text-muted);
		line-height: var(--line-height-normal);
	}

	.ob-about-link {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		margin-top: 4px;
		font-size: var(--font-ui-smaller);
		color: var(--text-accent);
		text-decoration: none;
	}

	.ob-about-link:hover {
		text-decoration: underline;
	}

	.ob-about-link-icon {
		display: inline-flex;
		width: 14px;
		height: 14px;
	}

	.ob-about-nav-link {
		all: unset;
		box-sizing: border-box;
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		padding: 12px 16px;
		cursor: pointer;
		text-decoration: none;
		color: inherit;
		transition: background-color 120ms ease;
	}

	.ob-about-nav-link:hover {
		background-color: var(--background-modifier-hover);
	}

	.ob-about-nav-link:focus-visible {
		outline: 2px solid var(--interactive-accent);
		outline-offset: -2px;
	}

	.ob-about-nav-link-left {
		display: flex;
		align-items: center;
		gap: 14px;
		min-width: 0;
	}

	.ob-about-nav-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 18px;
		height: 18px;
		color: var(--text-muted);
		flex-shrink: 0;
	}

	.ob-sponsor-icon {
		color: #e0245e;
	}

	.ob-about-nav-text {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.ob-about-nav-name {
		font-size: var(--font-ui-medium);
		font-weight: var(--font-medium, 500);
		color: var(--text-normal);
	}

	.ob-about-nav-sub {
		font-size: var(--font-ui-smaller);
		color: var(--text-muted);
	}

	.ob-about-nav-chevron {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 16px;
		height: 16px;
		color: var(--text-faint, var(--text-muted));
		flex-shrink: 0;
	}

	.ob-about-credits-card {
		padding: 14px 16px;
		gap: 8px;
	}

	.ob-about-credit-text {
		margin: 0;
		font-size: var(--font-ui-smaller);
		color: var(--text-muted);
		line-height: var(--line-height-normal);
	}

	@media (max-width: 600px) {
		.ob-about-hero {
			flex-direction: column;
			align-items: flex-start;
		}
	}
</style>
