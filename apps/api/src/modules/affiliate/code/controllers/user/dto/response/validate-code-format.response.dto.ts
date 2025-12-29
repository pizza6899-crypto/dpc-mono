// src/modules/affiliate/code/controllers/user/dto/response/validate-code-format.response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class ValidateCodeFormatResponseDto {
  @ApiProperty({
    description: 'Is valid / 유효한 코드인지 여부',
    example: true,
  })
  isValid: boolean;
}

