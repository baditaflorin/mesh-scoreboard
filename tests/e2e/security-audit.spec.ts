import { appendFileSync, existsSync, mkdirSync, readFileSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { openTwoPeers } from "@baditaflorin/mesh-common/testing";

const pkg = JSON.parse(readFileSync(new URL("../../package.json", import.meta.url), "utf8")) as {
  name: string;
};
const auditFile =
  process.env["MESH_AUDIT_FILE"] ?? join(tmpdir(), "mesh-scoreboard-security-audit-e2e.jsonl");

function audit(entry: {
  id: string;
  claim: string;
  method: string;
  evidence?: Record<string, unknown>;
}) {
  appendFileSync(auditFile, JSON.stringify({ ...entry, result: "pass", ts: Date.now() }) + "\n");
}

async function closeInitiallyOpenSettings(page: Page): Promise<void> {
  const settings = page.getByRole("dialog", { name: "Settings" });
  if (!(await settings.isVisible().catch(() => false))) return;
  const close = settings.getByRole("button", { name: "close" });
  if (await close.isVisible().catch(() => false)) await close.click();
  else await page.keyboard.press("Escape");
  await expect(settings).toBeHidden();
}

test.beforeAll(() => {
  mkdirSync(tmpdir(), { recursive: true });
  if (existsSync(auditFile)) unlinkSync(auditFile);
});

test.afterAll(() => {
  appendFileSync(
    auditFile,
    JSON.stringify({ id: "AUDIT.summary", completedAt: Date.now() }) + "\n",
  );
});

test("UI.SCOREBOARD.resetNeedsConfirmation — one click never clears a peer board", async ({
  browser,
  baseURL,
}) => {
  const { a, b, cleanup } = await openTwoPeers(browser, baseURL ?? "", {
    storagePrefix: pkg.name,
  });
  try {
    await Promise.all([closeInitiallyOpenSettings(a), closeInitiallyOpenSettings(b)]);
    await a.getByRole("button", { name: "Add 1 point" }).click();
    await expect(b.getByRole("list", { name: "Live score ledger" })).toContainText("1");

    await a.getByRole("button", { name: "Reset shared board" }).click();
    await expect(a.getByRole("button", { name: "Confirm reset shared board" })).toBeVisible();
    await expect(b.getByRole("list", { name: "Live score ledger" })).toContainText("1");

    audit({
      id: "UI.SCOREBOARD.resetNeedsConfirmation",
      claim: "A single reset click cannot erase shared room scores.",
      method: "Score on peer A, press reset once, and verify peer B still sees the score.",
      evidence: { firstClickLeavesSharedScoreIntact: true },
    });
  } finally {
    await cleanup();
  }
});

test("UI.SCOREBOARD.confirmedResetSyncs — an intentional clear reaches every peer", async ({
  browser,
  baseURL,
}) => {
  const { a, b, cleanup } = await openTwoPeers(browser, baseURL ?? "", {
    storagePrefix: pkg.name,
  });
  try {
    await Promise.all([closeInitiallyOpenSettings(a), closeInitiallyOpenSettings(b)]);
    await a.getByRole("button", { name: "Add 2 points" }).click();
    await expect(b.getByRole("list", { name: "Live score ledger" })).toContainText("2");

    await a.getByRole("button", { name: "Reset shared board" }).click();
    await a.getByRole("button", { name: "Confirm reset shared board" }).click();
    await expect(b.getByRole("list", { name: "Live score ledger" })).toContainText("0");

    audit({
      id: "UI.SCOREBOARD.confirmedResetSyncs",
      claim: "A confirmed room reset is explicit and has one shared result for all peers.",
      method: "Score on peer A, confirm reset, then assert peer B renders zero.",
      evidence: { confirmedSharedReset: true },
    });
  } finally {
    await cleanup();
  }
});
