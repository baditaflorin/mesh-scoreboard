import { expect, test, type Page } from "@playwright/test";
import { openTwoPeers } from "@baditaflorin/mesh-common/testing";
import { readFileSync } from "node:fs";

const pkg = JSON.parse(readFileSync(new URL("../../package.json", import.meta.url), "utf8")) as {
  name: string;
};

async function closeInitiallyOpenSettings(page: Page): Promise<void> {
  const settings = page.getByRole("dialog", { name: "Settings" });
  if (!(await settings.isVisible().catch(() => false))) return;
  const close = settings.getByRole("button", { name: "close" });
  if (await close.isVisible().catch(() => false)) await close.click();
  else await page.keyboard.press("Escape");
  await expect(settings).toBeHidden();
}

test("two peers see the same peer-attributed score ledger", async ({ browser, baseURL }) => {
  const { a, b, cleanup } = await openTwoPeers(browser, baseURL ?? "", {
    storagePrefix: pkg.name,
  });

  try {
    await Promise.all([closeInitiallyOpenSettings(a), closeInitiallyOpenSettings(b)]);

    await a.getByLabel("Player name").fill("Ari");
    await b.getByLabel("Player name").fill("Bea");
    await expect(b.getByText("Ari", { exact: true })).toBeVisible();
    await expect(a.getByText("Bea", { exact: true })).toBeVisible();

    await a.getByRole("button", { name: "Add 1 point" }).click();
    await expect(b.getByRole("list", { name: "Live score ledger" })).toContainText("Ari");
    await expect(b.getByRole("list", { name: "Live score ledger" })).toContainText("1");

    await b.getByRole("button", { name: "Add 2 points" }).click();
    await expect(a.getByRole("list", { name: "Live score ledger" })).toContainText("Bea");
    await expect(a.getByRole("list", { name: "Live score ledger" })).toContainText("2");

    await a.getByRole("button", { name: "Reset shared board" }).click();
    await expect(a.getByRole("button", { name: "Confirm reset shared board" })).toBeVisible();
    await a.getByRole("button", { name: "Confirm reset shared board" }).click();
    await expect(b.getByRole("list", { name: "Live score ledger" })).toContainText("0");
  } finally {
    await cleanup();
  }
});

test("the next-point control remains visible at phone and short desktop viewports", async ({
  page,
}, testInfo) => {
  for (const viewport of [
    { width: 390, height: 844, name: "phone" },
    { width: 1141, height: 602, name: "desktop" },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("./", { waitUntil: "domcontentloaded" });
    await closeInitiallyOpenSettings(page);

    await expect(page.locator("[data-mesh-app-shell]")).toHaveAttribute(
      "data-mesh-visual-profile",
      "play",
    );
    await expect(page.locator("[data-mesh-app-shell]")).toHaveAttribute(
      "data-mesh-shell-layout",
      "inset",
    );

    const action = page.getByRole("button", { name: "Add 1 point" });
    await expect(action).toBeVisible();
    const box = await action.boundingBox();
    expect(box, `missing score action at ${viewport.width}×${viewport.height}`).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width + 1);
    expect(box!.y).toBeGreaterThanOrEqual(0);
    expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height + 1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      viewport.width,
    );

    await page.screenshot({
      path: testInfo.outputPath(`scoreboard-${viewport.name}.png`),
      fullPage: false,
    });
  }
});

test("score controls and live updates have a clear accessible contract", async ({ page }) => {
  await page.goto("./", { waitUntil: "domcontentloaded" });
  await closeInitiallyOpenSettings(page);

  await expect(page.getByRole("main")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Keep every point in view." })).toBeVisible();
  await expect(page.getByRole("button", { name: "Add 1 point" })).toBeEnabled();
  await expect(page.getByRole("button", { name: "Add 2 points" })).toBeEnabled();
  await expect(page.getByRole("button", { name: "Remove 1 point" })).toBeEnabled();
  await expect(page.getByRole("list", { name: "Live score ledger" })).toBeVisible();
  await expect(page.getByRole("status").last()).toBeVisible();
});
