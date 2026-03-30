import { Global, Module } from '@nestjs/common';
import { SnowflakeService } from './snowflake.service';

/**
 * Snowflake ID 생성 모듈
 *
 * 분산 환경에서 고유한 ID를 생성하기 위한 Snowflake 서비스를 제공합니다.
 *
 * @example
 * // 다른 모듈에서 사용하기
 * // @Global() 설정으로 imports 불필요
 * @Module({
 *   providers: [YourService],
 * })
 * export class YourModule {}
 */
@Global()
@Module({
  providers: [SnowflakeService],
  exports: [SnowflakeService],
})
export class SnowflakeModule {}
