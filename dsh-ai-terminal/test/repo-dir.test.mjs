// Guards backend checkout resolution after the 2026-11-06 repository split:
// the plugin lives in dsh-trading-transaq/dsh-ai-terminal, while the Go backend
// (cmd/terminal) stays in a txmlconnector checkout. Resolution must keep working
// for the pre-split layout, the sibling-checkout layout, an explicit repoDir and
// the DSH_AI_TERMINAL_REPO_DIR env override — and must fail loudly, not silently
// build in the wrong directory, when no checkout can be found.

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

import { REPO_DIR_ENV, resolveRepoDir } from "../index.js";

const MISSING = /checkout txmlconnector не найден/;

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

test("an invalid configured repoDir is rejected instead of used blindly", () => {
  const root = tempRoot();
  try {
    const envDir = checkout(path.join(root, "from-env"));
    checkout(root);
    assert.throws(
      () => resolveRepoDir({ configured: path.join(root, "missing"), envDir, pluginRoot: pluginPackage(root) }),
      MISSING,
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("an invalid env override is rejected instead of falling back silently", () => {
  const root = tempRoot();
  try {
    checkout(root); // a valid walk-up candidate must not mask a broken override
    assert.throws(
      () => resolveRepoDir({ envDir: path.join(root, "missing"), pluginRoot: pluginPackage(root) }),
      MISSING,
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("env override wins over walk-up and sibling detection", () => {
  const root = tempRoot();
  try {
    const splitRepo = path.join(root, "dsh-trading-transaq");
    const pluginRoot = pluginPackage(splitRepo);
    const envDir = checkout(path.join(root, "from-env"));
    checkout(root); // walk-up candidate
    checkout(path.join(root, "txmlconnector")); // sibling candidate
    assert.equal(resolveRepoDir({ envDir, pluginRoot }), path.resolve(envDir));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("walk-up wins over a sibling checkout", () => {
  const root = tempRoot();
  try {
    const monorepo = checkout(path.join(root, "monorepo"));
    checkout(path.join(root, "txmlconnector")); // sibling candidate
    const pluginRoot = pluginPackage(monorepo);
    assert.equal(resolveRepoDir({ pluginRoot }), path.resolve(monorepo));
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

test("a missing checkout throws with an actionable message", () => {
  const root = tempRoot();
  try {
    const pluginRoot = pluginPackage(path.join(root, "dsh-trading-transaq"));
    assert.throws(() => resolveRepoDir({ pluginRoot }), MISSING);
    assert.throws(() => resolveRepoDir({ pluginRoot, configured: "", envDir: "" }), MISSING);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
