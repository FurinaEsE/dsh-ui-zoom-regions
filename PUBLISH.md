# Publishing dsh-ui-zoom-regions

> **STATUS — done as of 2026-10-19.** The repository exists and is public
> (`FurinaEsE/dsh-ui-zoom-regions`), npm is published (`latest = 1.2.0`), and the market entry is an
> open PR ([#8027](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin/pull/8027)) with green CI,
> waiting on a maintainer merge. The steps below are kept as the release runbook — read them as
> "how it was done", not "what is left".
>
> One correction to the original text below: a first publish with a bypass-2FA granular token is
> **staged** — the registry only shows a `0.0.0-stage` placeholder, the real version waits in
> staging, and it may not appear on the Staged Packages page at all (it did not, here). It went live
> only after the package's *Publishing access* was switched to **"Require two-factor authentication
> or a granular access token with bypass 2fa enabled"** (package → Settings). The CLI cannot do it:
> `npm access set mfa=automation` answers 403 with a bypass token.

## 0. Placeholder — already filled

The `OWNER` placeholder is filled with **`FurinaEsE`**: `package.json` (`repository`, `homepage`,
`bugs`), `README.md` (install commands) and the submission entry
`submission/FurinaEsE__dsh-ui-zoom-regions.yml`. The local repository is initialised and committed,
with `origin` already pointing at `https://github.com/FurinaEsE/dsh-ui-zoom-regions.git`, so step 1
is down to creating the repository on GitHub and pushing (or letting VS Code do both).

To use a different account, replace the string in those three files and rename the submission entry
to `<owner>__dsh-ui-zoom-regions.yml`.

## 1. Create the repository and push

The package sits at the **repository root** — that is what the registry expects for a single-package
repo. The local repository is already initialised, committed and has **no remote configured on
purpose**: VS Code only offers its *Publish to GitHub* flow (create repository + push, with its own
sign-in) while no remote exists. Pointing `origin` at a repository that does not exist yet makes the
Source Control button fall back to a plain `git push`, which fails with `Repository not found`.

**Route A — VS Code does both.** Source Control → **Publish to GitHub** → **Public** (the registry
only lists public repositories). VS Code creates `FurinaEsE/dsh-ui-zoom-regions` and pushes `main`.

**Route B — create it on the web first**, then wire the remote up:

```powershell
# after creating an empty public repo named dsh-ui-zoom-regions on github.com
git remote add origin https://github.com/FurinaEsE/dsh-ui-zoom-regions.git
git push -u origin main
```

From scratch (not needed here — the commit already exists):

```powershell
git init -b main
git add -A
git commit -m "feat: per-region UI zoom for DeepSeek Harness 1.0.0"
git remote add origin https://github.com/FurinaEsE/dsh-ui-zoom-regions.git
git push -u origin main
```

Then add the required topic (GitHub web UI: repo → About → Topics, or with `gh`):

```powershell
gh repo edit FurinaEsE/dsh-ui-zoom-regions --add-topic dsh-plugin
```

Sanity check that it installs from the public repo:

```powershell
dsh plugin --profile web add github:FurinaEsE/dsh-ui-zoom-regions
```

## 2. Optional: a prebuilt tarball on a GitHub Release

Recommended when not publishing to npm: storefronts then offer the tarball instead of building from
source.

```powershell
pnpm pack                       # -> dsh-ui-zoom-regions-1.0.0.tgz
```

Attach that file to a GitHub Release tagged `v1.0.0`, then add to the entry:

```yaml
tarball: https://github.com/FurinaEsE/dsh-ui-zoom-regions/releases/download/v1.0.0/dsh-ui-zoom-regions-1.0.0.tgz
```

A tag-pinned URL is used here on purpose: `releases/latest/download/<versioned-name>.tgz` works on
the day you write it and 404s after your next release.

## 3. Optional: publish to npm

Listing does not depend on npm; it only adds a download count in storefronts.

```powershell
npm login
npm publish --access public
```

- `package.json` → `repository` must point at the GitHub repository above, otherwise the two are not
  linked.
- Do **not** add an `npm:` field to the registry entry — the mapping is collected automatically and a
  hand-written key is rejected.
- No install scripts are shipped, so users install without a build-approval prompt.

## 4. Submit to the curated list (this is what puts it in the market)

The market reads `awesome-dsh-plugin.com/plugins.json`, which is generated from
[`awesome-dsh-plugin/awesome-dsh-plugin`](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin).
A submission is **one file**:

```powershell
gh repo fork awesome-dsh-plugin/awesome-dsh-plugin --clone
# copy submission/FurinaEsE__dsh-ui-zoom-regions.yml to data/plugins/FurinaEsE__dsh-ui-zoom-regions.yml
git checkout -b add-dsh-ui-zoom-regions
git add data/plugins/FurinaEsE__dsh-ui-zoom-regions.yml
git commit -m "Add FurinaEsE/dsh-ui-zoom-regions"
git push -u origin add-dsh-ui-zoom-regions
gh pr create --repo awesome-dsh-plugin/awesome-dsh-plugin
```

Without `gh`, the same submission is four clicks on github.com: fork the repository, **Add file → Create
new file** at `data/plugins/FurinaEsE__dsh-ui-zoom-regions.yml`, paste the contents of the submission
entry in this directory, then **Contribute → Open pull request**.

Rules that matter here (from `contributing.md`):

- Do **not** edit the READMEs by hand; only the one `data/plugins/*.yml` file.
- The repo must be **at least 1 day old** when CI runs — open the PR the day after creating it.
- `dsh.bundle` must be declared (it is) — `dsh.client` alone is the most common rejection reason.
- The description is checked against the code; it must stay accurate.
- The description contains ` — ` (em dash), not `: `, so the YAML needs no quoting. If you rewrite it
  with a colon-space, quote the whole line.

## 5. Optional: screenshots

Storefronts show screenshots. Declare them in **your own repository** — `screenshots.json` next to
`package.json`, 1–8 relative image paths:

```json
["assets/screenshot-1.png", "assets/screenshot-2.png"]
```

No declaration is fine too: storefronts then fall back to images in your README.

## What is intentionally left out

- **No `peerDependencies` on `@deepseek-ai/*`.** The package imports nothing from the harness — the
  browser half is plain JavaScript and resolves services through `ctx` — so a peer range would only
  add install friction (including the prerelease-range pitfall described in `contributing.md`).
- **No build step.** `lib/*.js` ships as-is.
