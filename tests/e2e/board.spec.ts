import { expect, test, type Page } from "@playwright/test";

function taskCardByTitle(page: Page, title: string) {
  return page.locator('[data-testid^="task-card-"]').filter({ hasText: title }).first();
}

async function createTaskInColumn(page: Page, columnId: string, title: string, description: string) {
  const column = page.getByTestId(`board-column-${columnId}`);

  await column.getByRole("button", { name: /add task/i }).click();
  await page.getByLabel("Title").fill(title);
  await page.getByLabel("Description").fill(description);
  await page.getByRole("button", { name: /create task/i }).click();
}

function dragSurface(locator: ReturnType<typeof taskCardByTitle>) {
  return locator.locator('[data-testid^="task-card-drag-surface-"]');
}

async function dragTaskToColumn(page: Page, title: string, columnId: string) {
  const sourceHandle = dragSurface(taskCardByTitle(page, title));
  const targetColumn = page.getByTestId(`board-column-${columnId}`);

  const sourceBox = await sourceHandle.boundingBox();
  const targetBox = await targetColumn.boundingBox();

  if (!sourceBox || !targetBox) {
    throw new Error(`Could not resolve drag geometry for task "${title}".`);
  }

  await page.mouse.move(
    sourceBox.x + sourceBox.width / 2,
    sourceBox.y + sourceBox.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    sourceBox.x + sourceBox.width / 2 + 24,
    sourceBox.y + sourceBox.height / 2 + 24,
    { steps: 12 },
  );
  await page.mouse.move(targetBox.x + 120, targetBox.y + 200, { steps: 32 });
  await page.waitForTimeout(150);
  await page.mouse.up();
}

async function reorderTaskAbove(page: Page, movingTitle: string) {
  await taskCardByTitle(page, movingTitle)
    .getByRole("button", { name: /move task up/i })
    .click();
}

test("board supports create, edit, drag, reorder, persistence, and realtime sync", async ({
  browser,
}) => {
  const contextOne = await browser.newContext();
  const contextTwo = await browser.newContext();
  const pageOne = await contextOne.newPage();
  const pageTwo = await contextTwo.newPage();

  await Promise.all([pageOne.goto("/"), pageTwo.goto("/")]);

  await pageOne.locator('[data-testid^="user-option-"]').nth(0).click();
  await pageTwo.locator('[data-testid^="user-option-"]').nth(1).click();

  await createTaskInColumn(
    pageOne,
    "TODO",
    "Ship realtime board",
    "Validate the full cross-session workflow.",
  );

  await expect(
    pageTwo.getByTestId("board-column-TODO").getByText("Ship realtime board"),
  ).toBeVisible();

  const pageTwoCard = taskCardByTitle(pageTwo, "Ship realtime board");
  await pageTwoCard.getByRole("button", { name: /edit/i }).click();
  await pageTwo.getByLabel("Title").fill("Ship realtime board v2");
  await pageTwo.getByLabel("Description").fill("Edited from the second client.");
  await pageTwo.getByRole("button", { name: /save changes/i }).click();

  await expect(taskCardByTitle(pageOne, "Ship realtime board v2")).toBeVisible();

  await dragTaskToColumn(pageOne, "Ship realtime board v2", "IN_PROGRESS");

  await expect(
    pageOne.getByTestId("board-column-IN_PROGRESS").getByText("Ship realtime board v2"),
  ).toBeVisible();
  await expect(
    pageTwo.getByTestId("board-column-IN_PROGRESS").getByText("Ship realtime board v2"),
  ).toBeVisible();

  await createTaskInColumn(
    pageOne,
    "IN_PROGRESS",
    "Add activity coverage",
    "Track who changed each task in realtime.",
  );

  await expect(taskCardByTitle(pageOne, "Add activity coverage")).toBeVisible();

  await reorderTaskAbove(pageOne, "Add activity coverage");

  await expect(
    pageOne
      .getByTestId("board-column-IN_PROGRESS")
      .locator('[data-testid^="task-card-"]')
      .first(),
  ).toContainText("Add activity coverage");
  await expect(
    pageTwo
      .getByTestId("board-column-IN_PROGRESS")
      .locator('[data-testid^="task-card-"]')
      .first(),
  ).toContainText("Add activity coverage");

  await pageOne.reload();

  await expect(
    pageOne
      .getByTestId("board-column-IN_PROGRESS")
      .locator('[data-testid^="task-card-"]')
      .first(),
  ).toContainText("Add activity coverage");

  await contextOne.close();
  await contextTwo.close();
});
