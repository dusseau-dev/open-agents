# Fork changes — dusseau-dev/open-agents

This fork diverges from `vercel-labs/open-agents` in a small, recoverable way
to adapt to this deployment. Keep this doc updated when adding fork-specific
changes.

## What's different

| File | Change | Reason |
| --- | --- | --- |
| `packages/agent/models.ts` | Route inference through OpenRouter when `OPENROUTER_API_KEY` is set | Model variety + avoid Vercel AI Gateway credit limits |
| `apps/web/lib/ai-provider.ts` | New adapter — gateway-compatible OpenRouter wrapper | Central swap point so usage sites stay close to upstream |
| `apps/web/lib/models-with-context.ts` | Imports `aiProvider` adapter instead of `gateway` from `ai` | Model list comes from OpenRouter for consistency |
| `apps/web/lib/sandbox/config.ts` | `DEFAULT_SANDBOX_BASE_SNAPSHOT_ID` no longer hardcodes vercel-labs snapshot | That snapshot is team-scoped; unreachable from other teams |

## Required environment variables

Add these to your Vercel project:

- `OPENROUTER_API_KEY` — get from <https://openrouter.ai/keys>
- `VERCEL_SANDBOX_BASE_SNAPSHOT_ID` — optional; unset to use Vercel's default base image, or set to a snapshot owned by your team (see `scripts/vercel-refresh-base-snapshot.ts`)

All the standard upstream secrets (`POSTGRES_URL`, `JWE_SECRET`, `ENCRYPTION_KEY`, Vercel OAuth, GitHub App) are still required — see `apps/web/.env.example`.

## Syncing with upstream

```bash
git remote add upstream https://github.com/vercel-labs/open-agents.git  # one-time
git fetch upstream
git merge upstream/main
```

After the merge:

- If the merge leaves our patch intact → nothing to do.
- If upstream changed `packages/agent/models.ts` or `apps/web/lib/models-with-context.ts` → the **post-merge git hook** (see below) auto-re-applies our patch from `scripts/openrouter-patch.diff`.
- If the patch no longer applies cleanly (e.g. the surrounding code shifted) → the hook stops with a warning and points you at the patch file to resolve manually.

## Post-merge git hook

`scripts/githooks/post-merge` detects whether our OpenRouter changes are still present and re-applies them if not.

**Enable once after cloning:**

```bash
bash scripts/install-hooks.sh
```

This sets `core.hooksPath=scripts/githooks` — hooks are tracked in the repo, not stashed in the per-clone `.git/hooks/` dir.

### Regenerating the patch

If you make additional fork changes, refresh the saved patch:

```bash
git diff HEAD -- apps/web/lib/models-with-context.ts packages/agent/models.ts > scripts/openrouter-patch.diff
```

Commit the updated `.diff` with your changes.

## Deployment

Team: `starter-stack`
Project: `cloud-agents`
Production URL: <https://open-agents-mocha.vercel.app>

The Vercel OAuth app and GitHub App are team-scoped and their callbacks use
`open-agents-mocha.vercel.app`. If you change the production URL, update the
callback URLs on both apps and the `VERCEL_PROJECT_PRODUCTION_URL` env var.
