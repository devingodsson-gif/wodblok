# Public repo: what it means and how to close it again

The repository was made public on Oct 11 2026 so GitHub Actions minutes stop being a limit while WODBLOK is developed. The plan is to make it private again before WODBLOK is sold.

## What is true while it is public
- Anyone can read, clone and fork it. Clones are silent: GitHub does not say who made one.
- Nothing is protected by being unannounced; new public repos are indexed and scraped by bots quickly.
- Making the repo private later hides it, but cannot remove copies. Forks made while it was public stay public. Treat everything ever pushed as published.
- The code is not licensed: no licence file, so it stays all-rights-reserved. That gives legal protection only if the owner acts on it.
- The hosted site is separate. It stays behind Cloudflare Access (docs/hosting.md) until the owner decides to sell, because the site sends the whole app to anyone who can open it.

## What was checked on Oct 11 2026 (working tree of `main` at 1.1.0)
- No secrets, tokens or passwords, no owner email, no local file paths in the tree. The only email addresses are font authors in `src/fonts/licences/`.
- `tests/fixtures/` holds four real v18/v19 project files (about 1.5 MB). They contain no emails or paths, but they are the owner's own project data and are now public. Replace them with made-up samples if that matters.
- Not checked: the full git history (the working copy used for the check was a shallow clone of two commits).

## Before making it private again
1. Open Insights > Forks and Insights > Traffic (clones and visitors, last 14 days) and write down what they show.
2. Decide about `tests/fixtures/`: if the files should never have been public, replace them with made-up samples and tell the owner that older commits still contain them.
3. Search the whole history for secrets (for example with gitleaks or trufflehog on a full clone); rotate anything found.
4. Then: Settings > General > Danger Zone > Change repository visibility > private. Stars, watchers and any Pages site are lost.
5. Expect that forks, clones, caches and archives made while it was public may still exist. A DMCA takedown works for copies only where authorship is clear.
6. Keep the lean CI setup (docs/ci-budget-rules.md): on a private repo the free allowance is 2,000 minutes a month.

## Later, before selling
Check the open decisions in the repo plan (selling model, built-in motif sets), a trademark search for the name, a terms-of-service/licence for customers, and an attorney consult on copyright (AI-written code) and registration.
