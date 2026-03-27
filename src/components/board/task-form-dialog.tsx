"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const taskFormSchema = z.object({
  title: z.string().trim().min(3, "Use at least 3 characters.").max(120),
  description: z
    .string()
    .trim()
    .min(1, "Add a short description for the task.")
    .max(500),
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

const DEFAULT_VALUES: TaskFormValues = {
  title: "",
  description: "",
};

export interface TaskFormDialogProps {
  initialValues?: Partial<TaskFormValues>;
  mode: "create" | "edit";
  onClose: () => void;
  onSubmit: (values: TaskFormValues) => Promise<void>;
  open: boolean;
  statusLabel?: string;
  submitting: boolean;
}

export function TaskFormDialog({
  initialValues,
  mode,
  onClose,
  onSubmit,
  open,
  statusLabel,
  submitting,
}: TaskFormDialogProps) {
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      ...DEFAULT_VALUES,
      ...initialValues,
    },
  });

  useEffect(() => {
    form.reset({
      ...DEFAULT_VALUES,
      ...initialValues,
    });
  }, [form, initialValues, open]);

  return (
    <Dialog
      open={open}
      onClose={submitting ? undefined : onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: "16px",
          boxShadow: "var(--shadow-soft)",
          border: "1px solid var(--border)",
          backgroundColor: "var(--surface-raised)",
          color: "var(--text-primary)",
        },
      }}
    >
      <DialogTitle sx={{ fontWeight: 600, fontSize: "1rem", pb: 0 }}>
        {mode === "create" ? "New task" : "Edit task"}
      </DialogTitle>
      <DialogContent sx={{ paddingTop: "12px !important" }}>
        <p className="mb-4 text-sm text-[var(--text-secondary)]">
          {mode === "create"
            ? `Add to ${statusLabel ?? "the board"}`
            : "Update task details"}
        </p>
        <form
          id="task-form"
          className="grid gap-5 pt-1"
          onSubmit={form.handleSubmit(async (values) => {
            try {
              await onSubmit(values);
            } catch {
              return;
            }
          })}
        >
          <TextField
            label="Title"
            fullWidth
            size="small"
            disabled={submitting}
            error={!!form.formState.errors.title}
            helperText={form.formState.errors.title?.message}
            sx={{
              "& .MuiInputLabel-root": {
                color: "var(--text-tertiary)",
              },
              "& .MuiOutlinedInput-root": {
                backgroundColor: "var(--surface-raised)",
                color: "var(--text-primary)",
                "& fieldset": {
                  borderColor: "var(--border)",
                },
                "&:hover fieldset": {
                  borderColor: "var(--border-strong)",
                },
              },
              "& .MuiFormHelperText-root": {
                marginLeft: 0,
              },
            }}
            {...form.register("title")}
          />
          <TextField
            label="Description"
            fullWidth
            multiline
            minRows={3}
            size="small"
            disabled={submitting}
            error={!!form.formState.errors.description}
            helperText={form.formState.errors.description?.message}
            sx={{
              "& .MuiInputLabel-root": {
                color: "var(--text-tertiary)",
              },
              "& .MuiOutlinedInput-root": {
                backgroundColor: "var(--surface-raised)",
                color: "var(--text-primary)",
                alignItems: "flex-start",
                "& fieldset": {
                  borderColor: "var(--border)",
                },
                "&:hover fieldset": {
                  borderColor: "var(--border-strong)",
                },
              },
              "& .MuiFormHelperText-root": {
                marginLeft: 0,
              },
            }}
            {...form.register("description")}
          />
        </form>
      </DialogContent>
      <DialogActions
        sx={{
          px: 3,
          pb: 2.5,
          borderTop: "1px solid var(--border)",
        }}
      >
        <Button
          onClick={onClose}
          disabled={submitting}
          color="secondary"
          size="small"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          form="task-form"
          variant="contained"
          size="small"
          disabled={submitting}
          disableElevation
          startIcon={
            submitting ? <CircularProgress size={14} color="inherit" /> : null
          }
        >
          {mode === "create" ? "Create task" : "Save changes"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
