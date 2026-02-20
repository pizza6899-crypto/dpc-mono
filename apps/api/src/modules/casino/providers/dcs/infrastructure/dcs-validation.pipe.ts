import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { DcsValidationException } from './dcs-exception.filter';

/**
 * DCS 전용 Validation Pipe
 * - class-validator를 사용하여 DTO 검증
 * - 검증 실패 시 DcsValidationException을 던져서 DcsExceptionFilter가 처리하도록 함
 * - transform: true 옵션과 유사하게 동작하여, DTO 타입으로 변환된 객체 반환
 */
@Injectable()
export class DcsValidationPipe implements PipeTransform<any> {
  async transform(value: any, { metatype }: ArgumentMetadata) {
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    // transform: true (DTO 타입으로 인스턴스화)
    const object = plainToInstance(metatype, value);

    // 유효성 검사
    const errors = await validate(object, {
      whitelist: true, // DTO에 없는 필드 제거
      forbidNonWhitelisted: false, // 없는 필드가 있어도 에러는 안 냄 (유연성)
      transform: true, // 타입 변환
    });

    if (errors.length > 0) {
      // 에러 처리를 Filter에 위임하기 위해 커스텀 예외 발생
      throw new DcsValidationException(errors);
    }

    return object;
  }

  private toValidate(metatype: Function): boolean {
    const types: Function[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }
}
