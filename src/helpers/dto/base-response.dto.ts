export interface ApiSuccessResponse<T> {
  data: T;
}

export type ApiErrorCode =
  'unauthorized' | 'not_found' | 'validation_error' | 'internal_error';

export interface ApiErrorResponse {
  error: {
    code: ApiErrorCode;
    message: string;
    fields?: Record<string, string>;
  };
}
