import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Length, Matches, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateCodeAdminRequestDto {
    @ApiPropertyOptional({
        description: 'Campaign name (optional) / 캠페인 이름 (선택)',
        example: 'Summer Promotion',
    })
    @IsOptional()
    @IsString()
    @Length(1, 50)
    campaignName?: string;

    @ApiPropertyOptional({
        description: 'Is active status / 활성화 여부',
        example: true,
    })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @ApiPropertyOptional({
        description: 'Is default code / 기본 코드 여부',
        example: false,
    })
    @IsOptional()
    @IsBoolean()
    isDefault?: boolean;
}
