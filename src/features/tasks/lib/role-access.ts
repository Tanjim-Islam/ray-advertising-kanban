export const TASK_PERMISSION_ORDER = [
  "createTask",
  "editTask",
  "moveTask",
  "reorderTask",
  "deleteTask",
] as const;

export type TaskPermission = (typeof TASK_PERMISSION_ORDER)[number];

export interface RoleAccess {
  createTask: boolean;
  deleteTask: boolean;
  editTask: boolean;
  moveTask: boolean;
  reorderTask: boolean;
}

export const TASK_PERMISSION_LABELS: Record<TaskPermission, string> = {
  createTask: "Create",
  editTask: "Edit",
  moveTask: "Move",
  reorderTask: "Reorder",
  deleteTask: "Delete",
};

export const TASK_PERMISSION_DESCRIPTIONS: Record<TaskPermission, string> = {
  createTask: "create tasks",
  editTask: "edit task details",
  moveTask: "move tasks between lanes",
  reorderTask: "reorder tasks inside a lane",
  deleteTask: "delete tasks",
};

export const ROLE_ACCESS_MATRIX = {
  "Product Lead": {
    createTask: true,
    editTask: true,
    moveTask: true,
    reorderTask: true,
    deleteTask: true,
  },
  "Frontend Engineer": {
    createTask: true,
    editTask: true,
    moveTask: true,
    reorderTask: true,
    deleteTask: false,
  },
  "QA Analyst": {
    createTask: false,
    editTask: false,
    moveTask: true,
    reorderTask: true,
    deleteTask: false,
  },
} as const satisfies Record<string, RoleAccess>;

export type SimulatedUserRole = keyof typeof ROLE_ACCESS_MATRIX;

export const ROLE_ACCESS_ORDER = Object.keys(
  ROLE_ACCESS_MATRIX,
) as SimulatedUserRole[];

const NO_ACCESS: RoleAccess = {
  createTask: false,
  editTask: false,
  moveTask: false,
  reorderTask: false,
  deleteTask: false,
};

export function getRoleAccess(role: string | null | undefined): RoleAccess {
  if (!role) {
    return NO_ACCESS;
  }

  return ROLE_ACCESS_MATRIX[role as SimulatedUserRole] ?? NO_ACCESS;
}

export function canRolePerformTaskAction(
  role: string | null | undefined,
  permission: TaskPermission,
) {
  return getRoleAccess(role)[permission];
}

export function getAllowedTaskPermissions(role: string | null | undefined) {
  return TASK_PERMISSION_ORDER.filter((permission) =>
    canRolePerformTaskAction(role, permission),
  );
}

export function getRoleAccessDeniedMessage(
  role: string | null | undefined,
  permission: TaskPermission,
) {
  const subject = role ?? "This teammate";

  return `${subject} cannot ${TASK_PERMISSION_DESCRIPTIONS[permission]}.`;
}
