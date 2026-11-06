// Guards backend checkout resolution after the 2026-11-06 repository split:
// the plugin lives in dsh-trading-transaq/dsh-ai-terminal, while the Go backend
// (cmd/terminal) stays in a txmlconnector checkout. Resolution must keep working
// for the pre-split layout, the sibling-checkout layout, an explicit repoDir and
// the DSH_AI_TERMINAL_REPO_DIR env override.

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

import { REPO_DIR_ENV, resolveRepoDir } from "../index.js";

function tempRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "ai-terminal-repo-"));
}

/** A fake txmlconnector checkout: <dir>/cmd/terminal/main.go. */
function checkout(dir) {
  fs.mkdirSync(path.join(dir, "cmd", "terminal"), { recursive: true });
  fs.writeFileSync(path.join(dir, "cmd", "terminal", "main.go"), "package main\n");
  return dir;
}

/** The plugin package directory of a checkout/repository: <root>/dsh-ai-terminal. */
function pluginPackage(root) {
  const dir = path.join(root, "dsh-ai-terminal");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

test("the env override name is stable", () => {
  assert.equal(REPO_DIR_ENV, "DSH_AI_TERMINAL_REPO_DIR");
});

test("configured repoDir wins over env and layout detection", () => {
  const root = tempRoot();
  try {
    const configured = checkout(path.join(root, "configured"));
    const envDir = checkout(path.join(root, "from-env"));
    checkout(root); // walk-up candidate
    assert.equal(
      resolveRepoDir({ configured, envDir, pluginRoot: pluginPackage(root) }),
      path.resolve(configured),
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("env override wins over walk-up and sibling detection", () => {
  const root = tempRoot();
  try {
    const envDir = checkout(path.join(root, "from-env"));
    checkout(root); // walk-up candidate
    assert.equal(
      resolveRepoDir({ envDir, pluginRoot: pluginPackage(root) }),
      path.resolve(envDir),
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("walk-up finds the pre-split monorepo checkout", () => {
  const root = tempRoot();
  try {
    checkout(root);
    assert.equal(resolveRepoDir({ pluginRoot: pluginPackage(root) }), path.resolve(root));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("split layout finds a sibling txmlconnector checkout", () => {
  const root = tempRoot();
  try {
    const splitRepo = path.join(root, "dsh-trading-transaq");
    const pluginRoot = pluginPackage(splitRepo);
    const backend = checkout(path.join(root, "txmlconnector"));
    assert.equal(resolveRepoDir({ pluginRoot }), path.resolve(backend));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("fallback is the parent of the plugin package", () => {
  const root = tempRoot();
  try {
    const splitRepo = path.join(root, "dsh-trading-transaq");
    const pluginRoot = pluginPackage(splitRepo);
    assert.equal(resolveRepoDir({ pluginRoot }), path.resolve(splitRepo));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
