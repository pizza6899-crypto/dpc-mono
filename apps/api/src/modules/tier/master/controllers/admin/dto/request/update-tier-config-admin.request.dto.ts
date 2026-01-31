import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateTierConfigAdminRequestDto {
    @ApiProperty({
        description: 'Enable/Disable promotion / 승급 활성화 여부',
        example: true,
        required: false,
    })
    @IsBoolean()
    @IsOptional()
    isPromotionEnabled?: boolean;

    @ApiProperty({
        description: 'Enable/Disable downgrade / 강등 활성화 여부',
        example: false,
        required: false,
    })
    @IsBoolean()
    @IsOptional()
    isDowngradeEnabled?: boolean;
}
