import { DcCommonResponseDto } from '../dtos/callback.dto';

/**
 * DC 콜백 검증 실패 예외
 * Guard에서 검증 실패 시 던지는 예외
 */
export class DcCallbackValidationException extends Error {
  constructor(public readonly response: DcCommonResponseDto) {
    super('DC Callback validation failed');
    this.name = 'DcCallbackValidationException';
  }
}

