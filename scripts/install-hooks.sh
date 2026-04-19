#!/usr/bin/env bash
#
# Install fork-local git hooks by pointing core.hooksPath at scripts/githooks.
# Run once after cloning:
#
#   bash scripts/install-hooks.sh
#
# This is idempotent — safe to re-run.

set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

HOOKS_PATH="scripts/githooks"

git config core.hooksPath "$HOOKS_PATH"
chmod +x "$HOOKS_PATH"/*

echo "[install-hooks] core.hooksPath set to $HOOKS_PATH"
echo "[install-hooks] Hooks installed:"
ls -1 "$HOOKS_PATH"
