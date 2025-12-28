/**
 * 도메인 레이어의 기본 예외 클래스
 *
 * 비즈니스 규칙 위반 시 발생하며, 서비스 레이어에서 처리하거나
 * 글로벌 필터에서 적절한 HTTP 상태 코드로 변환됩니다.
 */
export class DomainException extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}
