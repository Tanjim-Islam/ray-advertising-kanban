import { NextResponse } from "next/server";
import { ZodError, type ZodSchema } from "zod";

import { logger } from "@/lib/utils/logger";

export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
  }
}

export async function parseJsonBody<T>(
  request: Request,
  schema: ZodSchema<T>,
) {
  const body = (await request.json()) as unknown;

  return schema.parse(body);
}

export function jsonResponse<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function handleRouteError(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        message: "The request payload is invalid.",
        issues: error.flatten(),
      },
      { status: 400 },
    );
  }

  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        message: error.message,
      },
      { status: error.statusCode },
    );
  }

  logger.error("Unexpected route handler failure.", error);

  return NextResponse.json(
    {
      message: "The server could not process this request.",
    },
    { status: 500 },
  );
}
