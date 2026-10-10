# Going live

`main` is hosted on Cloudflare, so a merge into `main` is live on wodblok.com. Only go live when the user says so for that release.

## Before
- CI green on the release branch (tests workflow: Chromium and WebKit).
- Version bumped, outcome written in docs/fix-plan.md.
- The user has looked at the preview artifact.

## Going live
Merge the release branch (or its pull request) into `main`. The tag workflow adds `vX.Y.Z` on the commit that carries the new version.

## Undoing a release
Revert the merge commit on a new branch, then go live with the revert:

    git checkout -b revert/X.Y.Z main
    git revert -m 1 <merge commit of X.Y.Z>
    git push -u origin revert/X.Y.Z

Open a pull request, check CI, merge. Do not force-push `main` and do not delete tags. The reverted version keeps its tag; the next release gets the next number.

## Protecting `main` (a one-off setting for the repo owner)
GitHub > Settings > Branches > add a rule for `main`: require a pull request before merging, and require the status checks `chromium` and `webkit` to pass. Without this nothing technical stops a direct push to `main`.
