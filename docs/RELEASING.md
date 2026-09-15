# Releasing OpenBible

This guide documents the automated release pipeline, tag conventions, package scripts, and submission process to the Obsidian Community Directory.

---

## 1. Overview of the Release Pipeline

OpenBible uses **GitHub Actions** to automate production builds, artifact attestations, and release generation.

```
┌─────────────────┐       ┌────────────────────────┐       ┌───────────────────────────┐
│ Run npm script  │  ──▶  │  Push annotated tag    │  ──▶  │  GitHub Actions triggers  │
│ release:patch   │       │  git push origin --tags│       │  .github/workflows/       │
└─────────────────┘       └────────────────────────┘       │  release.yml              │
                                                           └─────────────┬─────────────┘
                                                                         │
            ┌────────────────────────────────────────────────────────────┴─────────────┐
            ▼                                            ▼                             ▼
┌───────────────────────┐                    ┌───────────────────────┐     ┌───────────────────────┐
│ 1. npm run build      │                    │ 2. actions/attest@v4  │     │ 3. gh release create  │
│ (tsc + esbuild prod)  │                    │ (provenance signature)│     │ (draft GitHub release)│
└───────────────────────┘                    └───────────────────────┘     └───────────────────────┘
```

---

## 2. Tag Versioning Rules

Obsidian strictly requires the Git release tag to **match the version in `manifest.json` exactly**:
- ✅ Allowed: `0.1.0`, `1.0.0`, `1.2.3`
- ❌ Forbidden: `v0.1.0`, `v1.0.0`

To enforce this, `.npmrc` is configured with:
```properties
tag-version-prefix=""
```

When you execute `npm version`, npm will generate tags without the `v` prefix.

---

## 3. How to Release a New Version

We have configured convenient npm scripts in `package.json`:

### Option A: Automated One-Line Release (Recommended)

1. **For bug fixes and minor corrections:**
   ```bash
   npm run release:patch
   ```

2. **For new features:**
   ```bash
   npm run release:minor
   ```

3. **For major architectural changes:**
   ```bash
   npm run release:major
   ```

Each command automatically:
- Increments version in `package.json` and `package-lock.json`.
- Runs `version-bump.mjs` to update `manifest.json` and `versions.json`.
- Commits the updated files.
- Creates an annotated Git tag without the `v` prefix.
- Pushes both `main` branch and the new tag to GitHub (`git push origin main --tags`).

### Option B: Manual Steps

If you prefer to perform the steps manually:

```bash
# 1. Bump version and update manifest/versions.json
npm version patch

# 2. Push commit and tag
git push origin main
git push origin --tags
```

---

## 4. Publishing the Release on GitHub

1. Once the tag is pushed, go to the [GitHub Actions Tab](https://github.com/open-mission/obsidian-open-bible/actions).
2. The `Release Obsidian plugin` workflow will build the bundle, generate the signed provenance attestation, and upload:
   - `main.js`
   - `manifest.json`
   - `styles.css`
3. Navigate to [Releases](https://github.com/open-mission/obsidian-open-bible/releases).
4. Edit the newly created draft release, review the release notes, and click **Publish release**.

---

## 5. Local Fallback with GitHub CLI

If you need to build and publish a release directly from your local machine without waiting for GitHub Actions:

```bash
npm run release:gh
```

This compiles the production bundle and uses `gh release create` to upload the release assets.
