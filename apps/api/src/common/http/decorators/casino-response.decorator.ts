import type { Type } from '@nestjs/common';
import { applyDecorators } from '@nestjs/common';
import {
  ApiResponse as SwaggerApiResponse,
  ApiExtraModels,
  getSchemaPath,
} from '@nestjs/swagger';
import { SkipTransform } from 'src/common/http/decorators/skip-transform.decorator';

/**
 * Casino 컨트롤러에서 사용하는 전용 응답 데코레이터
 * TransformInterceptor를 건너뛰고 원본 응답 형식을 유지
 */
export const CasinoResponse = <TModel extends Type<any>>(
  model?: TModel,
  options: {
    status?: number;
    description?: string;
    isArray?: boolean;
  } = {},
) => {
  const { status = 200, description = 'Success', isArray = false } = options;

  const decorators = [
    SkipTransform(), // TransformInterceptor 건너뛰기
    SwaggerApiResponse({
      status,
      description,
      schema: model
        ? isArray
          ? {
              type: 'array',
              items: { $ref: getSchemaPath(model) },
            }
          : { $ref: getSchemaPath(model) }
        : { type: 'object' },
    }),
  ];

  if (model) {
    decorators.unshift(ApiExtraModels(model));
  }

  return applyDecorators(...decorators);
};
