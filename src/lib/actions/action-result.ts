export type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

export function ok<T>(data: T): ActionResult<T> {
  return { success: true, data };
}

export function fail(error: string, fieldErrors?: Record<string, string[]>): ActionResult<never> {
  return { success: false, error, fieldErrors };
}

/** Generic message shown to users instead of leaking internal error details. */
export const GENERIC_ERROR = 'Something went wrong. Please try again.';
