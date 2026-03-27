import { expect, test, type Page } from "@playwright/test";

const realtimeTimeout = 15_000;

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

async function moveTaskRight(page: Page, title: string) {
  const card = taskCardByTitle(page, title);

  await card.hover();
  await card.getByRole("button", { name: /move task right/i }).click({
    force: true,
  });
}

test("board supports create, edit, status changes, persistence, delete, and realtime sync", async ({
  browser,
}) => {
  const contextOne = await browser.newContext();
  const contextTwo = await browser.newContext();
  const pageOne = await contextOne.newPage();
  const pageTwo = await contextTwo.newPage();

  await Promise.all([pageOne.goto("/"), pageTwo.goto("/")]);

  await pageOne.locator('[data-testid^="user-option-"]').nth(2).click();
  await expect(pageOne.getByRole("button", { name: /new task/i })).toBeDisabled();
  await pageOne.getByRole("button", { name: /about roles/i }).click();
  await expect(
    pageOne.locator("aside").filter({ hasText: "Role Access" }).first(),
  ).toBeVisible();
  await expect(pageOne.getByText("QA Analyst").first()).toBeVisible();
  await pageOne.getByRole("button", { name: /about roles/i }).click();

  await pageOne.locator('[data-testid^="user-option-"]').nth(0).click();
  await pageTwo.locator('[data-testid^="user-option-"]').nth(1).click();
  await expect(pageOne.getByRole("button", { name: /new task/i })).toBeEnabled();

  await createTaskInColumn(
    pageOne,
    "TODO",
    "Ship realtime board",
    "Validate the full cross-session workflow.",
  );

  await expect(
    pageTwo.getByTestId("board-column-TODO").getByText("Ship realtime board"),
  ).toBeVisible({ timeout: realtimeTimeout });

  const pageTwoCard = taskCardByTitle(pageTwo, "Ship realtime board");
  await pageTwoCard.getByRole("button", { name: /edit/i }).click();
  await pageTwo.getByLabel("Title").fill("Ship realtime board v2");
  await pageTwo.getByLabel("Description").fill("Edited from the second client.");
  await pageTwo.getByRole("button", { name: /save changes/i }).click();

  await expect(taskCardByTitle(pageOne, "Ship realtime board v2")).toBeVisible({
    timeout: realtimeTimeout,
  });

  await pageTwoCard.hover();
  await expect(pageTwoCard.getByRole("button", { name: /delete task/i })).toHaveCount(0);

  await moveTaskRight(pageOne, "Ship realtime board v2");

  await expect(
    pageOne.getByTestId("board-column-IN_PROGRESS").getByText("Ship realtime board v2"),
  ).toBeVisible({ timeout: realtimeTimeout });
  await expect(
    pageTwo.getByTestId("board-column-IN_PROGRESS").getByText("Ship realtime board v2"),
  ).toBeVisible({ timeout: realtimeTimeout });

  await pageOne.reload();

  await expect(
    pageOne.getByTestId("board-column-IN_PROGRESS").getByText("Ship realtime board v2"),
  ).toBeVisible({ timeout: realtimeTimeout });

  await taskCardByTitle(pageOne, "Ship realtime board v2")
    .getByRole("button", { name: /delete task/i })
    .click();

  await expect(taskCardByTitle(pageOne, "Ship realtime board v2")).toHaveCount(0, {
    timeout: realtimeTimeout,
  });
  await expect(taskCardByTitle(pageTwo, "Ship realtime board v2")).toHaveCount(0, {
    timeout: realtimeTimeout,
  });
  await pageOne.getByRole("button", { name: /activity/i }).click();
  await expect(
    pageOne.getByText(/deleted “Ship realtime board v2”/i).first(),
  ).toBeVisible();

  await contextOne.close();
  await contextTwo.close();
});
