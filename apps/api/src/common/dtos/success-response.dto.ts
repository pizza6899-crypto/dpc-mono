// src/common/dtos/success-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class SuccessResponseDto {
    @ApiProperty({ description: 'Operation successful', example: true })
    success: boolean;
}
