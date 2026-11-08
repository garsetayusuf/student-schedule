export class ApiError extends Error {
  constructor(
    readonly code:
      'unauthorized' | 'not_found' | 'validation_error' | 'internal_error',
    message: string,
    readonly status: number,
    readonly fields?: Record<string, string>,
  ) {
    super(message);
  }
}
