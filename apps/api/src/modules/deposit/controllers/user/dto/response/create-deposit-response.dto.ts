// src/modules/deposit/dtos/create-deposit-response.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDepositResponseDto {
  // 암호화폐 입금 응답 필드
  @ApiPropertyOptional({
    description: 'Payment address (결제 주소, 암호화폐 입금 시)',
    example: 'TJ8yt3x9AowmQ8WygeYKwUT9TajRE4iCPx',
  })
  payAddress?: string;

  @ApiPropertyOptional({
    description: 'Payment currency (결제 통화, 암호화폐 입금 시)',
    example: 'trx',
  })
  payCurrency?: string;

  @ApiPropertyOptional({
    description:
      'Payment address extra ID (추가 ID, 예: 태그, 메모 등 네트워크별 필요시 사용)',
    example: null,
    nullable: true,
  })
  payAddressExtraId?: string | null;

  @ApiPropertyOptional({
    description: 'Payment network (네트워크, 암호화폐 입금 시)',
    example: 'trx',
  })
  payNetwork?: string;

  // 무통장 입금 응답 필드
  @ApiPropertyOptional({
    description: 'Bank name (은행명, 무통장 입금 시)',
    example: 'KB국민은행',
  })
  bankName?: string;

  @ApiPropertyOptional({
    description: 'Account number (계좌번호, 무통장 입금 시)',
    example: '123-456-789012',
  })
  accountNumber?: string;

  @ApiPropertyOptional({
    description: 'Account holder name (예금주명, 무통장 입금 시)',
    example: '주식회사 DPC',
  })
  accountHolder?: string;

  @ApiPropertyOptional({
    description: 'Transaction ID (입금 대기 중인 거래 ID)',
    example: '1234567890',
  })
  transactionId?: string;

  @ApiPropertyOptional({
    description: 'Whether this is a duplicate request (중복 요청 여부)',
    example: false,
  })
  isDuplicate?: boolean;

  @ApiPropertyOptional({
    description: 'Deposit Record ID (입금 기록 ID)',
  })
  id?: string;
}

