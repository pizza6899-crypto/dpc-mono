import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';

/**
 * [Common] String 기반 ID를 BigInt로 변환하는 NestJS 전용 파이프
 */
@Injectable()
export class ParseBigIntPipe implements PipeTransform<string, bigint> {
  transform(value: string, metadata: ArgumentMetadata): bigint {
    try {
      if (!value) {
        throw new BadRequestException('ID is required');
      }
      return BigInt(value);
    } catch (error) {
      throw new BadRequestException(`Validation failed (BigInt string is expected) : ${value}`);
    }
  }
}
