import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Length, IsNumberString } from 'class-validator';

export class CreateCodeAdminRequestDto {
    @ApiProperty({
        description: 'Target User ID / 대상 사용자 ID',
        example: '1234567890123456789',
        type: String,
    })
    @IsNotEmpty()
    @IsString()
    @IsNumberString()
    userId: string;

    @ApiPropertyOptional({
        description: 'Campaign name (optional) / 캠페인 이름 (선택)',
        example: 'Twitter Campaign',
    })
    @IsOptional()
    @IsString()
    @Length(1, 50)
    campaignName?: string;
}
