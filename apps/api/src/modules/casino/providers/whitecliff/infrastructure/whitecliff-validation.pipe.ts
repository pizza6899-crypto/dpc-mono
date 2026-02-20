import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { WhitecliffValidationException } from './whitecliff-exception.filter';

/**
 * Whitecliff 전용 Validation Pipe
 * - class-validator를 사용하여 요청 데이터 검증
 * - 실패 시 WhitecliffValidationException 발생 -> Filter가 처리
 */
@Injectable()
export class WhitecliffValidationPipe implements PipeTransform<any> {
  async transform(value: any, { metatype }: ArgumentMetadata) {
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    const object = plainToInstance(metatype, value);
    const errors = await validate(object, {
      whitelist: true, // DTO에 없는 필드 제거 (보안)
      forbidNonWhitelisted: false,
    });

    if (errors.length > 0) {
      throw new WhitecliffValidationException(errors);
    }

    return object;
  }

  private toValidate(metatype: Function): boolean {
    const types: Function[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }
}
