import { applyDecorators } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import { apiErrorResponseOpenApiSchema } from '../helpers/response/api-error-response.dto.js';

export const ApiErrorResponses = (...statuses: number[]) =>
  applyDecorators(
    ...statuses.map((status) =>
      ApiResponse({
        status,
        description: `Error response (${status}). Codes: unauthorized, not_found, validation_error, internal_error.`,
        schema: apiErrorResponseOpenApiSchema,
      }),
    ),
  );
