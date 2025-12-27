import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class CustomValidationPipe implements PipeTransform<any> {
  private readonly logger = new Logger(CustomValidationPipe.name);

  async transform(value: any, { metatype }: ArgumentMetadata) {
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    // 빈 문자열이나 null/undefined인 경우 처리
    if (value === null || value === undefined || value === '') {
      // plainToInstance에 빈 객체를 전달하여 기본값으로 처리
      const object = plainToInstance(metatype, {}, {});
      const errors = await validate(object);

      const validErrors = errors.filter(
        (error) =>
          error.property &&
          (!error.constraints ||
            !error.constraints.unknownValue ||
            Object.keys(error.constraints).length > 1),
      );

      if (validErrors.length > 0) {
        const formattedErrors = validErrors.map((error) => ({
          field: error.property,
          value: error.value,
          constraints: error.constraints,
        }));

        throw new BadRequestException({
          message: 'Validation failed',
          error: 'Bad Request',
          details: formattedErrors,
        });
      }

      return object;
    } else {
      const object = plainToInstance(metatype, value, {});
      const errors = await validate(object);

      const validErrors = errors.filter(
        (error) =>
          error.property &&
          (!error.constraints ||
            !error.constraints.unknownValue ||
            Object.keys(error.constraints).length > 1),
      );

      if (validErrors.length > 0) {
        const formattedErrors = validErrors.map((error) => ({
          field: error.property,
          value: error.value,
          constraints: error.constraints,
        }));

        throw new BadRequestException({
          message: 'Validation failed',
          error: 'Bad Request',
          details: formattedErrors,
        });
      }

      return object;
    }
  }

  private toValidate(metatype: Function): boolean {
    const types: Function[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }
}
