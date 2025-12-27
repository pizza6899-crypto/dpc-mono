import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateWithdrawRequestDto {
  @ApiProperty({
    description: '출금할 금액 (사용자 기준 통화)',
    example: 100,
    minimum: 1,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @Transform(({ value }) => parseFloat(value))
  amount: number;

  @ApiProperty({
    description: '출금할 암호화폐 티커',
    example: 'maticmainnet',
  })
  @IsNotEmpty()
  @IsString()
  cryptoCurrency: string;

  @ApiProperty({
    description: '출금할 지갑 주소',
    example: '0xE8c715b75150BaE2E0E0F8844e0646CD65181D18',
  })
  @IsNotEmpty()
  @IsString()
  address: string;

  @ApiProperty({
    description: '출금할 추가 ID',
    example: '',
  })
  @IsOptional()
  @IsString()
  addressExtraId?: string;
}
