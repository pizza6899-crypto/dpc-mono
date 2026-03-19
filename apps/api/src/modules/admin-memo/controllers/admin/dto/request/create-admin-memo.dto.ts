import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import type { AdminMemoTargetType } from '../../../../domain';

/**
 * 관리자 메모 생성 요청 DTO
 */
export class CreateAdminMemoDto {
  @ApiProperty({
    description: 'Target Type / 메모 대상 타입',
    example: 'DEPOSIT',
    enum: ['USER', 'DEPOSIT'],
  })
  @IsNotEmpty()
  @IsEnum(['USER', 'DEPOSIT'])
  targetType: AdminMemoTargetType;

  @ApiProperty({
    description: 'Target ID / 메모 대상 ID',
    example: '123456789',
  })
  @IsNotEmpty()
  @IsString()
  targetId: string;

  @ApiProperty({
    description: 'Memo content / 메모 내용',
    example: '입금자명 불일치 확인 필요',
    maxLength: 2000,
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(2000)
  content: string;
}
