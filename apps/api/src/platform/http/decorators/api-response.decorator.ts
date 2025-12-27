import { applyDecorators, Type } from '@nestjs/common';
import {
  ApiResponse as SwaggerApiResponse,
  ApiExtraModels,
  getSchemaPath,
} from '@nestjs/swagger';
import { ApiResponseDto, ErrorResponseDto } from '../types/response.types';
import { PaginatedResponseDto } from '../types/pagination.types';
import { Paginated } from './paginated.decorator';

/**
 * Swagger에서 표준 API 응답 스키마를 적용하는 데코레이터
 */
export const ApiStandardResponse = <TModel extends Type<any>>(
  model?: TModel,
  options: {
    status?: number;
    description?: string;
    isArray?: boolean;
  } = {},
) => {
  const { status = 200, description = 'Success', isArray = false } = options;

  const decorators = [
    ApiExtraModels(ApiResponseDto),
    SwaggerApiResponse({
      status,
      description,
      schema: {
        allOf: [
          { $ref: getSchemaPath(ApiResponseDto) },
          {
            properties: {
              data: model
                ? isArray
                  ? {
                      type: 'array',
                      items: { $ref: getSchemaPath(model) },
                    }
                  : { $ref: getSchemaPath(model) }
                : { type: 'object' },
            },
          },
        ],
      },
    }),
  ];

  if (model) {
    decorators.unshift(ApiExtraModels(model));
  }

  return applyDecorators(...decorators);
};

/**
 * 페이지네이션 응답을 위한 데코레이터
 */
export const ApiPaginatedResponse = <TModel extends Type<any>>(
  model: TModel,
  options: {
    status?: number;
    description?: string;
  } = {},
) => {
  const { status = 200, description = 'Paginated Success' } = options;

  return applyDecorators(
    Paginated(),
    ApiExtraModels(model, PaginatedResponseDto),
    SwaggerApiResponse({
      status,
      description,
      schema: {
        allOf: [
          { $ref: getSchemaPath(PaginatedResponseDto) },
          {
            properties: {
              data: {
                type: 'array',
                items: { $ref: getSchemaPath(model) },
              },
            },
          },
        ],
      },
    }),
  );
};

/**
 * 에러 응답을 위한 데코레이터
 */
export const ApiErrorResponse = (
  status: number,
  description?: string,
  example?: any,
) => {
  return applyDecorators(
    ApiExtraModels(ErrorResponseDto),
    SwaggerApiResponse({
      status,
      description: description || `${status} Error`,
      schema: {
        $ref: getSchemaPath(ErrorResponseDto),
      },
      example,
    }),
  );
};

/**
 * 모든 표준 에러 응답을 한번에 적용하는 데코레이터
 */
export const ApiStandardErrors = () => {
  return applyDecorators(ApiErrorResponse(400, 'Bad Request'));
};
