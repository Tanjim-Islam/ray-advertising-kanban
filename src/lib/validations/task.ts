import { z } from "zod";

export const taskStatusSchema = z.enum(["TODO", "IN_PROGRESS", "DONE"]);

export const createTaskSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(1).max(500),
  status: taskStatusSchema,
  actorUserId: z.string().min(1),
  clientRequestId: z.string().uuid().optional().nullable(),
});

export const updateTaskSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(1).max(500),
  actorUserId: z.string().min(1),
});

export const deleteTaskSchema = z.object({
  actorUserId: z.string().min(1),
});

export const moveTaskSchema = z.object({
  taskId: z.string().min(1),
  toStatus: taskStatusSchema,
  toIndex: z.number().int().min(0),
  actorUserId: z.string().min(1),
  clientRequestId: z.string().uuid().optional().nullable(),
});

export const reorderTaskSchema = z.object({
  taskId: z.string().min(1),
  status: taskStatusSchema,
  toIndex: z.number().int().min(0),
  actorUserId: z.string().min(1),
  clientRequestId: z.string().uuid().optional().nullable(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type DeleteTaskInput = z.infer<typeof deleteTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type MoveTaskInput = z.infer<typeof moveTaskSchema>;
export type ReorderTaskInput = z.infer<typeof reorderTaskSchema>;
