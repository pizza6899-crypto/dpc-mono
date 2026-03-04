// src/modules/deposit/dtos/create-deposit-response.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDepositResponseDto {
  // 암호화폐 입금 응답 필드
  @ApiPropertyOptional({
    description: '결제 주소 / Payment address',
    example: 'TJ8yt3x9AowmQ8WygeYKwUT9TajRE4iCPx',
  })
  payAddress?: string;

  @ApiPropertyOptional({
    description: '결제 통화 / Payment currency',
    example: 'trx',
  })
  payCurrency?: string;

  @ApiPropertyOptional({
    description: '추가 ID (태그, 메모 등) / Payment address extra ID (Tag, Memo, etc.)',
    example: null,
    nullable: true,
  })
  payAddressExtraId?: string | null;

  @ApiPropertyOptional({
    description: '결제 네트워크 / Payment network',
    example: 'trx',
  })
  payNetwork?: string;

  // 무통장 입금 응답 필드
  @ApiPropertyOptional({
    description: '은행명 / Bank name',
    example: 'KB국민은행',
  })
  bankName?: string;

  @ApiPropertyOptional({
    description: '계좌번호 / Account number',
    example: '123-456-789012',
  })
  accountNumber?: string;

  @ApiPropertyOptional({
    description: '예금주명 / Account holder name',
    example: '주식회사 DPC',
  })
  accountHolder?: string;

  @ApiPropertyOptional({
    description: '거래 ID / Transaction ID',
    example: '1234567890',
  })
  transactionId?: string;

  @ApiPropertyOptional({
    description: '중복 요청 여부 / Is duplicate request',
    example: false,
  })
  isDuplicate?: boolean;

  @ApiPropertyOptional({
    description: '입금 기록 ID / Deposit Record ID',
  })
  id?: string;
}
