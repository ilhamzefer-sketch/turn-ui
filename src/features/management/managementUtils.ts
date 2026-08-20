export function apiMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}
