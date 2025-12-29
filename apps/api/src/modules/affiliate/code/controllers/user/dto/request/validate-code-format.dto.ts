// src/modules/affiliate/code/controllers/user/dto/request/validate-code-format.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class ValidateCodeFormatDto {
  @ApiProperty({
    description: 'Code to validate / 검증할 코드',
    example: 'SUMMER2024',
  })
  @IsString()
  code: string;
}

