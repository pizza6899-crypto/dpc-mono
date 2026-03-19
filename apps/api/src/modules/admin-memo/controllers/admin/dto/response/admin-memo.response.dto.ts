import { ApiProperty } from '@nestjs/swagger';
import type { AdminMemoTargetType } from '../../../../domain';

/**
 * 관리자 메모 응답 DTO
 */
export class AdminMemoResponseDto {
  @ApiProperty({
    description: 'Memo ID / 메모 ID',
    example: '123456789',
  })
  id: string;

  @ApiProperty({
    description: 'Admin ID / 작성 관리자 ID',
    example: '1',
  })
  adminId: string;

  @ApiProperty({
    description: 'Admin Nickname / 작성 관리자 닉네임',
    example: 'SuperAdmin',
    required: false,
  })
  adminNickname?: string;

  @ApiProperty({
    description: 'Target Type / 메모 대상 타입',
    example: 'DEPOSIT',
  })
  targetType: AdminMemoTargetType;

  @ApiProperty({
    description: 'Target ID / 메모 대상 ID',
    example: '123456789',
  })
  targetId: string;

  @ApiProperty({
    description: 'Content / 메모 내용',
    example: '입금자명 불일치 확인 필요',
  })
  content: string;

  @ApiProperty({
    description: 'Created At / 작성 일시',
    example: '2024-03-06T09:00:00.000Z',
  })
  createdAt: Date;
}
