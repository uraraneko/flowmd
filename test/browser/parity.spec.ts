import { expect, test, type Page } from "@playwright/test";

async function render(
  page: Page,
  source: string,
  options: Record<string, unknown> = {},
) {
  await page.evaluate(
    async ({ source, options }) => {
      await (window as any).streamdownTest.render(source, options);
    },
    { source, options },
  );
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.waitForFunction(() => Boolean((window as any).streamdownTest));
});

test("streamed text and code render immediately and finish with the same content", async ({
  page,
}) => {
  for (const source of [
    "Hello **wor",
    "Hello **world**\n\n```ts\nconst a",
    "Hello **world**\n\n```ts\nconst answer = 42;\n``` ",
  ]) {
    await render(page, source, { isAnimating: true, caret: "block" });
    await expect(page.locator("#vue")).toHaveText(
      await page.locator("#react").innerText(),
      { useInnerText: true },
    );
  }
  await render(page, "Hello **world**\n\n```ts\nconst answer = 42;\n```", {
    isAnimating: false,
  });
  await expect(
    page.locator('#vue [data-streamdown="code-block-copy-button"]'),
  ).toBeEnabled();
  await expect(page.locator("#vue")).toHaveText(
    await page.locator("#react").innerText(),
    { useInnerText: true },
  );
});

test("link confirmation uses the configured overlay target and closes with Escape", async ({
  page,
}) => {
  await render(page, "[Example](https://example.com)");
  await page.locator('#vue [data-streamdown="link"]').click();
  await expect(
    page.locator('#vue-overlays [data-streamdown="link-safety-modal"]'),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(
    page.locator('#vue-overlays [data-streamdown="link-safety-modal"]'),
  ).toHaveCount(0);
  await page.locator('#react [data-streamdown="link"]').click();
  await expect(
    page.locator('#react-overlays [data-streamdown="link-safety-modal"]'),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(
    page.locator('#react-overlays [data-streamdown="link-safety-modal"]'),
  ).toHaveCount(0);
});

test("real syntax highlighting, math and Mermaid plugins render", async ({
  page,
}) => {
  await render(
    page,
    "中文 **强调**。\n\n$$\nx^2 + y^2 = z^2\n$$\n\n```ts\nconst value = 42;\n```\n\n```mermaid\ngraph TD\n  A[Start] --> B[Done]\n```",
    { rich: true },
  );
  for (const id of ["react", "vue"]) {
    await expect(page.locator(`#${id} .katex`)).toBeVisible();
    await expect(
      page.locator(`#${id} [data-streamdown="mermaid"] [role="img"] > svg`),
    ).toBeVisible({ timeout: 15000 });
    await expect(
      page.locator(`#${id} [data-streamdown="code-block-body"]`),
    ).toContainText("const value = 42;");
    await expect(page.locator(`#${id} [data-streamdown="strong"]`)).toHaveText(
      "强调",
    );
  }
});

test("bounded code blocks allow a user to scroll up during streaming", async ({
  page,
}) => {
  const source =
    "```text\n" + Array.from({ length: 100 }, (_, i) => `line ${i}`).join("\n");
  await render(page, source, { isAnimating: true, codeBlockMaxHeight: 120 });
  for (const id of ["react", "vue"]) {
    const body = page.locator(`#${id} [data-streamdown="code-block-body"]`);
    await expect(body).toHaveCSS("max-height", "120px");
    await body.evaluate((element) => {
      element.scrollTop = 0;
      element.dispatchEvent(new Event("scroll"));
    });
  }
  await render(page, source + "\nlast line", {
    isAnimating: true,
    codeBlockMaxHeight: 120,
  });
  for (const id of ["react", "vue"]) {
    await expect
      .poll(() =>
        page
          .locator(`#${id} [data-streamdown="code-block-body"]`)
          .evaluate((element) => element.scrollTop),
      )
      .toBe(0);
  }
});

test("code and table copy controls produce the same clipboard formats", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await render(
    page,
    "```js\nconst value = 42;\n```\n\n| Name | Value |\n| - | - |\n| A | 1 |",
    { controls: { table: { csvSeparator: ";" } } },
  );
  const copies: Record<string, string[]> = {};
  for (const id of ["react", "vue"]) {
    const root = page.locator(`#${id}`);
    const values: string[] = [];
    await root.locator('[data-streamdown="code-block-copy-button"]').click();
    values.push(await page.evaluate(() => navigator.clipboard.readText()));
    for (const title of [
      "Copy table as Markdown",
      "Copy table as CSV",
      "Copy table as TSV",
    ]) {
      await root.getByTitle("Copy table", { exact: true }).click();
      await root.getByTitle(title, { exact: true }).click();
      await expect(root.getByTitle(title, { exact: true })).toHaveCount(0);
      values.push(await page.evaluate(() => navigator.clipboard.readText()));
    }
    copies[id] = values;
  }
  expect(copies.vue).toEqual(copies.react);
  expect(copies.vue[0]).toContain("const value = 42;");
  expect(copies.vue[2]).toContain("Name;Value");
});

test("downloads preserve code and table filenames and bytes", async ({
  page,
}) => {
  const { readFile } = await import("node:fs/promises");
  await render(
    page,
    "```js\nconst value = 42;\n```\n\n| Name | Value |\n| - | - |\n| A | 1 |",
    {
      controls: {
        code: { download: { filename: "snippet" } },
        table: { download: { filename: "report" }, csvSeparator: ";" },
      },
    },
  );
  const saved: Record<string, { name: string; text: string }[]> = {};
  for (const id of ["react", "vue"]) {
    const root = page.locator(`#${id}`);
    const values: { name: string; text: string }[] = [];
    const save = async (click: () => Promise<void>) => {
      const downloaded = page.waitForEvent("download");
      await click();
      const download = await downloaded;
      values.push({
        name: download.suggestedFilename(),
        text: await readFile((await download.path())!, "utf8"),
      });
    };
    await save(() =>
      root.locator('[data-streamdown="code-block-download-button"]').click(),
    );
    for (const title of [
      "Download table as CSV",
      "Download table as Markdown",
    ]) {
      await root.getByTitle("Download table", { exact: true }).click();
      await save(() => root.getByTitle(title, { exact: true }).click());
    }
    saved[id] = values;
  }
  expect(saved.vue).toEqual(saved.react);
  expect(saved.vue.map((file) => file.name)).toEqual([
    "snippet.js",
    "report.csv",
    "report.md",
  ]);
});

test("table fullscreen retains copy controls and releases its body lock", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await render(page, "| Name | Value |\n| - | - |\n| A | 1 |");
  const values: string[] = [];
  for (const id of ["react", "vue"]) {
    await page
      .locator(`#${id}`)
      .getByTitle("View fullscreen", { exact: true })
      .click();
    const dialog = page.locator(
      `#${id}-overlays [data-streamdown="table-fullscreen"]`,
    );
    await expect(dialog).toBeVisible();
    await expect(page.locator("body")).toHaveCSS("overflow", "hidden");
    await dialog.getByTitle("Copy table", { exact: true }).click();
    await dialog.getByTitle("Copy table as Markdown", { exact: true }).click();
    await expect(
      dialog.getByTitle("Copy table as Markdown", { exact: true }),
    ).toHaveCount(0);
    values.push(await page.evaluate(() => navigator.clipboard.readText()));
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
  }
  expect(values[1]).toEqual(values[0]);
  expect(values[1]).toContain("Name");
});

test("Mermaid fullscreen provides copy, downloads, zoom, reset and portal dismissal", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await render(page, "```mermaid\ngraph TD\n  A[Start] --> B[Done]\n```", {
    rich: true,
  });
  for (const id of ["react", "vue"]) {
    await expect(page.locator(`#${id} [role="img"] > svg`)).toBeVisible();
    await page
      .locator(`#${id}`)
      .getByTitle("View fullscreen", { exact: true })
      .click();
    const dialog = page.locator(
      `#${id}-overlays [data-streamdown="mermaid-fullscreen"]`,
    );
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('[role="img"] > svg')).toBeVisible();
    await expect(
      dialog.getByTitle("Download diagram", { exact: true }),
    ).toBeVisible();
    await dialog.getByTitle("Copy Code", { exact: true }).click();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toContain(
      "graph TD",
    );
    const diagram = dialog.locator('[role="application"]');
    const initial = await diagram.evaluate(
      (element) => (element as HTMLElement).style.transform,
    );
    await dialog.getByTitle("Zoom in", { exact: true }).click();
    await expect
      .poll(() =>
        diagram.evaluate((element) => (element as HTMLElement).style.transform),
      )
      .not.toBe(initial);
    await dialog.getByTitle("Reset zoom and pan", { exact: true }).click();
    await expect
      .poll(() =>
        diagram.evaluate((element) => (element as HTMLElement).style.transform),
      )
      .toBe(initial);
    await dialog.getByTitle("Exit fullscreen", { exact: true }).click();
    await expect(dialog).toHaveCount(0);
    await page
      .locator(`#${id}`)
      .getByTitle("View fullscreen", { exact: true })
      .click();
    await expect(dialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
  }
  await page.screenshot({
    path: "test-results/mermaid-parity.png",
    fullPage: true,
  });
});

test("wide Mermaid diagrams fit, resize and preserve user zoom consistently", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  const nodes = Array.from(
    { length: 18 },
    (_, index) => `N${index}[Step ${index}]`,
  );
  await render(page, "```mermaid\ngraph LR\n" + nodes.join(" --> ") + "\n```", {
    rich: true,
  });
  for (const id of ["react", "vue"])
    await expect(page.locator(`#${id} [role="img"] > svg`)).toBeVisible();
  const scale = (id: string) =>
    page
      .locator(`#${id} [role="application"]`)
      .evaluate(
        (element) => new DOMMatrix((element as HTMLElement).style.transform).a,
      );
  await expect
    .poll(async () => Math.abs((await scale("react")) - (await scale("vue"))))
    .toBeLessThan(0.0001);
  expect(await scale("vue")).toBeLessThan(1);
  await page.setViewportSize({ width: 960, height: 640 });
  await expect
    .poll(async () => Math.abs((await scale("react")) - (await scale("vue"))))
    .toBeLessThan(0.0001);
  const before = await scale("vue");
  for (const id of ["react", "vue"])
    await page.locator(`#${id}`).getByTitle("Zoom in", { exact: true }).click();
  const userZoom = await scale("vue");
  expect(userZoom).toBeGreaterThan(before);
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect.poll(() => scale("vue")).toBeCloseTo(userZoom, 4);
  await expect
    .poll(async () => Math.abs((await scale("react")) - (await scale("vue"))))
    .toBeLessThan(0.0001);
  for (const id of ["react", "vue"])
    await page
      .locator(`#${id}`)
      .getByTitle("Reset zoom and pan", { exact: true })
      .click();
  await expect
    .poll(async () => Math.abs((await scale("react")) - (await scale("vue"))))
    .toBeLessThan(0.0001);
});

test("loaded images preserve download bytes, controls and broken-image fallbacks", async ({
  page,
}) => {
  const { readFile } = await import("node:fs/promises");
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aF1sAAAAASUVORK5CYII=",
    "base64",
  );
  await page.route("**/asset.png", (route) =>
    route.fulfill({ body: png, contentType: "image/png" }),
  );
  await page.route("**/missing.png", (route) =>
    route.fulfill({ status: 404, body: "Missing image" }),
  );
  const source = '<img src="/asset.png" width="160" height="80" alt="Chart">';
  await render(page, source);
  for (const id of ["react", "vue"]) {
    const root = page.locator(`#${id}`);
    await expect(root.locator("img")).toHaveJSProperty("naturalWidth", 1);
    const button = root.getByTitle("Download image", { exact: true });
    await expect(button).toHaveClass(/\bend-2\b/);
    await root.locator('[data-streamdown="image-wrapper"]').hover();
    const downloading = page.waitForEvent("download");
    await button.click();
    const download = await downloading;
    expect(download.suggestedFilename()).toBe("asset.png");
    expect(await readFile((await download.path())!)).toEqual(png);
  }
  await render(page, source + "\n\nDisabled controls.", {
    controls: { image: { download: false } },
  });
  for (const id of ["react", "vue"])
    await expect(
      page.locator(`#${id}`).getByTitle("Download image", { exact: true }),
    ).toHaveCount(0);
  await render(page, "![Broken](/missing.png)");
  for (const id of ["react", "vue"]) {
    await expect(
      page.locator(`#${id} [data-streamdown="image-fallback"]`),
    ).toHaveText("Image not available");
    await expect(page.locator(`#${id} img`)).toBeHidden();
  }
});
