import { describe, expect, it } from "vitest";

import {
  canRolePerformTaskAction,
  getAllowedTaskPermissions,
  getRoleAccess,
} from "@/features/tasks/lib/role-access";

describe("role access", () => {
  it("grants full task permissions to Product Lead", () => {
    expect(getAllowedTaskPermissions("Product Lead")).toEqual([
      "createTask",
      "editTask",
      "moveTask",
      "reorderTask",
      "deleteTask",
    ]);
  });

  it("blocks destructive access for Frontend Engineer", () => {
    expect(canRolePerformTaskAction("Frontend Engineer", "deleteTask")).toBe(
      false,
    );
    expect(canRolePerformTaskAction("Frontend Engineer", "editTask")).toBe(
      true,
    );
  });

  it("limits QA Analyst to movement-only board actions", () => {
    expect(getRoleAccess("QA Analyst")).toEqual({
      createTask: false,
      editTask: false,
      moveTask: true,
      reorderTask: true,
      deleteTask: false,
    });
  });

  it("denies access for unknown roles", () => {
    expect(getRoleAccess("Observer")).toEqual({
      createTask: false,
      editTask: false,
      moveTask: false,
      reorderTask: false,
      deleteTask: false,
    });
  });
});
