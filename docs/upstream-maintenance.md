# Maintaining borrowed upstream components

Status: Installer and component inventory implemented; macOS application validation remains pending. See PROGRESS.md for the current verification record.

## Ownership model

Keep maintained source in this harness repository and expose the installed build through global Pi configuration. Use an owned global harness folder with distinct component boundaries. In particular, keep Firstmate-derived scripts together in their own folder rather than scattering them through global configuration or projects.

Deployment copies an explicit allowlist of owned files into `~/.pi/agent/harness/releases/<timestamp-id>/`. Global Pi settings reference that release as a local package. Runtime state stays in `~/.pi/agent/harness/state/`. `installation.json` records current and previous releases. No upstream distribution or development `.reference` tree is deployed.

For each component, choose and document one mode:

- Borrowed source: selected upstream files or functions, adapted and maintained here.
- Design reuse: locally implemented behavior or appearance inspired by a source, without claiming it is a copied implementation.
- Direct dependency: a pinned package, allowed when its full functionality is wanted or extraction is extremely difficult. Record why the exception applies.

## Record provenance before borrowing

Maintain a component inventory with upstream repository/package URL, exact source commit or package version, original paths, local destination paths, adoption mode, required dependencies, and local modifications with reasons. Include applicable license and attribution files alongside borrowed code. Record the last reviewed upstream revision separately from the revision actually incorporated.

Identify the upstream tests covering borrowed behavior and retain or adapt useful tests. Document assumptions about Pi APIs, Herdr commands, operating system behavior, and any other components the code relies on. The inventory starts when source is selected; do not invent pinned revisions before that inspection.

## Pulling upstream updates

1. Start from the inventory entry and compare its recorded upstream baseline with a chosen newer revision. Inspect only relevant paths and their dependencies through remote diffs or a disposable external reference checkout. The full upstream project is not installed into global Pi configuration.
2. Review fixes, dependency/API changes, and tests affecting the borrowed behavior. Choose the changes needed by this harness; an upstream release does not automatically expand local scope.
3. Make the update on a harness maintenance branch. For copied code, compare old upstream, new upstream, and the local adaptation so local changes are retained deliberately. Port patches into the owned component folder. Cherry-pick only when history and layout make it appropriate; otherwise apply a scoped adaptation.
4. For direct dependencies, update the pin and lockfile on that same maintenance branch, review the release diff, and validate the integrated behavior. Avoid floating versions in the maintained runtime.
5. Check the touched behavior and relevant interactions before updating global installation. Review rendering/mouse changes in Pi + Herdr + WezTerm; review supervision changes for silent context merges, wake delivery, concurrent user interaction, and cache preservation. Question-routing changes need a worker-to-Firstmate-to-user-to-worker check. Verify todo remains crew-only.
6. Update provenance, local modification notes, and the update log with what was adopted, intentionally omitted, and verified. Record the new baseline only for changes actually incorporated.
7. Deploy the tested harness revision through the chosen global installation mechanism and verify it loads from an existing project directory. Keep the previous installed revision available for rollback. Determine whether active sessions need restart or reload rather than assuming hot replacement is safe.

Do not run a blanket upstream pull over customized global files. Update frequency and any automated update checking are not yet specified.

## Commands

From a clean maintenance checkout, create a `codex/` maintenance branch. Inspect a selected upstream with `node scripts/upstream-inspect.mjs firstmate` to download its file index into the ignored `.reference/firstmate/` folder. Supply explicit file paths to inspect just those files. The helper inspects the current upstream head; it does not apply updates. Keep `upstream.json`'s incorporated revision unchanged until the relevant adaptation has been reviewed and tested.

For a pinned dependency, run `npm install --save-exact <package>@<chosen-version> --ignore-scripts --legacy-peer-deps`, inspect its changes, and run `npm test`. On macOS, deploy with `node scripts/install-macos.mjs`. Restart Pi sessions to load the new package; never assume a running crew adopted the replacement code. Complete the macOS checks before treating an update as accepted.

Roll back the harness with `node scripts/install-macos.mjs --rollback`. It swaps current and previous local package paths and preserves runtime state. Configuration backups are written beside Pi settings. This does not undo schema changes: inspect the release notes before running older code against state created by a newer schema.

Herdr Annotate is installed separately at its recorded commit. Restore a prior plugin commit using `herdr plugin install plannotator/herdr-annotate --ref <recorded-prior-commit> --yes`; restore only the relevant backed-up key bindings, then run `herdr config check` and reload the intended session. The annotation installer restores configuration on validation failure but leaves the plugin installed.

No-mistakes is installed under `harness/bin/` from the pinned macOS archive with a SHA-256 digest check. Replacing an existing binary preserves a timestamped previous copy. Binary rollback is separate from harness rollback; do not downgrade a running daemon or its database without checking upstream compatibility. The harness never automatically runs `no-mistakes init` across arbitrary projects; the assigned final reviewer initializes only the repository being validated.

## Debugging and rollback

Every deployed component should be identifiable by harness revision and upstream baseline. Keep runtime state and logs distinguishable from maintained scripts so diagnosing a session does not require editing vendored source in place.

If an update fails validation, keep the current installed version. If a deployed update regresses behavior, restore the previous harness revision and compatible dependency pins through the same deployment mechanism. Preserve project work and session state; handle any required state migration explicitly.

## Required implementation deliverables

- Component inventory containing actual selected files, revisions, dependencies, and adoption decisions.
- Dedicated Firstmate-derived script folder and clear component layout under global Pi configuration.
- License/attribution records for borrowed source.
- Working install/update/rollback instructions using the selected paths and deployment mechanism.
- A focused validation checklist for each adopted component and its interactions.
