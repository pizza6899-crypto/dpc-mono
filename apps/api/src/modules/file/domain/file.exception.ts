import { HttpStatus } from '@nestjs/common';
import { MessageCode } from '@repo/shared';
import { DomainException } from 'src/common/exception/domain.exception';

/**
 * File 도메인 예외 기본 클래스
 *
 * @errorCode MessageCode.VALIDATION_ERROR
 */
export class FileException extends DomainException {
  constructor(
    message: string,
    errorCode: MessageCode = MessageCode.FILE_POLICY_VIOLATION,
    httpStatus: HttpStatus = HttpStatus.BAD_REQUEST,
  ) {
    super(message, errorCode, httpStatus);
    this.name = 'FileException';
  }
}

/**
 * File을 찾을 수 없을 때 발생하는 예외
 *
 * @errorCode MessageCode.FILE_NOT_FOUND
 * @httpStatus 404
 */
export class FileNotFoundException extends FileException {
  constructor() {
    super('File not found.', MessageCode.FILE_NOT_FOUND, HttpStatus.NOT_FOUND);
    this.name = 'FileNotFoundException';
  }
}

/**
 * 파일 업로드 실패 시 발생하는 예외
 *
 * @errorCode MessageCode.FILE_UPLOAD_FAILED
 * @httpStatus 500
 */
export class FileUploadFailedException extends FileException {
  constructor(message: string) {
    super(
      `File upload failed: ${message}`,
      MessageCode.FILE_UPLOAD_FAILED,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
    this.name = 'FileUploadFailedException';
  }
}

/**
 * 파일 유효성 검사 실패 시 발생하는 예외 (크기, 형식 등)
 * 기본적으로 VALIDATION_ERROR를 사용하지만, 상세 에러 코드를 주입할 수 있음.
 *
 * @errorCode MessageCode.VALIDATION_ERROR (Default)
 * @httpStatus 400
 */
export class FileValidationException extends FileException {
  constructor(
    message: string,
    errorCode: MessageCode = MessageCode.FILE_INVALID_FORMAT,
  ) {
    super(message, errorCode, HttpStatus.BAD_REQUEST);
    this.name = 'FileValidationException';
  }
}

/**
 * 필수 파일이 누락되었을 때 발생하는 예외
 *
 * @errorCode MessageCode.FILE_REQUIRED
 * @httpStatus 400
 */
export class FileRequiredException extends FileException {
  constructor(message: string = 'File is required.') {
    super(message, MessageCode.FILE_REQUIRED, HttpStatus.BAD_REQUEST);
    this.name = 'FileRequiredException';
  }
}

/**
 * 파일 정책 위반 시 발생하는 예외 (권한 없음 등)
 *
 * @errorCode MessageCode.FILE_POLICY_VIOLATION
 * @httpStatus 403
 */
export class FilePolicyViolationException extends FileException {
  constructor(usageType: string, reason: string) {
    super(
      `File policy violation for ${usageType}: ${reason}`,
      MessageCode.FILE_POLICY_VIOLATION,
      HttpStatus.FORBIDDEN,
    );
    this.name = 'FilePolicyViolationException';
  }
}
