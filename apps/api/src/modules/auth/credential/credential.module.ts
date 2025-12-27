import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';

/**
 * Credential 모듈
 *
 * 로그인/로그아웃 로직을 담당하는 하위 도메인 모듈입니다.
 *
 * 주요 책임:
 * - 사용자 자격 증명 검증 (ID/PW, 소셜 로그인)
 * - 로그인/로그아웃 Use Case 처리
 * - User/Admin별 인증 컨트롤러 제공
 *
 * 구조:
 * - application/: LoginUseCase 등 (Passport Guard 호출 후 로직)
 * - controllers/: User/Admin별 로그인 컨트롤러
 * - infrastructure/: Passport Strategies (Local, Social 등)
 */
@Module({
  imports: [],
  providers: [],
  exports: [],
})
export class CredentialModule {}
