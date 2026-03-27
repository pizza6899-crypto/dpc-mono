import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ArtifactGrade } from '@prisma/client';

/**
 * [Artifact Draw] 유물 뽑기 통합 요청 DTO
 */
export class DrawArtifactRequestDto {
  @ApiProperty({
    description: 'Draw type / 뽑기 타입 (1회 또는 11회)',
    enum: ['SINGLE', 'TEN'],
    example: 'SINGLE',
  })
  @IsEnum(['SINGLE', 'TEN'])
  @IsNotEmpty()
  type: 'SINGLE' | 'TEN';

  @ApiProperty({
    description: 'Payment method / 지불 수단 (재화 또는 티켓)',
    enum: ['CURRENCY', 'TICKET'],
    example: 'CURRENCY',
  })
  @IsEnum(['CURRENCY', 'TICKET'])
  @IsNotEmpty()
  paymentType: 'CURRENCY' | 'TICKET';

  @ApiPropertyOptional({
    description: 'Ticket type (Required if paymentType is TICKET) / 티켓 종류 (티켓 선택 시 필수)',
    example: 'ALL',
  })
  @IsString()
  @IsOptional()
  ticketType?: 'ALL' | ArtifactGrade;
}
