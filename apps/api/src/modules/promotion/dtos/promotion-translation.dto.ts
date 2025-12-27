import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class UpsertPromotionTranslationDto {
  @ApiProperty({
    description: 'Language code / 언어 코드',
    example: 'ko',
  })
  @IsString()
  @IsNotEmpty()
  language: string;

  @ApiProperty({
    description: 'Promotion name / 프로모션 이름',
    example: '첫 충전 보너스',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Promotion description / 프로모션 설명',
    example: '첫 충전 시 100% 보너스를 받으세요!',
    required: false,
    nullable: true,
  })
  @IsString()
  @IsOptional()
  description?: string | null;
}

export class PromotionTranslationResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  promotionId: number;

  @ApiProperty()
  language: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ nullable: true })
  description: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
