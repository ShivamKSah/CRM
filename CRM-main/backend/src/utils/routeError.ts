import type { Response } from 'express';

export function handleRouteError(
  res: Response,
  err: unknown,
  fallback: string,
  status = 500
): void {
  console.error(fallback, err);
  const message = err instanceof Error ? err.message : fallback;
  res.status(status).json({ error: message });
}
